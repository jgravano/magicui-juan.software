'use client';
import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import type {Library,Project,Snapshot,Action,Version} from '@/lib/studio/library';
import {decodePreset,encodePreset} from '../../../public/cuaderno-object/share-preset.js';
import './studio.css';

type DialogState={kind:'version'|'create'|'rename'|'publish';version?:Version};
const date=(value:string)=>new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
const recoveryKey=(id:string)=>`studio-recovery:${id}`;
function ObjectCover({snapshot,large=false}:{snapshot:Snapshot;large?:boolean}){
 const c=decodePreset(snapshot.preset)||{};
 if(snapshot.thumbnail)return <img className="st-object-image" src={snapshot.thumbnail} alt=""/>;
 return <div className={`st-object ${large?'is-large':''}`} style={{'--cover':c.color,'--wire':c.ringColor,'--band':c.accent,'--paper':c.paper,'--ink':c.printColor} as CSSProperties}><div className="st-paper"/><div className="st-cover"><span>{String(c.printText||'').replaceAll('\\n','\n')}</span>{c.bandVisible&&<i className="st-band"/>}</div><div className="st-rings">{Array.from({length:12},(_,i)=><i key={i}/>)}</div></div>;
}
function Modal({dialog,onClose,onSubmit,busy,project,error}:{dialog:DialogState;onClose:()=>void;onSubmit:(name:string)=>void;busy:boolean;project:Project|null;error:string}){
 const ref=useRef<HTMLDialogElement>(null);
 const [name,setName]=useState(dialog.kind==='rename'?project?.name||'':dialog.kind==='create'?'Nuevo cuaderno':'');
 useEffect(()=>{const el=ref.current;el?.showModal();return()=>el?.close();},[]);
 const publish=dialog.kind==='publish';
 return <dialog ref={ref} className="st-dialog" onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onClick={e=>{if(e.target===ref.current&&!busy)onClose();}}>
  <form onSubmit={e=>{e.preventDefault();onSubmit(name);}}>
   <span className="st-eyebrow">{publish?'DEL TALLER AL MUNDO':'STUDIO / CUADERNO'}</span>
   <h2>{publish?'Una versión, afuera.':dialog.kind==='create'?'Otra posibilidad.':dialog.kind==='rename'?'Un nombre propio.':'Guardá este momento.'}</h2>
   {publish?<><div className="st-publish-object"><ObjectCover snapshot={dialog.version!}/></div><p><strong>{dialog.version?.name}</strong> de {project?.name} reemplazará el cuaderno de <strong>juan.software/001</strong>.</p><p className="st-muted">Tu borrador y las otras versiones siguen en el taller. Podés volver a publicar cualquiera de ellas.</p></>:<label>Nombre<input autoFocus maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder={dialog.kind==='version'?`Versión ${(project?.versions.length||0)+1}`:'Nombre del proyecto'}/></label>}
   {error&&<p role="alert" className="st-modal-error">{error}</p>}<div className="st-dialog-actions"><button type="button" onClick={onClose} disabled={busy}>Volver</button><button className="st-primary" disabled={busy}>{busy?'Un momento…':publish?'Publicar en /001':dialog.kind==='version'?'Guardar versión':dialog.kind==='create'?'Crear proyecto':'Guardar nombre'}</button></div>
  </form>
 </dialog>;
}
export default function StudioWorkspace(){
 const [library,setLibrary]=useState<Library|null>(null),libraryRef=useRef<Library|null>(null);
 const [active,setActive]=useState<string|null>(null),activeRef=useRef<string|null>(null);
 const [preview,setPreview]=useState(false),[history,setHistory]=useState(false),[viewVersion,setViewVersion]=useState<Version|null>(null);
 const [dialog,setDialog]=useState<DialogState|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState('Conectando con tu taller…'),[error,setError]=useState('');
 const [recovery,setRecovery]=useState<Snapshot|null>(null),[ready,setReady]=useState(false),[frameKey,setFrameKey]=useState(0);
 const iframe=useRef<HTMLIFrameElement>(null),snapshotRef=useRef<Snapshot|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),queue=useRef<Promise<unknown>>(Promise.resolve()),dirty=useRef(false);
 const project=library?.projects.find(p=>p.id===active)||null;
 const setData=useCallback((data:Library)=>{libraryRef.current=data;setLibrary(data);},[]);
 useEffect(()=>{fetch('/studio/api/library',{cache:'no-store'}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error);setData(data);setStatus('Todo en su lugar');const selected=data.projects.find((p:Project)=>p.id===new URLSearchParams(location.search).get('project'));if(selected)await openProject(selected);}).catch(e=>setError(e.message));},[setData]);
 const mutate=useCallback((action:Action):Promise<Library>=>{
  const operation=queue.current.then(async()=>{
   const intent={...action,requestId:crypto.randomUUID(),baseDraft:libraryRef.current?.projects.find(p=>p.id===action.projectId)?.draft.preset};
   const response=await fetch('/studio/api/library',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:libraryRef.current?.revision,action:intent})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'No se pudo guardar.');
   setData(data);return data as Library;
  });
  queue.current=operation.catch(()=>{});return operation;
 },[setData]);
 const saveDraft=useCallback(async(id:string,value:Snapshot)=>{
  setStatus('Guardando…');
  try{const data=await mutate({type:'draft',projectId:id,...value});
   if(activeRef.current===id&&snapshotRef.current?.preset===value.preset){dirty.current=false;setStatus('Guardado en tu taller');setError('');try{localStorage.removeItem(recoveryKey(id));}catch{}}
   return data;
  }catch(e){setError((e as Error).message);setStatus('Guardado solo en este dispositivo');throw e;}
 },[mutate]);
 const flush=useCallback(async()=>{if(timer.current)clearTimeout(timer.current);await queue.current;if(dirty.current&&activeRef.current&&snapshotRef.current)await saveDraft(activeRef.current,snapshotRef.current);await queue.current;},[saveDraft]);
 function send(message:object){iframe.current?.contentWindow?.postMessage({source:'juan-studio',...message},location.origin);}
 useEffect(()=>{
  const message=(event:MessageEvent)=>{
   if(event.origin!==location.origin||event.source!==iframe.current?.contentWindow||event.data?.source!=='juan-notebook')return;
   if(event.data.type==='ready'){
    const value=snapshotRef.current;if(value)send({type:'load',preset:value.preset});setReady(true);
   }
   if(event.data.type==='change'&&typeof event.data.preset==='string'&&decodePreset(event.data.preset)){
    const id=activeRef.current;if(!id)return;
    const value={preset:event.data.preset,thumbnail:typeof event.data.thumbnail==='string'?event.data.thumbnail:snapshotRef.current?.thumbnail||''};
    snapshotRef.current=value;dirty.current=true;setStatus('Cambios en el borrador');
    try{localStorage.setItem(recoveryKey(id),JSON.stringify(value));}catch{setError('El navegador no pudo guardar una copia local. Mantené esta pestaña abierta hasta que termine el guardado.');}
    if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{saveDraft(id,value).catch(()=>{});},1800);
   }
   if(event.data.type==='save')setDialog({kind:'version'});
  };
  const leave=(event:BeforeUnloadEvent)=>{if(dirty.current){event.preventDefault();event.returnValue='';}};
  window.addEventListener('message',message);window.addEventListener('beforeunload',leave);
  return()=>{window.removeEventListener('message',message);window.removeEventListener('beforeunload',leave);};
 },[saveDraft]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==='s'&&active){e.preventDefault();setDialog({kind:'version'});}if(e.key==='Escape'&&!dialog){if(preview){setPreview(false);send({type:'preview',value:false});}else setHistory(false);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[active,dialog,preview]);
 async function openProject(next:Project){
  try{await flush();}catch{return;}
  const url=new URL(location.href);url.searchParams.set('project',next.id);window.history.replaceState(null,'',url);
  activeRef.current=next.id;snapshotRef.current=next.draft;dirty.current=false;setActive(next.id);setReady(false);setPreview(false);setViewVersion(null);setHistory(false);setStatus('Guardado en tu taller');setError('');setFrameKey(k=>k+1);
  try{let saved=JSON.parse(localStorage.getItem(recoveryKey(next.id))||'null');if(!saved&&next.id==='001'){const legacy=localStorage.getItem('taco-builder-001-v1');if(legacy){saved={preset:encodePreset(JSON.parse(legacy)),thumbnail:''};localStorage.setItem(recoveryKey(next.id),JSON.stringify(saved));localStorage.removeItem('taco-builder-001-v1');}}setRecovery(saved&&saved.preset!==next.draft.preset&&decodePreset(saved.preset)?saved:null);}catch{setRecovery(null);}
 }
 async function home(){try{await flush();const url=new URL(location.href);url.searchParams.delete('project');window.history.replaceState(null,'',url);setActive(null);activeRef.current=null;setPreview(false);setViewVersion(null);setHistory(false);}catch{}}
 async function submit(name:string){
  if(!dialog||!libraryRef.current)return;setBusy(true);setError('');
  try{
   await flush();let result:Library;
   if(dialog.kind==='create'){
    const base={preset:libraryRef.current.published.preset,thumbnail:''};
    result=await mutate({type:'create',name,...base});setDialog(null);await openProject(result.projects[0]);
   }else if(dialog.kind==='rename'){
    await mutate({type:'rename',projectId:active!,name});setDialog(null);
   }else if(dialog.kind==='version'){
    if(!snapshotRef.current)throw Error('El cuaderno todavía está cargando.');
    result=await mutate({type:'version',projectId:active!,name,...snapshotRef.current});setDialog(null);setHistory(true);setStatus('Versión guardada');
   }else{
    await mutate({type:'publish',projectId:active!,versionId:dialog.version!.id});setDialog(null);setStatus('Publicado en juan.software/001');
   }
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function inspect(version:Version){try{await flush();setViewVersion(version);setPreview(true);send({type:'load',preset:version.preset});send({type:'preview',value:true});}catch{}}
 function backToDraft(){setViewVersion(null);setPreview(false);send({type:'load',preset:snapshotRef.current?.preset});send({type:'preview',value:false});}
 async function restore(version:Version){setBusy(true);try{await flush();const data=await mutate({type:'restore',projectId:active!,versionId:version.id});const updated=data.projects.find(p=>p.id===active)!;snapshotRef.current=updated.draft;backToDraft();setStatus('Versión recuperada como borrador');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function recover(){if(!recovery||!active)return;snapshotRef.current=recovery;send({type:'load',preset:recovery.preset});dirty.current=true;saveDraft(active,recovery).catch(()=>{});setRecovery(null);}
 function discardRecovery(){if(active)localStorage.removeItem(recoveryKey(active));setRecovery(null);}
 async function copyLink(){const preset=viewVersion?.preset||snapshotRef.current?.preset;if(!preset)return;const link='https://www.juan.software/001#preset='+preset;try{await navigator.clipboard.writeText(link);setStatus('Link copiado');}catch{setError('No pudimos copiar el link. Probá desde un navegador con acceso al portapapeles.');}}
 const togglePreview=()=>{if(viewVersion){backToDraft();return;}setPreview(!preview);send({type:'preview',value:!preview});};
 return <main className={`studio-app ${active?'st-editing':'st-library'} ${preview?'st-preview':''}`} lang="es">
  <header className="st-topbar">
   <button className="st-wordmark" onClick={home} aria-label="Studio — volver a proyectos">studio<span className="st-mark">*</span></button>
   {project?<><span className="st-divider"/><button className="st-project-title" onClick={()=>setDialog({kind:'rename'})}>{project.name}<span>↗</span></button><span className="st-draft-label">{viewVersion?viewVersion.name:'Borrador'}</span></>:<span className="st-private">UN ESPACIO DE JUAN</span>}
   <nav className="st-top-actions" aria-label="Acciones del taller">
    {!project&&<a href="https://github.com/jgravano/magicui-juan.software/issues" target="_blank" rel="noreferrer">Tareas ↗</a>}
    {project?<><button className={history?'is-selected':''} aria-pressed={history} onClick={()=>setHistory(!history)}>Versiones <span className="st-count">{project.versions.length}</span></button><button onClick={togglePreview} aria-pressed={preview}>{preview?'Volver a editar':'Vista previa'}</button><button className="st-primary" disabled={!ready||busy||Boolean(viewVersion)} onClick={()=>setDialog({kind:'version'})}>Guardar versión</button></>:<><a href="https://www.juan.software" target="_blank" rel="noreferrer">juan.software ↗</a><form action="/studio/logout" method="post"><button title="Salir de tu cuenta">Salir</button></form></>}
   </nav>
  </header>
  {error&&<div className="st-error" role="alert"><span>{error}</span><button onClick={()=>location.reload()}>Volver a conectar</button></div>}
  {!library?<section className="st-loading"><span className="st-loader"/><p>{error?'Tu taller te espera.':'Abriendo el taller…'}</p></section>:!project?<section className="st-shelf">
   <div className="st-shelf-heading"><div><p className="st-eyebrow">TU TALLER, A TU RITMO</p><h1>Ideas que toman forma<span>.</span></h1></div><button className="st-new" onClick={()=>setDialog({kind:'create'})}><span>＋</span> Nuevo cuaderno</button></div>
   <div className="st-shelf-label"><span>Proyectos <small>{String(library.projects.length).padStart(2,'0')}</small></span><span>OBJETOS / EXPLORACIONES</span></div>
   <div className="st-grid">{library.projects.map((p,i)=><button className="st-card" key={p.id} onClick={()=>openProject(p)}><div className="st-card-art"><span className="st-card-number">{String(i+1).padStart(3,'0')}</span><ObjectCover snapshot={p.draft} large/><span className="st-card-enter">Abrir el taller ↗</span>{library.published.projectId===p.id&&<span className="st-live"><i/>En /001</span>}</div><div className="st-card-meta"><div><h2>{p.name}</h2><p>{p.versions.length} {p.versions.length===1?'versión':'versiones'} · Cuaderno</p></div><span>↗</span></div></button>)}<button className="st-empty-card" onClick={()=>setDialog({kind:'create'})}><span>＋</span><p>¿Y si…?</p><small>Otra versión de lo posible.</small></button></div>
   <footer className="st-shelf-footer"><span>Hecho para probar, cambiar y volver a empezar.</span><span>JUAN.SOFTWARE / STUDIO</span></footer>
  </section>:<>
   <div className="st-desk"><iframe key={`${active}-${frameKey}`} ref={iframe} title={`Mesa de trabajo — ${project.name}`} src="/studio/canvas?managed=1" allow="autoplay; clipboard-write"/>{!ready&&<div className="st-canvas-loading"><span className="st-loader"/>Preparando la mesa…</div>}</div>
   <div className="st-save-state" role="status"><i className={dirty.current?'is-saving':''}/>{viewVersion?`Viendo ${viewVersion.name}`:status}</div>
   {preview&&<div className="st-preview-pill"><span>{viewVersion?'Versión guardada':'Así se siente el producto'}</span><button onClick={copyLink}>Copiar link</button><button onClick={backToDraft}>Volver al borrador ↗</button></div>}
   {recovery&&<div className="st-recovery" role="status"><strong>Hay un borrador de este dispositivo.</strong><p>Podés recuperarlo sin tocar lo publicado.</p><button className="st-primary" onClick={recover}>Recuperar</button><button onClick={discardRecovery}>Usar el de la nube</button></div>}
   {history&&<aside className="st-history" aria-label="Historial de versiones"><header><div><span className="st-eyebrow">EL RECORRIDO</span><h2>Versiones</h2></div><button aria-label="Cerrar versiones" onClick={()=>setHistory(false)}>×</button></header><p className="st-history-intro">Puntos a los que siempre podés volver.</p><button className="st-save-version" disabled={busy||!ready} onClick={()=>setDialog({kind:'version'})}>＋ Guardar el borrador actual</button><div className="st-version-list">{project.versions.length===0?<p className="st-muted">Todavía no hay versiones. Guardá la primera cuando encuentres algo que te guste.</p>:project.versions.map(v=>{const live=library.published.versionId===v.id&&library.published.projectId===project.id;return <article key={v.id} className={`st-version ${viewVersion?.id===v.id?'is-viewing':''}`}><button className="st-version-preview" onClick={()=>inspect(v)} aria-label={`Ver ${v.name}`}><ObjectCover snapshot={v}/></button><div className="st-version-info"><h3>{v.name}</h3><time>{date(v.createdAt)}</time>{live&&<span className="st-live-inline"><i/>Publicada en /001</span>}</div><div className="st-version-actions"><button onClick={()=>inspect(v)}>Ver</button><button disabled={busy} onClick={()=>restore(v)}>Restaurar</button><button disabled={busy||live} onClick={()=>setDialog({kind:'publish',version:v})}>{live?'Publicada':'Publicar ↗'}</button></div></article>;})}</div><a className="st-view-live" href="https://www.juan.software/001" target="_blank" rel="noreferrer">Ver el producto publicado ↗</a></aside>}
  </>}
  {dialog&&<Modal key={dialog.kind} dialog={dialog} project={project} error={error} busy={busy} onClose={()=>setDialog(null)} onSubmit={submit}/>}
 </main>;
}
