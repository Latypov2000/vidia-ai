import json, os, re, shutil, subprocess, uuid
from pathlib import Path
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

DATA=Path(os.getenv('DATA_DIR','/data')); DATA.mkdir(parents=True,exist_ok=True)
app=FastAPI(title='Vidia AI API',version='0.1.0')
app.add_middleware(CORSMiddleware,allow_origins=os.getenv('CORS_ORIGINS','http://localhost:3000').split(','),allow_credentials=False,allow_methods=['*'],allow_headers=['*'])
ALLOWED={'.mp4','.mov','.m4v'}
@app.get('/health')
def health(): return {'status':'ok','service':'vidia-ai-api'}
@app.post('/api/edit')
async def edit(file: UploadFile=File(...)):
    suffix=Path(file.filename or '').suffix.lower()
    if suffix not in ALLOWED: raise HTTPException(400,'Поддерживаются MP4, MOV и M4V')
    job=uuid.uuid4().hex; source=DATA/f'{job}_source{suffix}'; output=DATA/f'{job}_edited.mp4'
    size=0
    try:
        with source.open('wb') as dest:
            while chunk:=await file.read(1024*1024):
                size+=len(chunk)
                if size>2*1024*1024*1024: raise HTTPException(413,'Максимальный размер файла — 2 ГБ')
                dest.write(chunk)
        probe=subprocess.run(['ffmpeg','-i',str(source),'-af','silencedetect=noise=-35dB:d=1.2','-f','null','-'],capture_output=True,text=True,timeout=3600)
        if probe.returncode not in (0,): raise RuntimeError('FFmpeg не смог прочитать видео')
        duration_match=re.search(r'Duration: (\d+):(\d+):(\d+(?:\.\d+)?)',probe.stderr)
        if not duration_match: raise RuntimeError('Не удалось определить длительность видео')
        h,m,s=duration_match.groups(); duration=int(h)*3600+int(m)*60+float(s)
        starts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',probe.stderr)]
        ends=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',probe.stderr)]
        ranges=[]; end_index=0
        for start in starts:
            while end_index<len(ends) and ends[end_index]<=start: end_index+=1
            finish=ends[end_index] if end_index<len(ends) else duration
            if finish-start>=1.2: ranges.append((max(0,start),min(duration,finish)))
            end_index+=1
        keep=[]; cursor=0
        for start,finish in ranges:
            if start>cursor+0.15: keep.append((cursor,start))
            cursor=max(cursor,finish)
        if duration>cursor+0.15: keep.append((cursor,duration))
        if not keep: shutil.copyfile(source,output)
        else:
            filters=[]; labels=[]
            for i,(a,b) in enumerate(keep):
                filters.append(f'[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}]')
                filters.append(f'[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{i}]')
                labels.append(f'[v{i}][a{i}]')
            filters.append(''.join(labels)+f'concat=n={len(keep)}:v=1:a=1[v][a]')
            cmd=['ffmpeg','-y','-i',str(source),'-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-c:v','libx264','-preset','veryfast','-crf','23','-c:a','aac','-movflags','+faststart',str(output)]
            result=subprocess.run(cmd,capture_output=True,text=True,timeout=7200)
            if result.returncode: raise RuntimeError('Ошибка сборки итогового видео: '+result.stderr[-500:])
        return {'job_id':job,'removed_segments':len(ranges),'download_url':f'/api/download/{job}','duration_seconds':duration}
    except HTTPException: raise
    except subprocess.TimeoutExpired: raise HTTPException(504,'Обработка заняла слишком много времени')
    except Exception as exc: raise HTTPException(500,str(exc))
    finally:
        await file.close()
@app.get('/api/download/{job_id}')
def download(job_id:str):
    if not re.fullmatch(r'[a-f0-9]{32}',job_id): raise HTTPException(404,'Файл не найден')
    path=DATA/f'{job_id}_edited.mp4'
    if not path.exists(): raise HTTPException(404,'Файл не найден или срок хранения истёк')
    return FileResponse(path,media_type='video/mp4',filename='vidia-ai-edited.mp4')
