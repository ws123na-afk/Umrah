/* Background sound.
   If config.sound.file is set (built from src/audio/nasheed.mp3), that recording loops softly.
   Otherwise a gentle voice-like hum in maqam Hijaz is generated in the browser (no instruments, no beat).
   Sound can only start after a tap, so it begins when the guest opens the doors. */
(function () {
  var C = (window.UMRAH_CONFIG || {}).sound || {};
  if (C.enabled === false) { return; }
  var KEY = 'umrah-sound';
  var muted = false;
  try { muted = localStorage.getItem(KEY) === 'off'; } catch (e) {}
  var started = false, ctx = null, master = null, timer = 0, audioEl = null;
  var btn = document.getElementById('soundBtn');
  var T = function (s) { return window.T ? window.T(s) : s; };

  function paint() {
    if (!btn) { return; }
    btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
    btn.setAttribute('aria-label', T(muted ? 'آواز چلائیں' : 'آواز بند کریں'));
    btn.classList.toggle('off', muted);
  }

  /* ---------- recorded file ---------- */
  function startFile() {
    audioEl = new Audio(C.file);
    audioEl.loop = true; audioEl.volume = 0;
    audioEl.play().catch(function () {});
    var v = 0, target = C.volume || 0.35;
    var f = setInterval(function () { v = Math.min(target, v + 0.02); if (audioEl) { audioEl.volume = muted ? 0 : v; } if (v >= target) { clearInterval(f); } }, 100);
  }

  /* ---------- generated hum ---------- */
  var HIJAZ = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66]; // D Eb F# G A Bb C D
  function reverb() {
    var len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (var i = 0; i < len; i++) { d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); } }
    var c = ctx.createConvolver(); c.buffer = buf; return c;
  }
  function vowel(src, out) {
    // "aah" formants make a sawtooth sound like a soft voice
    [[700, 8, 1], [1150, 10, 0.5], [2600, 12, 0.18]].forEach(function (f) {
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f[0]; bp.Q.value = f[1];
      var g = ctx.createGain(); g.gain.value = f[2];
      src.connect(bp); bp.connect(g); g.connect(out);
    });
  }
  function voice(freq, t0, dur, level, out) {
    var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
    var vib = ctx.createOscillator(); vib.frequency.value = 5; var vg = ctx.createGain(); vg.gain.value = freq * 0.006;
    vib.connect(vg); vg.connect(o.frequency);
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(level, t0 + Math.min(1.2, dur * 0.35));
    g.gain.setValueAtTime(level, t0 + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); vowel(g, out);
    o.start(t0); vib.start(t0); o.stop(t0 + dur + 0.1); vib.stop(t0 + dur + 0.1);
  }
  function startSynth() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) { return; }
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.0001;
    var rv = reverb(), wet = ctx.createGain(), dry = ctx.createGain();
    wet.gain.value = 0.55; dry.gain.value = 0.45;
    var bus = ctx.createGain(); bus.connect(dry); bus.connect(rv); rv.connect(wet);
    dry.connect(master); wet.connect(master); master.connect(ctx.destination);
    // drone: tonic and fifth, very soft and slowly breathing
    [[73.42, 0.06], [110.0, 0.035]].forEach(function (d) {
      var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = d[0];
      var g = ctx.createGain(); g.gain.value = d[1];
      var lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; var lg = ctx.createGain(); lg.gain.value = d[1] * 0.5;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); vowel(g, bus); o.start(); lfo.start();
    });
    // slow melody walking through the Hijaz scale
    var idx = 0, next = ctx.currentTime + 1.5;
    function schedule() {
      while (next < ctx.currentTime + 2) {
        var step = [-1, 1, 1, -1, 0, 2, -2][Math.floor(Math.random() * 7)];
        idx = Math.max(0, Math.min(HIJAZ.length - 1, idx + step));
        var dur = 2.4 + Math.random() * 1.6;
        voice(HIJAZ[idx], next, dur, 0.05, bus);
        if (Math.random() < 0.35) { voice(HIJAZ[idx] / 2, next, dur, 0.03, bus); }
        next += dur * (0.75 + Math.random() * 0.2);
      }
    }
    schedule(); timer = setInterval(schedule, 500);
    fade();
  }
  function fade() {
    if (!master) { return; }
    var t = ctx.currentTime; master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
    master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : (C.volume || 0.5), t + (muted ? 0.4 : 3));
  }

  function chime() {
    if (muted || !ctx) { return; }
    var t = ctx.currentTime;
    [[880, 0.12], [1320, 0.06], [1760, 0.03]].forEach(function (p) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = p[0];
      var g = ctx.createGain(); g.gain.setValueAtTime(p[1], t); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 2.3);
    });
  }

  function start() {
    if (started) { return; }
    started = true;
    if (C.file) { startFile(); } else { startSynth(); }
  }
  function setMuted(m) {
    muted = m;
    try { localStorage.setItem(KEY, m ? 'off' : 'on'); } catch (e) {}
    if (!started && !m) { start(); }
    if (audioEl) { audioEl.volume = m ? 0 : (C.volume || 0.35); if (!m) { audioEl.play().catch(function () {}); } }
    if (ctx) { if (!m && ctx.state === 'suspended') { ctx.resume(); } fade(); }
    paint();
  }
  document.addEventListener('visibilitychange', function () {
    if (ctx) { if (document.hidden) { ctx.suspend(); } else if (!muted) { ctx.resume(); } }
    if (audioEl) { if (document.hidden) { audioEl.pause(); } else if (!muted) { audioEl.play().catch(function () {}); } }
  });
  if (btn) { btn.addEventListener('click', function () { setMuted(!muted); }); }
  window.addEventListener('umrah-lang', paint);
  window.UMRAH_SOUND = {
    start: function () { if (!muted) { start(); if (ctx && ctx.state === 'suspended') { ctx.resume(); } } },
    chime: function () { chime(); }
  };
  paint();
})();
