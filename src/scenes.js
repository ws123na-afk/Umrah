window.Scenes=(function(){
"use strict";
var LOW=(navigator.hardwareConcurrency||4)<=4;
var MOB=Math.min(screen.width||9999,innerWidth)<700;
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function ok(){try{var c=document.createElement('canvas');return !!(window.THREE&&window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')));}catch(e){return false;}}
function cnv(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tex(c,srgb){var t=new THREE.CanvasTexture(c);if(srgb!==false)t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
function glowTex(col){var c=cnv(128,128),x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,col||'rgba(255,238,200,1)');g.addColorStop(.22,'rgba(255,212,140,.55)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return tex(c);}
function gold(x,X,Y,w,h){var g=x.createLinearGradient(X,Y,X,Y+h);g.addColorStop(0,'#F6DE97');g.addColorStop(.5,'#CDA54E');g.addColorStop(1,'#9E782B');x.fillStyle=g;x.fillRect(X,Y,w,h);}
function envMap(renderer,warm){var c=cnv(512,256),x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#0a1d26');g.addColorStop(.42,'#1d3b33');g.addColorStop(.52,warm?'#a07c44':'#6d7f88');g.addColorStop(1,'#3a2a18');x.fillStyle=g;x.fillRect(0,0,512,256);
  for(var i=0;i<16;i++){var px=i*32+8,py=118+((i*37)%17);var rg=x.createRadialGradient(px,py,0,px,py,16);rg.addColorStop(0,'rgba(255,242,205,1)');rg.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=rg;x.fillRect(px-18,py-18,36,36);}
  x.fillStyle='rgba(255,250,235,.95)';x.fillRect(190,8,130,26);
  var t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.encoding=THREE.sRGBEncoding;
  var pm=new THREE.PMREMGenerator(renderer);var rt=pm.fromEquirectangular(t);pm.dispose();t.dispose();return rt.texture;}
function makeRenderer(host,shadows){
  var r=new THREE.WebGLRenderer({antialias:!LOW,alpha:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,LOW?1.25:(MOB?1.75:2)));
  r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=.86;
  if(shadows&&!LOW){r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;}
  r.domElement.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;display:block;touch-action:pan-y';
  r.domElement.setAttribute('aria-hidden','true');
  host.appendChild(r.domElement);return r;}
function run(host,renderer,cam,step){
  var vis=true,on=true,last=performance.now();
  function resize(){var w=host.clientWidth||1,h=host.clientHeight||1;renderer.setSize(w,h,false);cam.aspect=w/h;
    if(cam.userData.shift){cam.setViewOffset(w,h,0,h*cam.userData.shift,w,h);}cam.updateProjectionMatrix();}
  resize();window.addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(host);
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting;},{rootMargin:'120px'}).observe(host);
  document.addEventListener('visibilitychange',function(){on=!document.hidden;});
  function f(now){requestAnimationFrame(f);var dt=Math.min(.05,(now-last)/1000);last=now;if(!vis||!on)return;step(reduce?0:dt,now/1000);}
  requestAnimationFrame(f);}
function stars(scene,n,r){var g=new THREE.BufferGeometry(),p=new Float32Array(n*3);
  for(var i=0;i<n;i++){var u=Math.random()*Math.PI*2,v=Math.random()*0.55+0.06;p[i*3]=Math.cos(u)*Math.cos(v)*r;p[i*3+1]=Math.sin(v)*r;p[i*3+2]=Math.sin(u)*Math.cos(v)*r;}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));
  var m=new THREE.PointsMaterial({color:0xfff3d6,size:MOB?1.7:1.5,sizeAttenuation:false,transparent:true,opacity:.85,fog:false});
  var s=new THREE.Points(g,m);scene.add(s);return s;}
function pointer(el,st){var down=false,lx=0,sx=0;
  el.addEventListener('pointerdown',function(e){down=true;lx=sx=e.clientX;window.__dragged=false;});
  window.addEventListener('pointerup',function(){down=false;});
  el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();st.px=(e.clientX-r.left)/r.width-.5;st.py=(e.clientY-r.top)/r.height-.5;
    if(down){st.v+=(e.clientX-lx)*-0.0035;lx=e.clientX;if(Math.abs(e.clientX-sx)>8)window.__dragged=true;}});
  el.addEventListener('pointerleave',function(){st.px=0;st.py=0;});}
function crescent(mat,s){var g=new THREE.Group();var t=new THREE.Mesh(new THREE.TorusGeometry(.12*s,.024*s,8,28,Math.PI*1.45),mat);t.rotation.z=Math.PI*.78;g.add(t);return g;}
function latheMinaret(h,r){var p=[[.001,0],[r*1.35,0],[r*1.35,h*.15],[r,h*.165],[r,h*.55],[r*1.65,h*.56],[r*1.65,h*.585],[r*.86,h*.595],[r*.86,h*.79],[r*1.45,h*.8],[r*1.45,h*.825],[r*.72,h*.835],[r*.72,h*.9],[r*.62,h*.905],[r*.5,h*.94],[r*.22,h*.975],[.001,h]];
  return new THREE.LatheGeometry(p.map(function(a){return new THREE.Vector2(a[0],a[1]);}),18);}

/* ======================= MAKKAH ======================= */
function makkah(host){
  var renderer=makeRenderer(host,true),env=envMap(renderer,true);
  var scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x041a14,MOB?0.042:0.04);
  var cam=new THREE.PerspectiveCamera(MOB?54:40,1,.1,300);cam.userData.shift=MOB?0.17:0.09;
  stars(scene,MOB?450:700,90);

  scene.add(new THREE.HemisphereLight(0x9ec4d8,0x2a1d0e,.32));
  var spot=new THREE.SpotLight(0xffe2b0,2.1,40,.38,.85,1.1);spot.position.set(3.5,10,5);spot.target.position.set(0,.6,0);scene.add(spot,spot.target);
  if(renderer.shadowMap.enabled){spot.castShadow=true;spot.shadow.mapSize.set(MOB?1024:2048,MOB?1024:2048);spot.shadow.bias=-.0004;spot.shadow.radius=4;}
  var moon=new THREE.DirectionalLight(0xaecbff,.35);moon.position.set(-6,9,-5);scene.add(moon);
  for(var i=0;i<4;i++){var a=i/4*Math.PI*2+.4,pl=new THREE.PointLight(0xffc77a,.8,15,2);pl.position.set(Math.cos(a)*6.4,1.8,Math.sin(a)*6.4);scene.add(pl);}

  /* floor */
  var S=MOB?1024:2048,fc=cnv(S,S),fx=fc.getContext('2d'),C=S/2;fx.fillStyle='#ECE7DA';fx.fillRect(0,0,S,S);
  for(var v=0;v<300;v++){fx.strokeStyle='rgba(140,130,110,'+(Math.random()*.07)+')';fx.lineWidth=Math.random()*2.2;fx.beginPath();var X=Math.random()*S,Y=Math.random()*S;fx.moveTo(X,Y);for(var k=0;k<6;k++){X+=(Math.random()-.5)*130;Y+=(Math.random()-.5)*130;fx.lineTo(X,Y);}fx.stroke();}
  fx.strokeStyle='rgba(120,105,80,.16)';fx.lineWidth=1.2;for(var rr=S*.05;rr<C;rr+=S/70){fx.beginPath();fx.arc(C,C,rr,0,7);fx.stroke();}
  for(var q=0;q<160;q++){var an=q/160*Math.PI*2;fx.beginPath();fx.moveTo(C+Math.cos(an)*S*.05,C+Math.sin(an)*S*.05);fx.lineTo(C+Math.cos(an)*C,C+Math.sin(an)*C);fx.stroke();}
  var floor=new THREE.Mesh(new THREE.CircleGeometry(24,128),new THREE.MeshStandardMaterial({map:tex(fc),color:0x7c7466,roughness:.5,metalness:0,envMap:env,envMapIntensity:.35}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);

  var gg=new THREE.Mesh(new THREE.PlaneGeometry(13,13),new THREE.MeshBasicMaterial({map:glowTex('rgba(255,214,140,.9)'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.55,fog:false}));gg.rotation.x=-Math.PI/2;gg.position.y=.012;scene.add(gg);
  /* Kaaba */
  var KW=1.25,KD=1.1,KH=1.36,BASE=.07,res=MOB?512:1024;
  function face(w,h,door,top){var W=res,H=Math.round(res*h/w),c=cnv(W,H),x=c.getContext('2d'),m=cnv(W,H),mx=m.getContext('2d');
    x.fillStyle='#0c0c0d';x.fillRect(0,0,W,H);mx.fillStyle='#000';mx.fillRect(0,0,W,H);
    if(top)return [tex(c),tex(m,false)];
    x.strokeStyle='rgba(255,255,255,.05)';x.lineWidth=W/420;
    for(var yy=0;yy<H;yy+=W/24){x.beginPath();for(var xx=0;xx<=W;xx+=W/70)x.lineTo(xx,yy+Math.sin(xx/W*44+yy*.1)*W/100);x.stroke();}
    var b0=H*.19,b1=H*.28;gold(x,0,b0,W,b1-b0);mx.fillStyle='#fff';mx.fillRect(0,b0,W,b1-b0);
    x.strokeStyle='rgba(70,45,10,.9)';x.lineWidth=W/320;
    for(var k=0;k<W;k+=W/36){x.beginPath();x.moveTo(k,b1-H*.013);x.bezierCurveTo(k+W/90,b0+H*.012,k+W/55,b1-H*.012,k+W/42,b0+H*.02);x.stroke();
      if((k*7|0)%3===0){x.beginPath();x.arc(k+W/72,b0+(b1-b0)*.52,W/300,0,7);x.stroke();}}
    x.fillStyle='#6f5119';x.fillRect(0,b0,W,H*.007);x.fillRect(0,b1-H*.007,W,H*.007);
    for(var j=0;j<4;j++){if(door&&j===3)continue;var cx=W*(.13+j*.245),y=H*.355,rw=W*.12,rh=H*.065;gold(x,cx-rw/2,y,rw,rh);mx.fillRect(cx-rw/2,y,rw,rh);
      x.strokeStyle='rgba(70,45,10,.85)';x.lineWidth=W/400;x.strokeRect(cx-rw/2+W*.01,y+H*.01,rw-W*.02,rh-H*.02);}
    if(door){var dx=W*.63,dw=W*.22,dy=H*.5,dh=H*.42;gold(x,dx-W*.025,dy-H*.08,dw+W*.05,dh+H*.08);mx.fillRect(dx-W*.025,dy-H*.08,dw+W*.05,dh+H*.08);
      x.fillStyle='#121212';x.fillRect(dx,dy,dw,dh*.97);mx.fillStyle='#000';mx.fillRect(dx,dy,dw,dh*.97);mx.fillStyle='#fff';
      x.strokeStyle='#DDB862';x.lineWidth=W/240;for(var p=0;p<4;p++)x.strokeRect(dx+dw*.12,dy+dh*(.06+p*.23),dw*.76,dh*.17);
      x.beginPath();x.moveTo(dx+dw*.5,dy+dh*.05);x.lineTo(dx+dw*.5,dy+dh*.92);x.stroke();}
    gold(x,0,H*.9,W,H*.013);mx.fillStyle='#fff';mx.fillRect(0,H*.9,W,H*.013);
    return [tex(c),tex(m,false)];}
  function kmat(f){return new THREE.MeshStandardMaterial({map:f[0],metalnessMap:f[1],metalness:1,roughness:.5,envMap:env,envMapIntensity:1.25});}
  var fx1=face(KD,KH),fx2=face(KD,KH),fy=face(KW,KD,false,true),fz=face(KW,KH,true),fz2=face(KW,KH);
  var kaaba=new THREE.Mesh(new THREE.BoxGeometry(KW,KH,KD),[kmat(fx1),kmat(fx2),kmat(fy),kmat(fy),kmat(fz),kmat(fz2)]);
  kaaba.position.y=BASE+KH/2;kaaba.castShadow=true;kaaba.receiveShadow=true;scene.add(kaaba);
  var marble=new THREE.MeshStandardMaterial({color:0xE8E2D2,roughness:.35,envMap:env,envMapIntensity:.5});
  var base=new THREE.Mesh(new THREE.BoxGeometry(KW+.09,BASE,KD+.09),marble);base.position.y=BASE/2;base.receiveShadow=true;base.castShadow=true;scene.add(base);
  var hateem=new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.14,40,1,true,Math.PI,Math.PI),new THREE.MeshStandardMaterial({color:0xE8E2D2,roughness:.4,side:THREE.DoubleSide}));
  hateem.position.set(-KW/2,.07,0);hateem.castShadow=true;scene.add(hateem);
  var goldM=new THREE.MeshStandardMaterial({color:0xD8B25A,metalness:1,roughness:.28,envMap:env,envMapIntensity:1.4});
  var mq=new THREE.Group();var mqb=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.05,8),marble);mqb.position.y=.025;mq.add(mqb);
  var cage=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.24,8,1,true),new THREE.MeshStandardMaterial({color:0xD8B25A,metalness:1,roughness:.3,envMap:env,transparent:true,opacity:.85,side:THREE.DoubleSide}));cage.position.y=.17;mq.add(cage);
  var cap=new THREE.Mesh(new THREE.SphereGeometry(.1,16,8,0,Math.PI*2,0,Math.PI/2),goldM);cap.position.y=.29;mq.add(cap);
  var fin=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.08),goldM);fin.position.y=.42;mq.add(fin);
  mq.position.set(.3,0,KD/2+.8);mq.traverse(function(o){o.castShadow=true;});scene.add(mq);

  /* pilgrims */
  var N=LOW?700:(MOB?1200:2100),geo=new THREE.CapsuleGeometry(.022,.058,2,6),pm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,envMap:env,envMapIntensity:.3});
  var crowd=new THREE.InstancedMesh(geo,pm,N);crowd.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  var A=new Float32Array(N),R=new Float32Array(N),Wv=new Float32Array(N),PH=new Float32Array(N),col=new THREE.Color();
  for(i=0;i<N;i++){A[i]=Math.random()*Math.PI*2;R[i]=1.55+Math.pow(Math.random(),1.5)*3.6;Wv[i]=(.17+Math.random()*.05)/Math.sqrt(R[i]);PH[i]=Math.random()*6.28;
    var c=Math.random();col.set(c<.84?0xf4f1ea:(c<.97?0x222222:0xd9c9a8));crowd.setColorAt(i,col);}
  crowd.castShadow=false;scene.add(crowd);var dm=new THREE.Object3D();
  function moveCrowd(dt,t){for(var i=0;i<N;i++){A[i]-=Wv[i]*dt;dm.position.set(Math.cos(A[i])*R[i],.052+Math.abs(Math.sin(t*5+PH[i]))*.006,Math.sin(A[i])*R[i]);dm.updateMatrix();crowd.setMatrixAt(i,dm.matrix);}crowd.instanceMatrix.needsUpdate=true;}
  moveCrowd(0,0);if(crowd.instanceColor)crowd.instanceColor.needsUpdate=true;

  /* colonnade */
  var RC=7.2,NP=60,cream=new THREE.MeshStandardMaterial({color:0xEFE6D0,roughness:.6,emissive:0x2a2215,emissiveIntensity:.35});
  var pil=new THREE.InstancedMesh(new THREE.BoxGeometry(.14,1.15,.14),cream,NP),arc=new THREE.InstancedMesh(new THREE.TorusGeometry(RC*Math.sin(Math.PI/NP),.04,6,14,Math.PI),cream,NP);
  for(i=0;i<NP;i++){var th=i/NP*Math.PI*2;dm.position.set(Math.cos(th)*RC,.575,Math.sin(th)*RC);dm.rotation.set(0,-th,0);dm.updateMatrix();pil.setMatrixAt(i,dm.matrix);
    var tm=th+Math.PI/NP;dm.position.set(Math.cos(tm)*RC*Math.cos(Math.PI/NP),1.15,Math.sin(tm)*RC*Math.cos(Math.PI/NP));dm.rotation.set(0,-tm-Math.PI/2,0);dm.updateMatrix();arc.setMatrixAt(i,dm.matrix);}
  scene.add(pil,arc);
  var roof=new THREE.Mesh(new THREE.CylinderGeometry(RC+.25,RC+.25,.28,120,1,true),new THREE.MeshStandardMaterial({color:0xEFE6D0,roughness:.6,side:THREE.DoubleSide,emissive:0x2a2215,emissiveIntensity:.3}));roof.position.y=1.72;scene.add(roof);
  var roof2=new THREE.Mesh(new THREE.CylinderGeometry(RC+1.4,RC+1.4,1.6,120,1,true),new THREE.MeshStandardMaterial({color:0xD9CFB6,roughness:.7,side:THREE.BackSide,emissive:0x1d170d,emissiveIntensity:.4}));roof2.position.y=1.45;scene.add(roof2);
  var gt=glowTex(),lampM=new THREE.SpriteMaterial({map:gt,color:0xffd78f,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
  var lamps=[];for(i=0;i<NP;i++){var th2=(i+.5)/NP*Math.PI*2,sp=new THREE.Sprite(lampM);sp.position.set(Math.cos(th2)*(RC-.05),.95,Math.sin(th2)*(RC-.05));sp.scale.setScalar(.55);scene.add(sp);lamps.push(sp);}

  /* minarets + tower */
  var minM=new THREE.MeshStandardMaterial({color:0xF1E9D6,roughness:.55,emissive:0x3a2c16,emissiveIntensity:.35});
  for(i=0;i<9;i++){var ang=i/9*Math.PI*2+.2,mr=new THREE.Mesh(latheMinaret(4.6,.2),minM);mr.position.set(Math.cos(ang)*10.5,0,Math.sin(ang)*10.5);scene.add(mr);
    var gw=new THREE.Sprite(lampM);gw.position.set(mr.position.x,4.6*.57,mr.position.z);gw.scale.setScalar(1.1);scene.add(gw);
    var gw2=new THREE.Sprite(lampM);gw2.position.set(mr.position.x,4.6*.81,mr.position.z);gw2.scale.setScalar(.8);scene.add(gw2);
    var cr=crescent(goldM,1.2);cr.position.set(mr.position.x,4.75,mr.position.z);scene.add(cr);}
  var tw=new THREE.Group(),twM=new THREE.MeshStandardMaterial({color:0x8b8476,roughness:.7,emissive:0x1a1408,emissiveIntensity:.6});
  var t1=new THREE.Mesh(new THREE.BoxGeometry(2.4,9,2.4),twM);t1.position.y=4.5;tw.add(t1);
  var t2=new THREE.Mesh(new THREE.BoxGeometry(1.6,4,1.6),twM);t2.position.y=11;tw.add(t2);
  var clock=new THREE.Mesh(new THREE.CircleGeometry(.62,32),new THREE.MeshBasicMaterial({color:0xf4fff4,fog:false}));clock.position.set(0,11.6,.81);tw.add(clock);
  var ring2=new THREE.Mesh(new THREE.RingGeometry(.62,.7,32),new THREE.MeshBasicMaterial({color:0x2fc46a,fog:false}));ring2.position.set(0,11.6,.811);tw.add(ring2);
  var sp2=new THREE.Mesh(new THREE.ConeGeometry(.5,3,8),goldM);sp2.position.y=14.5;tw.add(sp2);
  var tcr=crescent(goldM,4);tcr.position.y=16.3;tw.add(tcr);
  tw.position.set(0,0,-19);tw.lookAt(0,0,0);scene.add(tw);

  /* camera */
  var st={px:0,py:0,v:0},yaw=.9,dist=MOB?11.5:9.6,hgt=MOB?6.2:4.6,tgt=new THREE.Vector3(0,.55,0);
  pointer(host,st);
  var spx=0,spy=0;
  function step(dt,t){
    yaw+=dt*.06+st.v;st.v*=.9;spx+=(st.px-spx)*.05;spy+=(st.py-spy)*.05;
    var Y=yaw+spx*.5;cam.position.set(Math.sin(Y)*dist,hgt-spy*1.2,Math.cos(Y)*dist);cam.lookAt(tgt);
    moveCrowd(dt,t);
    var fl=.5+.08*Math.sin(t*3);for(var i=0;i<lamps.length;i+=6)lamps[i].scale.setScalar(.5+.08*Math.sin(t*2+i));
    renderer.render(scene,cam);}
  run(host,renderer,cam,step);
}

/* ======================= MADINA ======================= */
function madina(host){
  var renderer=makeRenderer(host,true),env=envMap(renderer,false);
  var scene=new THREE.Scene();scene.fog=new THREE.Fog(0x071d22,22,70);
  var cam=new THREE.PerspectiveCamera(MOB?52:40,1,.1,300);
  stars(scene,MOB?400:600,90);
  scene.add(new THREE.HemisphereLight(0x8fb5ff,0x3a2b18,.6));
  var mdir=new THREE.DirectionalLight(0xb8d0ff,.4);mdir.position.set(8,12,6);scene.add(mdir);
  var key=new THREE.SpotLight(0xfff1d6,2.2,45,.42,.7,1);key.position.set(-4,12,12);key.target.position.set(0,3,-3);scene.add(key,key.target);
  if(renderer.shadowMap.enabled){key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0005;}

  /* moon */
  var mc=cnv(256,256),mx=mc.getContext('2d');mx.fillStyle='#FFF1C2';mx.beginPath();mx.arc(128,128,90,0,7);mx.fill();mx.globalCompositeOperation='destination-out';mx.beginPath();mx.arc(162,108,80,0,7);mx.fill();
  var moonS=new THREE.Sprite(new THREE.SpriteMaterial({map:tex(mc),transparent:true,fog:false}));moonS.position.set(14,16,-40);moonS.scale.setScalar(5);scene.add(moonS);
  var mg=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(255,244,210,.8)'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));mg.position.copy(moonS.position);mg.scale.setScalar(16);scene.add(mg);

  /* plaza */
  var pc=cnv(512,512),px=pc.getContext('2d');px.fillStyle='#E9E3D3';px.fillRect(0,0,512,512);
  px.strokeStyle='rgba(150,135,105,.35)';px.lineWidth=3;px.strokeRect(0,0,512,512);px.lineWidth=1.2;px.strokeRect(128,128,256,256);
  px.strokeStyle='rgba(150,135,105,.22)';px.beginPath();px.moveTo(0,0);px.lineTo(512,512);px.moveTo(512,0);px.lineTo(0,512);px.stroke();
  var ptex=tex(pc);ptex.wrapS=ptex.wrapT=THREE.RepeatWrapping;ptex.repeat.set(30,22);
  var plaza=new THREE.Mesh(new THREE.PlaneGeometry(90,66),new THREE.MeshStandardMaterial({map:ptex,color:0x8f8b7e,roughness:.45,envMap:env,envMapIntensity:.45}));
  plaza.rotation.x=-Math.PI/2;plaza.receiveShadow=true;scene.add(plaza);

  /* facade */
  var fw=2048,fh=256,fc=cnv(fw,fh),fx=fc.getContext('2d');var gfa=fx.createLinearGradient(0,0,0,fh);gfa.addColorStop(0,'#F4ECD8');gfa.addColorStop(1,'#D9CBA8');fx.fillStyle=gfa;fx.fillRect(0,0,fw,fh);
  gold(fx,0,14,fw,10);
  var nA=22;for(var i=0;i<nA;i++){var ax=i*fw/nA+fw/nA*.18,aw=fw/nA*.64,ay=70;
    var gi=fx.createLinearGradient(0,ay,0,fh);gi.addColorStop(0,'#2a4a3f');gi.addColorStop(.55,'#8a6a32');gi.addColorStop(1,'#FFD995');fx.fillStyle=gi;
    fx.beginPath();fx.moveTo(ax,fh);fx.lineTo(ax,ay+aw*.5);fx.quadraticCurveTo(ax+aw*.5,ay-aw*.35,ax+aw,ay+aw*.5);fx.lineTo(ax+aw,fh);fx.closePath();fx.fill();
    fx.strokeStyle='#B8933F';fx.lineWidth=3;fx.stroke();
    fx.fillStyle='#CBA552';fx.fillRect(ax-6,40,aw+12,6);}
  for(i=0;i<fw;i+=24){fx.fillStyle='#E6DBC0';fx.fillRect(i,0,14,12);}
  var facT=tex(fc),stone=new THREE.MeshStandardMaterial({color:0xEFE6D0,roughness:.6,emissive:0x2a2014,emissiveIntensity:.25});
  var facM=new THREE.MeshStandardMaterial({map:facT,roughness:.55,emissive:0xffffff,emissiveMap:facT,emissiveIntensity:.18});
  var bld=new THREE.Mesh(new THREE.BoxGeometry(18,2.1,5),[stone,stone,stone,stone,facM,stone]);bld.position.set(0,1.05,-3.5);bld.castShadow=bld.receiveShadow=true;scene.add(bld);
  var bld2=new THREE.Mesh(new THREE.BoxGeometry(9,.45,4),stone);bld2.position.set(0,2.32,-3.6);bld2.castShadow=true;scene.add(bld2);

  /* drum + green dome */
  var dc=cnv(1024,128),dx=dc.getContext('2d');dx.fillStyle='#EFE5CD';dx.fillRect(0,0,1024,128);
  for(i=0;i<16;i++){var wx=i*64+18;var gw=dx.createLinearGradient(0,30,0,110);gw.addColorStop(0,'#3b5b4c');gw.addColorStop(1,'#FFD995');dx.fillStyle=gw;dx.beginPath();dx.moveTo(wx,110);dx.lineTo(wx,52);dx.quadraticCurveTo(wx+14,26,wx+28,52);dx.lineTo(wx+28,110);dx.fill();}
  gold(dx,0,0,1024,8);gold(dx,0,120,1024,8);
  var drum=new THREE.Mesh(new THREE.CylinderGeometry(1.32,1.36,1.0,32,1,true),new THREE.MeshStandardMaterial({map:tex(dc),roughness:.6,emissive:0xffffff,emissiveMap:tex(dc),emissiveIntensity:.12}));
  drum.position.set(0,3.05,-3.4);scene.add(drum);
  var rc=cnv(512,256),rx=rc.getContext('2d');var rg=rx.createLinearGradient(0,0,0,256);rg.addColorStop(0,'#2BA862');rg.addColorStop(1,'#167A43');rx.fillStyle=rg;rx.fillRect(0,0,512,256);
  rx.strokeStyle='rgba(8,60,30,.55)';rx.lineWidth=2.4;for(i=0;i<24;i++){rx.beginPath();rx.moveTo(i*512/24,0);rx.lineTo(i*512/24,256);rx.stroke();}
  rx.strokeStyle='rgba(8,60,30,.18)';rx.lineWidth=1;for(i=0;i<256;i+=16){rx.beginPath();rx.moveTo(0,i);rx.lineTo(512,i);rx.stroke();}
  var prof=[[1.34,0],[1.37,.22],[1.34,.55],[1.22,.95],[1.02,1.33],[.74,1.66],[.45,1.92],[.2,2.1],[.06,2.19],[.001,2.22]].map(function(a){return new THREE.Vector2(a[0],a[1]);});
  var domeM=new THREE.MeshStandardMaterial({map:tex(rc),metalness:.35,roughness:.32,envMap:env,envMapIntensity:1.1,emissive:0x0b4a26,emissiveIntensity:.35});
  var dome=new THREE.Mesh(new THREE.LatheGeometry(prof,64),domeM);dome.position.set(0,3.55,-3.4);dome.castShadow=true;scene.add(dome);
  var goldM=new THREE.MeshStandardMaterial({color:0xD8B25A,metalness:1,roughness:.25,envMap:env,envMapIntensity:1.5,emissive:0x3a2a08,emissiveIntensity:.4});
  var f1=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,.55,10),goldM);f1.position.set(0,5.95,-3.4);scene.add(f1);
  var f2=new THREE.Mesh(new THREE.SphereGeometry(.08,16,10),goldM);f2.position.set(0,5.95,-3.4);scene.add(f2);
  var dcr=crescent(goldM,1.6);dcr.position.set(0,6.38,-3.4);scene.add(dcr);
  var dGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(150,255,190,.6)'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.35}));
  dGlow.position.set(0,4.4,-3.2);dGlow.scale.set(5.5,4.5,1);scene.add(dGlow);

  /* silver domes */
  var silver=new THREE.MeshStandardMaterial({color:0xB9BCBE,metalness:.8,roughness:.35,envMap:env,envMapIntensity:1});
  [[-3.6,-3.4,.7],[3.6,-3.4,.7],[-6.4,-3.2,.55],[6.4,-3.2,.55],[-1.8,-1.6,.42],[1.8,-1.6,.42]].forEach(function(d){
    var m=new THREE.Mesh(new THREE.SphereGeometry(d[2],28,14,0,Math.PI*2,0,Math.PI/2),silver);m.position.set(d[0],d[1]===-1.6?2.1:2.55,d[1]);m.castShadow=true;scene.add(m);});

  /* minarets */
  var minM=new THREE.MeshStandardMaterial({color:0xF3ECDA,roughness:.5,emissive:0x3a2c16,emissiveIntensity:.3});
  var lampM=new THREE.SpriteMaterial({map:glowTex(),color:0xffd78f,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  var lamps=[];
  [[-9.6,-2.2,8.4],[9.6,-2.2,8.4],[-4.9,-6.2,7.2],[4.9,-6.2,7.2],[-13,-8,7.8],[13,-8,7.8]].forEach(function(m){
    var mn=new THREE.Mesh(latheMinaret(m[2],.3),minM);mn.position.set(m[0],0,m[1]);mn.castShadow=true;scene.add(mn);
    [.57,.81].forEach(function(f){var b=new THREE.Mesh(new THREE.TorusGeometry(.3*1.62,.03,6,24),goldM);b.rotation.x=Math.PI/2;b.position.set(m[0],m[2]*f+.05,m[1]);scene.add(b);
      var g=new THREE.Sprite(lampM);g.position.set(m[0],m[2]*f,m[1]);g.scale.setScalar(1.3);scene.add(g);lamps.push(g);});
    var c=crescent(goldM,2);c.position.set(m[0],m[2]+.22,m[1]);scene.add(c);});

  /* umbrellas */
  var umbM=new THREE.MeshStandardMaterial({color:0xF7F2E6,roughness:.55,side:THREE.DoubleSide,emissive:0x3a3020,emissiveIntensity:.25});
  var poleM=new THREE.MeshStandardMaterial({color:0xDCD6C8,roughness:.4,metalness:.3,envMap:env});
  var uGlow=new THREE.SpriteMaterial({map:glowTex(),color:0xffe0a8,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.7});
  for(var ux=-4;ux<=4;ux++)for(var uz=0;uz<2;uz++){
    var X=ux*3.1+(uz?1.55:0),Z=1.2+uz*3.2;if(Math.abs(X)<5.2||Math.abs(X)>13)continue;
    var pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,2.6,8),poleM);pole.position.set(X,1.3,Z);pole.castShadow=true;scene.add(pole);
    var can=new THREE.Mesh(new THREE.ConeGeometry(1.35,.5,4,1,true),umbM);can.position.set(X,2.8,Z);can.rotation.y=Math.PI/4;can.castShadow=true;scene.add(can);
    var ug=new THREE.Sprite(uGlow);ug.position.set(X,2.35,Z);ug.scale.setScalar(1.3);scene.add(ug);}

  var st={px:0,py:0,v:0},sx=0,sy=0,tgt=new THREE.Vector3(0,3.3,-3.4);pointer(host,st);
  function step(dt,t){sx+=(st.px-sx)*.05;sy+=(st.py-sy)*.05;
    var w=host.clientWidth/host.clientHeight,z=w<1.3?16.5:13;
    var s=Math.sin(t*.12)*.18+sx*.35;
    cam.position.set(Math.sin(s)*z,2.6-sy*1.2+Math.sin(t*.2)*.15,-3.4+Math.cos(s)*z);cam.lookAt(tgt);
    dGlow.material.opacity=.25+.12*Math.sin(t*.9);
    for(var i=0;i<lamps.length;i++)lamps[i].scale.setScalar(1.2+.12*Math.sin(t*2+i));
    renderer.render(scene,cam);}
  run(host,renderer,cam,step);
}
return {ok:ok,makkah:makkah,madina:madina};
})();
