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
s=s.replace('{{M1}}',b64(os.path.join(img,'M.jpg')))
for f in glob.glob(os.path.join(img,'*.jpg')):
    s=s.replace('{{P_'+os.path.basename(f)[0]+'}}',b64(f))
s=s.replace('{{SCENES}}',rd(os.path.join(S,'scenes.js'))).replace('{{THREE}}',rd(os.path.join(S,'vendor','three.min.js')))
open(os.path.join(R,'index.html'),'w',encoding='utf-8').write(s); print('index.html',len(s),'bytes')
