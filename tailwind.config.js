/** Tailwind is used for new components only (language switch, install banner, etc.).
 *  Preflight is off so the original hand-written CSS in template.html is untouched. */
module.exports = {
  prefix: 'tw-',
  content: ['./src/template.html', './src/parts/*.html', './src/i18n.js'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: { night: '#04201A', em: '#0E4B3B', gold: '#C9A24B', gold2: '#E9CF8B', ivory: '#F7F1E3' },
      fontFamily: { naskh: ['Naskh', 'serif'] }
    }
  }
};
