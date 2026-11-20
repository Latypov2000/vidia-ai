'use client';
import { useState } from 'react';

// Keep the production API URL explicit: NEXT_PUBLIC_* values are embedded at build time.
const API = 'https://vidia-ai-api-vz0j.onrender.com';

export default function Home() {
 const [file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [download,setDownload]=useState('');

 async function processVideo(){
  if(!file)return;
  setBusy(true);
  setMessage('Загружаю видео и анализирую тишину…');
  setDownload('');
  try {
   const data=new FormData();
   data.append('file',file);
   const res=await fetch(`${API}/api/edit`,{method:'POST',body:data});
   const body=await res.json().catch(()=>({}));
   if(!res.ok) throw new Error(body.detail||`Сервер вернул ошибку ${res.status}`);
   setMessage(`Готово! Удалено тихих фрагментов: ${body.removed_segments}. Экспорт готов.`);
   setDownload(`${API}${body.download_url}`);
  } catch(e) {
   setMessage(e instanceof TypeError
    ? 'Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.'
    : e instanceof Error ? e.message : 'Произошла неизвестная ошибка.');
  } finally {
   setBusy(false);
  }
 }

 return <main className="shell"><nav><a className="brand" href="#">vidia<span>✳</span></a><span className="navtag">AI VIDEO STUDIO</span></nav><section className="hero"><div className="eyebrow">YOUR STORY, EDITED BY AI</div><h1>От длинного видео<br/><em>к сильной истории.</em></h1><p className="lead">Загрузи исходник. Vidia AI найдёт ритм, уберёт длинные паузы и подготовит первый монтаж.</p></section><section className="workspace"><div className="sectiontop"><div><div className="eyebrow">01 / ЗАГРУЗКА</div><h2>Начни с видео</h2></div><span className="format">MP4 · MOV · M4V</span></div><label className="drop"><input type="file" accept="video/mp4,video/quicktime,video/x-m4v" onChange={e=>{setFile(e.target.files?.[0]||null);setMessage('');setDownload('');}}/><span className="uploadicon">↑</span><strong>{file?file.name:'Перетащи видео сюда'}</strong><small>{file?`${(file.size/1024/1024).toFixed(1)} МБ · готово к обработке`:'или нажми, чтобы выбрать файл'}</small></label><div className="controls"><div><small>РЕЖИМ МОНТАЖА</small><strong>Автоматический · универсальный</strong></div><div><small>ДЛИНА РЕЗУЛЬТАТА</small><strong>Определяет AI</strong></div></div><button className="primary" disabled={!file||busy} onClick={processVideo}>{busy?'Обрабатываю…':'Создать первый монтаж'} <span>↗</span></button>{message&&<div className="status">{message}{download&&<a href={download}>Скачать видео ↓</a>}</div>}<p className="disclaimer">Сейчас доступен первый этап MVP: удаление длинных тихих участков. Семантический поиск лучших моментов и сборка истории находятся в разработке.</p></section><footer><span>VIDIA AI © 2026</span><span>MAKE EVERY SECOND COUNT</span></footer></main>;
}
