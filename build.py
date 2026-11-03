"""Build index.html from src/. Run:  python3 build.py   (needs only Python 3)"""
import base64, glob, os
R=os.path.dirname(os.path.abspath(__file__)); S=os.path.join(R,'src')
b64=lambda p: base64.b64encode(open(p,'rb').read()).decode()
rd=lambda p: open(p,encoding='utf-8').read()
F=os.path.join(S,'fonts')
fonts={'NASTALIQ':'noto-nastaliq-urdu-arabic-700-normal','NASKH400':'noto-naskh-arabic-arabic-400-normal','NASKH600':'noto-naskh-arabic-arabic-600-normal',
       'NASKHL400':'noto-naskh-arabic-latin-400-normal','NASKHL600':'noto-naskh-arabic-latin-600-normal'}
s=rd(os.path.join(S,'template.html'))
for k in ['MEMORIES','LOCATION']: s=s.replace('{{'+k+'}}',rd(os.path.join(S,'parts',k.lower()+'.html')))
for k,f in fonts.items(): s=s.replace('{{'+k+'}}',b64(os.path.join(F,f+'.woff2')))
img=os.path.join(S,'img','p')
m2=os.path.join(S,'img','p','N.jpg')
if os.path.exists(m2):
    extra=os.path.exists(os.path.join(R,'img','safar','12.jpg'))
    m2div='        <div class="madina-photo"><img src="data:image/jpeg;base64,'+b64(m2)+'" alt="مطاف میں، خانہ کعبہ کے سامنے" decoding="async" style="object-position:50% 30%"></div>\n'
    if extra: m2div+='        <div class="madina-photo"><img src="img/safar/12.jpg" alt="حرم میں، خانہ کعبہ کے سامنے" loading="lazy" decoding="async" style="object-position:70% 40%"></div>\n'
    s=s.replace('{{MADINA_CLS}}',' three' if extra else ' two').replace('{{MADINA2}}',m2div)
    s=s.replace('{{MADINA_C1}}','مکہ مکرمہ اور مدینہ منورہ').replace('{{MADINA_C2}}','خانہ کعبہ اور مسجدِ نبوی ﷺ')
else:
    s=s.replace('{{MADINA_CLS}}','').replace('{{MADINA2}}','')
    s=s.replace('{{MADINA_C1}}','مدینہ منورہ').replace('{{MADINA_C2}}','مسجدِ نبوی ﷺ اور گنبدِ خضریٰ')
s=s.replace('{{M1}}',b64(os.path.join(img,'M.jpg')))
for f in glob.glob(os.path.join(img,'*.jpg')):
    s=s.replace('{{P_'+os.path.basename(f)[0]+'}}',b64(f))
import re
cfg=rd(os.path.join(S,'config.js'))
SITE=re.search(r"siteUrl:\s*'([^']+)'",cfg).group(1).rstrip('/')
s=s.replace('{{CONFIG}}',cfg).replace('{{RSVP}}',rd(os.path.join(S,'rsvp.js'))).replace('{{FX}}',rd(os.path.join(S,'fx.js'))).replace('{{SITE}}',SITE)
s=s.replace('{{TW}}',rd(os.path.join(S,'tw.css'))).replace('{{I18N}}',rd(os.path.join(S,'i18n.js')))
s=s.replace('{{SCENES}}',rd(os.path.join(S,'scenes.js'))).replace('{{THREE}}',rd(os.path.join(S,'vendor','three.min.js')))
open(os.path.join(R,'index.html'),'w',encoding='utf-8').write(s); print('index.html',len(s),'bytes')
r=rd(os.path.join(S,'report.html')).replace('{{TW}}',rd(os.path.join(S,'tw.css'))).replace('{{CONFIG}}',cfg)
open(os.path.join(R,'report.html'),'w',encoding='utf-8').write(r); print('report.html',len(r),'bytes')
