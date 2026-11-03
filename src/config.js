/* ============================================================
   Invitation settings: edit here, then run: python3 build.py
   ============================================================ */
window.UMRAH_CONFIG = {
  /* Live address of the site (no trailing slash). Used for the
     WhatsApp / Facebook link preview picture and share links.   */
  siteUrl: 'https://umrah-psi.vercel.app',

  /* Supabase project that stores replies and click counts.
     supabaseKey = the project's *publishable* (anon) key.
     It is safe in a public page: guests can only ADD rows,
     never read them (see supabase/umrah.sql).
     Leave the key empty to switch storage off completely.      */
  supabaseUrl: 'https://lvubaodrrxgaeetogwao.supabase.co',
  supabaseKey: 'sb_publishable__vVRhzofqqkGxIZ98xSS-Q_0xc5NfFk',

  /* Count anonymous clicks (visits, calls, WhatsApp, maps…).   */
  tracking: true,

  /* Attendance reply.
     mode: 'form'     → guests fill a short form, saved for your report
           'whatsapp' → old behaviour: guest picks a host on WhatsApp
           'off'      → hide every "Confirm attendance" button
     ('form' falls back to 'whatsapp' while supabaseKey is empty.) */
  rsvp: {
    mode: 'form',
    askAttending: true,   // "Will you come? Yes / No"
    askGuests: true,      // "How many people?"
    maxGuests: 10,
    askMessage: true      // optional message / dua
  }
};
