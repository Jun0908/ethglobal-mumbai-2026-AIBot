"""Align the saved English narration to the existing three-minute screen recording."""
import argparse,difflib,json,math,re,subprocess,unicodedata,wave
from pathlib import Path

parser=argparse.ArgumentParser();parser.add_argument('--dir',default='output/demo-video');parser.add_argument('--video',required=True);args=parser.parse_args()
root=Path(args.dir).resolve();folder=root/'narration';video=Path(args.video).resolve()
video_info=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height:format=duration','-of','json',str(video)]))
if (video_info['streams'][0]['width'],video_info['streams'][0]['height'])!=(1280,720) or abs(float(video_info['format']['duration'])-180)>.05:
 raise ValueError('Expected the 180-second 1280x720 silent demo as input')
plan=json.loads(Path(__file__).with_name('narration.en.json').read_text(encoding='utf-8-sig'))
transcript=json.loads((folder/'transcript.json').read_text(encoding='utf-8'))
def tokens(text):
 return re.findall(r"[a-z0-9]+(?:'[a-z]+)?",unicodedata.normalize('NFKD',text).encode('ascii','ignore').decode().lower())
ref=[];spans=[];actual=[];times=[]
for shot in plan:
 start=len(ref);ref+=tokens(shot['text']);spans.append((start,len(ref)))
for word in transcript['words']:
 for text in tokens(word['word']):actual.append(text);times.append((word['start'],word['end']))
matcher=difflib.SequenceMatcher(None,ref,actual,autojunk=False);mapping={};differences=[]
for op,a,b,c,d in matcher.get_opcodes():
 if op!='equal':differences.append({'operation':op,'reference':ref[a:b],'recognized':actual[c:d]})
 if op=='equal' or (op=='replace' and b-a==d-c):
  for i,j in zip(range(a,b),range(c,d)):mapping[i]=j
if matcher.ratio()<.99 or len(mapping)!=len(ref):raise RuntimeError('Narration needs manual transcript review before editing')
with wave.open(str(folder/'source-en.wav'),'rb') as f:
 params=f.getparams();raw=f.readframes(f.getnframes())
assert params.sampwidth==2
rate=params.framerate;stride=params.nchannels*params.sampwidth;source_duration=len(raw)/stride/rate
result=bytearray(180*rate*stride);alignment=[]
for shot,(first,last) in zip(plan,spans):
 i=mapping[first];j=mapping[last-1]
 start=max(0,times[i][0]-.08);end=min(source_duration,times[j][1]+.18)
 if i>0:start=max(start,(times[i-1][1]+times[i][0])/2)
 if j+1<len(times):end=min(end,(times[j][1]+times[j+1][0])/2)
 source_start=round(start*rate);source_end=round(end*rate)
 target=round((shot['start']+.3)*rate);length=source_end-source_start
 if target+length>round((shot['start']+shot['duration']-.1)*rate):raise RuntimeError('Speech does not fit its scene: '+shot['clip'])
 result[target*stride:(target+length)*stride]=raw[source_start*stride:source_end*stride]
 alignment.append({'clip':shot['clip'],'text':shot['text'],'source_start':source_start/rate,'source_end':source_end/rate,'video_start':target/rate,'video_end':(target+length)/rate})
with wave.open(str(folder/'aligned-en.wav'),'wb') as f:
 f.setparams(params._replace(nframes=180*rate));f.writeframes(result)
(folder/'alignment.json').write_text(json.dumps({'match_ratio':matcher.ratio(),'differences':differences,'segments':alignment},indent=2),encoding='utf-8')
footer='SECRET TENDER  |  AI-GENERATED VOICE  |  love-match-masala.vercel.app'
(folder/'footer.txt').write_text(footer,encoding='utf-8')
font='C\\:/Windows/Fonts/segoeui.ttf'
filters=f"drawbox=x=0:y=696:w=iw:h=24:color=0x30362b:t=fill,drawtext=fontfile='{font}':textfile='narration/footer.txt':fontsize=12:fontcolor=0xd5d7ba:x=(w-tw)/2:y=701"
output=root/'Secret-Tender-Demo-180s-720p-Narrated-EN.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(video),'-i',str(folder/'aligned-en.wav'),'-map','0:v:0','-map','1:a:0','-vf',filters,'-af','loudnorm=I=-16:TP=-1.5:LRA=11','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-ar','48000','-t','180','-movflags','+faststart',str(output)],cwd=root,check=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(folder/'source-en.wav'),'-c:a','libmp3lame','-b:a','128k',str(folder/'Secret-Tender-Narration-EN.mp3')],check=True)
print('Rendered '+str(output));print('Matched transcript tokens: '+str(round(matcher.ratio()*100,2))+'%');print('Audio kept at its original speed; 21 phrases aligned to the screen recording.')
