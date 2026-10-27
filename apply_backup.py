"""Apply a trusted Circular Lab browser backup to the distributable static site."""
import base64,json,re,sys,hashlib
from pathlib import Path
root=Path(__file__).resolve().parent/'dist'
if len(sys.argv)!=2:raise SystemExit('Usage: python apply_backup.py backup.json')
data=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
if data.get('format')!='circular-lab-backup' or data.get('version')!=1:raise SystemExit('Invalid backup format')
rows=data['assignments'];assert isinstance(rows,list)
allowed={'pdf','png','jpg','jpeg','webp','mp4','docx','pptx','xlsx','txt'}
pending=[]
for a in rows:
 assert isinstance(a['id'],str) and isinstance(a['number'],int)
 for f in a['files']:
  assert f['type'] in allowed
  if f['url'].startswith('data:'):
   header,encoded=f['url'].split(',',1);assert header.endswith(';base64')
   content=base64.b64decode(encoded,validate=True)
   target='assets/upload-'+hashlib.sha256(content).hexdigest()[:20]+'.'+f['type']
   pending.append((root/target,content));f['url']=target;f.pop('preview',None)
  else:
   target=(root/f['url']).resolve();assert target.is_relative_to(root.resolve()) and target.is_file()
for path,content in pending:path.write_bytes(content)
(root/'data.js').write_text('window.SEED = '+json.dumps(rows,ensure_ascii=True)+';',encoding='utf-8')
print('Backup incorporated. Upload dist/ to your static host.')
