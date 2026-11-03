/* Attendance replies + anonymous click counts (Supabase REST, insert-only). */
(function () {
  var C = window.UMRAH_CONFIG || {}, R = C.rsvp || {};
  var T = window.T || function (s) { return s; };
  var LANG = function () { return window.UMRAH_LANG ? window.UMRAH_LANG() : 'ur'; };
  var hasDb = !!(C.supabaseUrl && C.supabaseKey);
  var mode = R.mode || 'form';
  if (mode === 'form' && !hasDb) { mode = 'whatsapp'; }

  function store(k, v) { try { if (v === undefined) { return localStorage.getItem(k); } localStorage.setItem(k, v); } catch (e) { return null; } }
  var vid = store('umrah-vid');
  if (!vid) { vid = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); store('umrah-vid', vid); }

  var guest = null;
  try { guest = (new URLSearchParams(location.search).get('to') || '').replace(/\s+/g, ' ').trim().slice(0, 40) || null; } catch (e) {}
  function device() {
    var u = navigator.userAgent || '', os = 'Other', br = 'Browser', kind = 'computer';
    if (/iPad|Tablet/i.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1)) { kind = 'tablet'; } else if (/Mobi|Android|iPhone/i.test(u)) { kind = 'phone'; }
    if (/Android/i.test(u)) { os = 'Android'; } else if (/iPhone|iPad|iPod/i.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1)) { os = 'iOS'; } else if (/Windows/i.test(u)) { os = 'Windows'; } else if (/Mac OS X/i.test(u)) { os = 'Mac'; } else if (/Linux|CrOS/i.test(u)) { os = 'Linux'; }
    if (/FBAN|FBAV|FB_IAB/i.test(u)) { br = 'Facebook app'; } else if (/Instagram/i.test(u)) { br = 'Instagram app'; } else if (/WhatsApp/i.test(u)) { br = 'WhatsApp'; } else if (/SamsungBrowser/i.test(u)) { br = 'Samsung Internet'; } else if (/Edg\//.test(u)) { br = 'Edge'; } else if (/OPR\/|Opera/.test(u)) { br = 'Opera'; } else if (/Firefox|FxiOS/.test(u)) { br = 'Firefox'; } else if (/CriOS|Chrome\//.test(u)) { br = 'Chrome'; } else if (/Safari/.test(u)) { br = 'Safari'; }
    if (/; wv\)/.test(u) && br === 'Chrome') { br = 'in-app browser'; }
    return (os + ' / ' + br + ' / ' + kind).slice(0, 60);
  }
  var DEV = device();
  var REF = null;
  try { if (document.referrer) { var rh = new URL(document.referrer).hostname; if (rh && rh !== location.hostname) { REF = rh.slice(0, 60); } } } catch (e) {}
  function headers() {
    var h = { 'Content-Type': 'application/json', apikey: C.supabaseKey, Prefer: 'return=minimal' };
    if (C.supabaseKey.indexOf('sb_') !== 0) { h.Authorization = 'Bearer ' + C.supabaseKey; }
    return h;
  }
  function post(table, row, keepalive) {
    return fetch(C.supabaseUrl + '/rest/v1/' + table, { method: 'POST', headers: headers(), body: JSON.stringify(row), keepalive: !!keepalive })
      .then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r; });
  }

  /* ---------- click counting ---------- */
  function track(ev) {
    if (!hasDb || C.tracking === false || !/^[a-z0-9_]{2,40}$/.test(ev)) { return; }
    try { post('umrah_events', { event: ev, lang: LANG(), visitor: vid, guest: guest, device: DEV, referrer: ev === 'visit' ? REF : null }, true).catch(function () {}); } catch (e) {}
  }
  window.UMRAH_TRACK = track;
  try { if (!sessionStorage.getItem('umrah-visit')) { sessionStorage.setItem('umrah-visit', '1'); track('visit'); } } catch (e) { track('visit'); }
  [].forEach.call(document.querySelectorAll('.mem-tile,.mem-feat'), function (b) { b.setAttribute('data-track', 'photo_open'); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-track]') : null;
    if (t) { track(t.getAttribute('data-track')); }
  }, true);

  /* ---------- reply buttons ---------- */
  var openers = [].slice.call(document.querySelectorAll('[data-rsvp-open]'));
  var pick = document.getElementById('rsvpPick');
  var wrap = document.getElementById('rsvp');
  if (mode === 'off') {
    openers.forEach(function (b) { b.hidden = true; });
    if (wrap) { wrap.hidden = true; }
    return;
  }
  if (mode === 'whatsapp') {
    openers.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        if (!pick) { return; }
        var open = pick.hasAttribute('hidden');
        if (open) { pick.removeAttribute('hidden'); } else { pick.setAttribute('hidden', ''); }
        openers.forEach(function (o) { o.setAttribute('aria-expanded', open ? 'true' : 'false'); });
        if (open && b.id !== 'rsvpBtn') { wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        track('rsvp_open');
      });
    });
    return;
  }

  /* ---------- form mode ---------- */
  var dlg = document.getElementById('rsvpDlg');
  if (!dlg || typeof dlg.showModal !== 'function') { return; }
  var form = document.getElementById('rsvpForm');
  var nameI = document.getElementById('rsvpName'), nameE = document.getElementById('rsvpNameErr');
  var guestsRow = document.getElementById('rsvpGuestsRow'), guestsI = document.getElementById('rsvpGuests');
  var attRow = document.getElementById('rsvpAttRow'), msgRow = document.getElementById('rsvpMsgRow'), msgI = document.getElementById('rsvpMsg');
  var sendB = document.getElementById('rsvpSend'), errBox = document.getElementById('rsvpErr');
  var stForm = document.getElementById('rsvpStepForm'), stDone = document.getElementById('rsvpStepDone'), doneTxt = document.getElementById('rsvpDoneTxt');
  var status = document.getElementById('rsvpStatus');
  var lastFocus = null, busy = false;

  var max = Math.max(1, Math.min(20, R.maxGuests || 10));
  for (var i = 1; i <= max; i++) { var o = document.createElement('option'); o.value = i; o.textContent = i; guestsI.appendChild(o); }
  if (R.askAttending === false) { attRow.hidden = true; }
  if (R.askGuests === false) { guestsRow.hidden = true; }
  if (R.askMessage === false) { msgRow.hidden = true; }

  function attending() { var r = form.querySelector('input[name="att"]:checked'); return !r || r.value === 'yes'; }
  function syncGuests() { if (R.askGuests !== false) { guestsRow.hidden = !attending(); } }
  [].forEach.call(form.querySelectorAll('input[name="att"]'), function (r) { r.addEventListener('change', syncGuests); });

  /* name validation: on first blur, clear on focus/typing */
  var touched = false;
  function nameOk() { return nameI.value.replace(/\s+/g, ' ').trim().length > 0; }
  function showNameErr(on) { nameE.hidden = !on; if (on) { nameI.setAttribute('aria-invalid', 'true'); } else { nameI.removeAttribute('aria-invalid'); } }
  nameI.addEventListener('blur', function () { touched = true; showNameErr(!nameOk()); });
  nameI.addEventListener('input', function () { if (touched) { showNameErr(false); } });

  function saved() { try { return JSON.parse(store('umrah-rsvp') || 'null'); } catch (e) { return null; } }
  function summary(s) {
    if (!s) { return ''; }
    if (!s.attending) { return T('آپ کا جواب: اس بار تشریف نہیں لا سکیں گے۔'); }
    return T('آپ کا جواب: ان شاء اللہ تشریف لائیں گے') + ' (' + s.guests + ' ' + (s.guests === 1 && LANG() === 'en' ? 'person' : T('افراد')) + ')';
  }
  function paintStatus() {
    var s = saved();
    openers.forEach(function (b) {
      var lbl = b.querySelector('[data-rsvp-lbl]');
      if (lbl) { lbl.textContent = s ? T('اپنا جواب تبدیل کریں') : T('شرکت کی تصدیق کریں'); }
    });
    if (status) { status.textContent = s ? summary(s) : ''; status.hidden = !s; }
    if (!busy) { var sl = sendB.querySelector('[data-lbl]'); if (sl) { sl.textContent = T('جواب بھیجیں'); } }
  }
  window.addEventListener('umrah-lang', paintStatus);

  function openDlg(e) {
    if (e) { e.preventDefault(); }
    lastFocus = document.activeElement;
    var s = saved();
    stForm.hidden = false; stDone.hidden = true; errBox.hidden = true; showNameErr(false); touched = false;
    if (s) {
      nameI.value = s.name || '';
      var r = form.querySelector('input[name="att"][value="' + (s.attending ? 'yes' : 'no') + '"]'); if (r) { r.checked = true; }
      guestsI.value = String(s.guests || 1); msgI.value = s.message || '';
    } else {
      var g = document.getElementById('guestName'); if (g && g.textContent && !nameI.value) { nameI.value = g.textContent; }
    }
    syncGuests();
    dlg.showModal();
    setTimeout(function () { nameI.focus(); }, 30);
    track('rsvp_open');
  }
  function closeDlg() { dlg.close(); }
  dlg.addEventListener('close', function () { if (lastFocus && lastFocus.focus) { lastFocus.focus(); } });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) { closeDlg(); } });
  [].forEach.call(dlg.querySelectorAll('[data-rsvp-close]'), function (b) { b.addEventListener('click', closeDlg); });
  document.getElementById('rsvpEdit').addEventListener('click', function () { stDone.hidden = true; stForm.hidden = false; nameI.focus(); });
  openers.forEach(function (b) { b.removeAttribute('aria-controls'); b.removeAttribute('aria-expanded'); b.setAttribute('aria-haspopup', 'dialog'); b.addEventListener('click', openDlg); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) { return; }
    touched = true;
    if (!nameOk()) { nameI.focus(); showNameErr(true); return; }
    var att = R.askAttending === false ? true : attending();
    var row = {
      name: nameI.value.replace(/\s+/g, ' ').trim().slice(0, 80),
      attending: att,
      guests: att ? Math.max(1, Math.min(max, parseInt(guestsI.value, 10) || 1)) : 0,
      message: (R.askMessage === false ? '' : msgI.value.trim().slice(0, 300)) || null,
      lang: LANG(),
      visitor: vid,
      guest: guest,
      device: DEV
    };
    busy = true; errBox.hidden = true;
    sendB.setAttribute('aria-busy', 'true');
    var lbl = sendB.querySelector('[data-lbl]'), old = lbl.textContent; lbl.textContent = T('بھیجا جا رہا ہے…');
    post('umrah_rsvps', row).then(function () {
      store('umrah-rsvp', JSON.stringify(row));
      doneTxt.textContent = summary(row);
      stForm.hidden = true; stDone.hidden = false;
      document.getElementById('rsvpDoneClose').focus();
      if (row.attending && window.UMRAH_FX && UMRAH_FX.burst) { try { var rb = document.getElementById('rsvpDoneClose').getBoundingClientRect(); UMRAH_FX.burst(rb.left + rb.width / 2, rb.top); } catch (e) {} }
      paintStatus();
    }).catch(function () {
      errBox.hidden = false;
    }).then(function () { busy = false; sendB.removeAttribute('aria-busy'); lbl.textContent = old; });
  });

  paintStatus();
})();
