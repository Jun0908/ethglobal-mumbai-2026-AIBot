"""Edit genuine Playwright footage into 180s, 90s and 30s captioned MP4s."""
import json, subprocess, os, argparse
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--dir',default='output/demo-video')
parser.add_argument('--version',nargs='+',choices=['180s','90s','30s'],default=['90s','30s'])
args=parser.parse_args()
root=Path(args.dir).resolve()
meta=json.loads((root/'capture.json').read_text(encoding='utf-8'))
clips={c['name']:c for c in meta['clips']}
# This range is the original, uninterrupted selection of the remaining traits.
clips['personality_detail']={'source':'owner','start':clips['personality']['end'],'end':clips['preview_setup']['start']}
font=Path(os.environ.get('DEMO_VIDEO_FONT','C:/Windows/Fonts/segoeui.ttf')).as_posix().replace(':',r'\:')
plans={
 '180s':[
  ('home',9,'A little time together, before you meet.'),
  ('create',6,'Start with your own AI twin. No long biography needed.'),
  ('photos',10,'Choose the places and moments you enjoy.'),
  ('photo_montage',14,'Food, activities, travel and quiet time: pick what feels like you.'),
  ('personality',10,'How do you meet someone? What are you like once you are close?'),
  ('personality_detail',11,'Choose your pace, what matters to you, and how you handle differences.'),
  ('preview_setup',8,'Ask your twin something you might ask on a first meeting.'),
  ('preview_reply',10,'Read the response. Does it sound like you?'),
  ('approve',8,'Only you approve your preferences and the example response.'),
  ('invite',8,'Share an invitation to meet your approved twin.'),
  ('meet_invited_twin',6,'A separate visitor opens the invitation and starts fresh.'),
  ('chat_one_send',6,'Begin with a simple question about time together.'),
  ('chat_one_reply',9,'The reply reflects the approved twin and the conversation.'),
  ('chat_two_send',6,'Follow your curiosity. Ask about something you both mentioned.'),
  ('chat_two_reply',9,'Explore a topic you might want to continue in person.'),
  ('game_start',8,'Now try a little date-planning game together.'),
  ('game_choices',10,'Choose a meeting place, then decide on the next stop together.'),
  ('game_ending',8,'Rain changes the plan. Choose how you want to adapt.'),
  ('dashboard',9,'Your conversations and shared memories come together on one page.'),
  ('memories',8,'Revisit the plan you made and the topics you explored.'),
  ('continue_in_person',7,'Save something to ask when you meet the person.'),
 ],
 '90s':[
  ('home',7,'A little time together, before you meet.'),
  ('photos',9,'Create your AI twin with photos you love.'),
  ('photo_montage',5,'Your favorite places. Your kind of time together.'),
  ('personality',8,'Choose the tendencies that feel like you.'),
  ('preview_reply',7,'Talk to your twin. See whether it feels like you.'),
  ('approve',4,'You decide what to approve.'),
  ('invite',4,'Invite someone to meet your approved AI twin.'),
  ('meet_invited_twin',4,'A separate visitor starts a conversation.'),
  ('chat_one_send',3,'Ask something you would ask on a first date.'),
  ('chat_one_reply',6,'Get a feel for a shared conversational rhythm.'),
  ('chat_two_reply',5,'Find a topic you would love to explore together.'),
  ('game_start',4,'Try a small date-planning game.'),
  ('game_choices',6,'Choose a place. Make the next decision together.'),
  ('game_ending',3,'An unexpected turn becomes a shared memory.'),
  ('dashboard',6,'Your conversations and memories, on one page.'),
  ('memories',3,'Keep a little reminder of your time together.'),
  ('continue_in_person',6,'Find something to ask when you meet the person.'),
 ],
 '30s':[
  ('home',4,'Before you meet, share a little time together.'),
  ('photos',4,'Choose photos you love.'),
  ('personality',3,'Add what makes you, you.'),
  ('preview_reply',3,'Try your AI twin before approving.'),
  ('invite',2,'Invite someone to meet your twin.'),
  ('chat_one_reply',4,'Discover how a conversation might feel.'),
  ('game_choices',3,'Talk. Play. Make a memory.'),
  ('game_ending',2,'Talk. Play. Make a memory.'),
  ('memories',3,'Something to remember.'),
  ('continue_in_person',2,'Something to ask when you meet.'),
 ]}
(root/'edits').mkdir(exist_ok=True)
(root/'captions').mkdir(exist_ok=True)
for version,plan in plans.items():
 if version not in args.version: continue
 expected=int(version[:-1])
 assert sum(p[1] for p in plan)==expected
 outdir=root/'edits'/version;outdir.mkdir(exist_ok=True)
 parts=[];timeline=[];cursor=0
 for index,(name,duration,caption) in enumerate(plan):
  clip=clips[name]; source=meta['sources'][clip['source']]['video']
  # Small lead-in tolerance avoids cutting away the first click.
  start=clip['start']; available=clip['end']-start
  speed=max(1,available/duration)
  caption_file=f'captions/{version}-{index:02}.txt';(root/caption_file).write_text(caption,encoding='utf-8')
  footer='love-match-masala.vercel.app  |  Secret Tender' if index==len(plan)-1 else 'SECRET TENDER  |  AI TWIN DEMO  |  ACTUAL BROWSER RECORDING'
  footer_file=f'captions/{version}-{index:02}-footer.txt';(root/footer_file).write_text(footer,encoding='utf-8')
  filters=(f'setpts=(PTS-STARTPTS)/{speed:.8f},fps=30,'
    f'tpad=stop_mode=clone:stop_duration={duration},trim=duration={duration},'
    'pad=1920:1080:0:0:color=0x30362b,'
    f"drawtext=fontfile='{font}':textfile='{caption_file}':fontsize=32:fontcolor=white:x=(w-tw)/2:y=994,"
    f"drawtext=fontfile='{font}':textfile='{footer_file}':fontsize=16:fontcolor=0xd5d7ba:x=(w-tw)/2:y=1050")
  dest=outdir/f'{index:02}-{name}.mp4'
  cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start),'-t',str(available),'-i',source,'-an','-vf',filters,'-t',str(duration),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart',str(dest)]
  subprocess.run(cmd,cwd=root,check=True)
  parts.append(dest);timeline.append({'clip':name,'start':cursor,'duration':duration,'caption':caption,'speed':round(speed,3)});cursor+=duration
  print(f'{version}: {index+1}/{len(plan)} {name}',flush=True)
 listing=outdir/'concat.txt';listing.write_text(''.join("file '"+p.as_posix()+"'\n" for p in parts),encoding='utf-8')
 output=root/f'Secret-Tender-Demo-{version}.mp4'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(output)],check=True)
 (root/f'timeline-{version}.json').write_text(json.dumps(timeline,indent=2),encoding='utf-8')
 print('Rendered '+str(output),flush=True)
