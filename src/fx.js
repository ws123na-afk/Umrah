/* Gold dust night sky behind <main>, plus a celebratory burst.
   Needs global THREE (r149). Safe to load after </main>, before </body>. */
(function(){
"use strict";
window.UMRAH_FX={burst:function(){}};
try{
if(!window.THREE)return;
var THREE=window.THREE;
var reduce=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
var main=document.querySelector('main');
var PHONE=Math.min(screen.width||9999,window.innerWidth)<500;
var COARSE=!!(window.matchMedia&&matchMedia('(pointer: coarse)').matches);
var SLOW=PHONE||(COARSE&&window.innerWidth<900);

function glOk(){try{var c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')));}catch(e){return false;}}
if(!glOk())return;
function dpr(){return PHONE?1:Math.min(window.devicePixelRatio||1,1.5);}

/* small round sprite, shared by sky and burst */
var spriteTex=null;
function sprite(){
  if(spriteTex)return spriteTex;
  var c=document.createElement('canvas');c.width=c.height=64;
  var x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.75)');
  g.addColorStop(.55,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);
  spriteTex=new THREE.CanvasTexture(c);return spriteTex;}

var GOLDS=[0xC9A24B,0xE9CF8B,0xF7F1E3,0xE9CF8B,0xC9A24B];
function makeRenderer(cv){
  var r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'low-power'});
  r.setClearColor(0x000000,0);r.setPixelRatio(dpr());return r;}

/* ===================== SKY ===================== */
/* Layering: main is position:relative;z-index:4, so it is its own stacking
   context. A position:fixed canvas inside it with z-index:-1 paints above
   main's background but below all of main's content, without touching
   any other element. clip-path keeps it off the hero while main scrolls in. */
var sky=null;
function startSky(){
  if(sky||!main)return;sky={};
  var st=document.createElement('style');
  st.textContent='main{isolation:isolate}#fxsky{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:block;opacity:0;transition:opacity 1.6s ease}#fxsky.on{opacity:1}';
  document.head.appendChild(st);
  var cv=document.createElement('canvas');cv.id='fxsky';cv.setAttribute('aria-hidden','true');
  main.insertBefore(cv,main.firstChild);
  var renderer;
  try{renderer=makeRenderer(cv);}catch(e){cv.parentNode.removeChild(cv);return;}

  var W=window.innerWidth,H=window.innerHeight;
  var FOV=50,TAN=Math.tan(FOV*Math.PI/360);
  var scene=new THREE.Scene();
  var cam=new THREE.PerspectiveCamera(FOV,W/H,.5,200);

  /* dust: positions are normalised, the shader spreads them over the view and wraps y */
  var N=PHONE?400:900,i;
  var aP=new Float32Array(N*3),aS=new Float32Array(N),aPh=new Float32Array(N),aC=new Float32Array(N*3),col=new THREE.Color();
  for(i=0;i<N;i++){
    aP[i*3]=Math.random()*2-1;aP[i*3+1]=Math.random();aP[i*3+2]=12+Math.pow(Math.random(),.8)*58;
    aS[i]=.5+Math.pow(Math.random(),3)*2.2;aPh[i]=Math.random()*6.283;
    col.setHex(GOLDS[i%GOLDS.length]);aC[i*3]=col.r;aC[i*3+1]=col.g;aC[i*3+2]=col.b;}
  var g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(aP,3));
  g.setAttribute('aSize',new THREE.BufferAttribute(aS,1));
  g.setAttribute('aPhase',new THREE.BufferAttribute(aPh,1));
  g.setAttribute('aColor',new THREE.BufferAttribute(aC,3));
  var U={uTime:{value:0},uCamY:{value:0},uTan:{value:TAN},uAspect:{value:W/H},uScale:{value:H*.14*dpr()},uMap:{value:sprite()},uAlpha:{value:.5}};
  var mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
    vertexShader:[
      'attribute float aSize;attribute float aPhase;attribute vec3 aColor;',
      'uniform float uTime,uCamY,uTan,uAspect,uScale;',
      'varying vec3 vC;varying float vA;',
      'void main(){',
      ' float d=position.z;float span=d*2.0*uTan*1.15+4.0;',
      ' float wy=position.y*span+sin(uTime*.05+aPhase)*.6;',
      ' float y=uCamY+mod(wy-uCamY+span*.5,span)-span*.5;',
      ' float x=position.x*d*uTan*uAspect*1.1+sin(uTime*.07+aPhase*2.0)*.5;',
      ' vec4 mv=modelViewMatrix*vec4(x,y,-d,1.0);',
      ' gl_PointSize=clamp(aSize*uScale/-mv.z,1.0,24.0);',
      ' float tw=.55+.45*sin(uTime*(.6+fract(aPhase*7.3)*1.2)+aPhase);',
      ' vA=tw*(1.0-smoothstep(25.0,75.0,d)*.6);vC=aColor;',
      ' gl_Position=projectionMatrix*mv;}'].join('\n'),
    fragmentShader:[
      'uniform sampler2D uMap;uniform float uAlpha;varying vec3 vC;varying float vA;',
      'void main(){float a=texture2D(uMap,gl_PointCoord).a*vA*uAlpha;gl_FragColor=vec4(vC,a);}'].join('\n')});
  var dust=new THREE.Points(g,mat);dust.frustumCulled=false;scene.add(dust);

  /* 8-point stars (two overlapping squares), drawn as line segments */
  function starGeo(r){
    var p=[],k,a0,a1,j;
    for(k=0;k<2;k++)for(j=0;j<4;j++){a0=k*Math.PI/4+j*Math.PI/2;a1=a0+Math.PI/2;
      p.push(Math.cos(a0)*r,Math.sin(a0)*r,0,Math.cos(a1)*r,Math.sin(a1)*r,0);}
    var ri=r*.42;for(j=0;j<16;j++){a0=j/16*Math.PI*2;a1=(j+1)/16*Math.PI*2;
      p.push(Math.cos(a0)*ri,Math.sin(a0)*ri,0,Math.cos(a1)*ri,Math.sin(a1)*ri,0);}
    var sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(p),3));return sg;}
  var STARS=[{x:-.62,y:.15,d:34,r:5.5,o:.095,s:.035},{x:.7,y:.55,d:46,r:8,o:.085,s:-.025},{x:.08,y:.82,d:60,r:12,o:.075,s:.018},
    {x:-.45,y:.62,d:52,r:7,o:.08,s:-.03},{x:.48,y:.05,d:28,r:4.2,o:.1,s:.04}];
  if(PHONE)STARS.length=3;
  var stars=STARS.map(function(o){
    var m=new THREE.LineSegments(starGeo(o.r),new THREE.LineBasicMaterial({color:0xE9CF8B,transparent:true,opacity:o.o,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
    m.userData=o;m.rotation.set(Math.random()*.6-.3,Math.random()*.6-.3,Math.random()*1.6);m.frustumCulled=false;scene.add(m);return m;});

  /* parallax inputs */
  var tx=0,ty=0,cx=0,cy=0,camY=-window.scrollY*.004;
  if(!reduce){
    window.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;tx=e.clientX/window.innerWidth-.5;ty=e.clientY/window.innerHeight-.5;},{passive:true});
    window.addEventListener('deviceorientation',function(e){if(e.gamma==null)return;tx=Math.max(-1,Math.min(1,e.gamma/40))*.5;ty=Math.max(-1,Math.min(1,(e.beta-45)/40))*.5;},{passive:true});
  }

  function layout(){
    W=window.innerWidth;H=window.innerHeight;
    renderer.setPixelRatio(dpr());renderer.setSize(W,H,false);
    cam.aspect=W/H;cam.updateProjectionMatrix();U.uAspect.value=W/H;U.uScale.value=H*.14*dpr();
    var sp=Math.max(1.5,Math.min(2.2,W/H));
    stars.forEach(function(m){var o=m.userData;m.position.x=o.x*o.d*TAN*Math.min(sp,W/H)*.9;});}
  /* keep the canvas off the hero and below main's end */
  function clip(){var r=main.getBoundingClientRect(),t=Math.max(0,Math.round(r.top)),b=Math.max(0,Math.round(window.innerHeight-r.bottom));
    cv.style.clipPath=cv.style.webkitClipPath=(t||b)?'inset('+t+'px 0 '+b+'px 0)':'none';}

  var t0=performance.now(),last=0,raf=0,onScreen=true,visible=!document.hidden,lost=false;
  function draw(now){
    var t=(now-t0)/1000;U.uTime.value=t;
    var targetY=-window.scrollY*.004;camY+= (targetY-camY)*(reduce?1:.12);
    cx+=(tx-cx)*.04;cy+=(ty-cy)*.04;
    cam.position.set(cx*1.6,camY-cy*1.0,0);cam.rotation.set(cy*.025,-cx*.035,0);
    U.uCamY.value=camY;
    for(var k=0;k<stars.length;k++){var m=stars[k],o=m.userData,span=o.d*2*TAN*1.25+o.r*2,wy=o.y*span;
      m.position.y=camY+((wy-camY+span*.5)%span+span)%span-span*.5;m.position.z=-o.d;
      if(!reduce){m.rotation.z=o.s*t+k;m.rotation.x=Math.sin(t*.05+k)*.35;m.rotation.y=Math.cos(t*.04+k*2)*.35;}}
    renderer.render(scene,cam);}
  function loop(now){
    raf=0;if(!onScreen||!visible||lost)return;
    raf=requestAnimationFrame(loop);
    if(SLOW&&now-last<31)return;last=now;draw(now);}
  function kick(){if(reduce||lost){return;}if(!raf&&onScreen&&visible)raf=requestAnimationFrame(loop);}

  layout();clip();
  window.addEventListener('scroll',clip,{passive:true});
  var rt=0;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){try{layout();clip();if(reduce)draw(t0);}catch(e){}},160);});
  cv.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;},false);
  cv.addEventListener('webglcontextrestored',function(){lost=false;kick();},false);
  document.addEventListener('visibilitychange',function(){visible=!document.hidden;kick();});
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){onScreen=es[es.length-1].isIntersecting;kick();}).observe(main);}

  draw(t0);
  cv.classList.add('on');
  kick();
}

/* start after the hero has been scrolled past, or after a short idle */
var started=false;
function go(){if(started)return;started=true;window.removeEventListener('scroll',onScroll);try{startSky();}catch(e){}}
function onScroll(){var h=document.getElementById('hero');if(window.scrollY>(h?h.offsetHeight*.5:300))go();}
window.addEventListener('scroll',onScroll,{passive:true});
setTimeout(function(){if(window.requestIdleCallback)requestIdleCallback(go,{timeout:1500});else go();},1500);

/* ===================== BURST ===================== */
var active=null;
function burst(x,y){
  if(reduce)return;
  x=+x;y=+y;if(isNaN(x))x=window.innerWidth/2;if(isNaN(y))y=window.innerHeight/2;
  if(active){active.restart(x,y);return;}
  var cv=document.createElement('canvas');cv.setAttribute('aria-hidden','true');
  cv.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:80;pointer-events:none;display:block';
  document.body.appendChild(cv);
  var renderer;try{renderer=makeRenderer(cv);}catch(e){cv.parentNode.removeChild(cv);return;}
  var W=window.innerWidth,H=window.innerHeight;renderer.setSize(W,H,false);
  var cam=new THREE.OrthographicCamera(0,W,0,-H,-1,1);
  var N=PHONE?120:180,i;
  var pos=new Float32Array(N*3),vel=new Float32Array(N*2),sz=new Float32Array(N),life=new Float32Array(N),cl=new Float32Array(N*3),c=new THREE.Color();
  for(i=0;i<N;i++){c.setHex(GOLDS[i%GOLDS.length]);cl[i*3]=c.r;cl[i*3+1]=c.g;cl[i*3+2]=c.b;}
  var g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('aSize',new THREE.BufferAttribute(sz,1));
  g.setAttribute('aLife',new THREE.BufferAttribute(life,1));
  g.setAttribute('aColor',new THREE.BufferAttribute(cl,3));
  var U={uMap:{value:sprite()},uPR:{value:dpr()}};
  /* normal blending so the gold also shows over the ivory card */
  var mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthTest:false,depthWrite:false,blending:THREE.NormalBlending,
    vertexShader:'attribute float aSize;attribute float aLife;attribute vec3 aColor;uniform float uPR;varying float vL;varying vec3 vC;'+
      'void main(){vL=aLife;vC=aColor;gl_PointSize=aSize*uPR*(.4+.6*aLife);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform sampler2D uMap;varying float vL;varying vec3 vC;'+
      'void main(){float a=texture2D(uMap,gl_PointCoord).a*clamp(vL*1.4,0.0,1.0);gl_FragColor=vec4(vC,a);}'});
  var pts=new THREE.Points(g,mat);pts.frustumCulled=false;var scene=new THREE.Scene();scene.add(pts);
  var DUR=1.2,t0=0,ox=0,oy=0,prev=0,raf=0;
  function seed(px,py){ox=px;oy=py;t0=prev=performance.now();
    for(var i=0;i<N;i++){var a=Math.random()*Math.PI*2,s=(PHONE?210:280)*(.25+Math.pow(Math.random(),.6));
      vel[i*2]=Math.cos(a)*s;vel[i*2+1]=Math.sin(a)*s-90*Math.random();
      pos[i*3]=px;pos[i*3+1]=-py;pos[i*3+2]=0;sz[i]=8+Math.random()*14;life[i]=1;}
    g.attributes.aSize.needsUpdate=true;}
  function end(){if(raf)cancelAnimationFrame(raf);raf=0;active=null;
    try{g.dispose();mat.dispose();renderer.dispose();renderer.forceContextLoss();}catch(e){}
    if(cv.parentNode)cv.parentNode.removeChild(cv);}
  function step(now){
    try{
      var dt=Math.min(.05,(now-prev)/1000),t=(now-t0)/1000;prev=now;
      if(t>=DUR){end();return;}
      var drag=Math.pow(.18,dt),k=1-t/DUR;
      for(var i=0;i<N;i++){vel[i*2]*=drag;vel[i*2+1]=vel[i*2+1]*drag+260*dt;
        pos[i*3]+=vel[i*2]*dt;pos[i*3+1]-=vel[i*2+1]*dt;life[i]=k*(.75+.25*Math.sin(now*.02+i));}
      g.attributes.position.needsUpdate=true;g.attributes.aLife.needsUpdate=true;
      renderer.render(scene,cam);raf=requestAnimationFrame(step);
    }catch(e){end();}}
  active={restart:function(px,py){seed(px,py);}};
  seed(x,y);raf=requestAnimationFrame(step);
}
window.UMRAH_FX={burst:function(x,y){try{burst(x,y);}catch(e){}}};

}catch(err){}
})();
