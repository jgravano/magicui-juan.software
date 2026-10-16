import {randomUUID} from 'node:crypto';
import {decodePreset,encodePreset} from '../../../public/cuaderno-object/share-preset.js';
import {defaults} from '../../../public/cuaderno-object/builder-model.js';

export type Snapshot={preset:string;thumbnail:string};
export type Version=Snapshot&{id:string;name:string;createdAt:string};
export type Project={id:string;name:string;updatedAt:string;draft:Snapshot;versions:Version[]};
export type Publication={projectId:string;versionId:string;preset:string;at:string};
export type Library={schema:1;revision:number;projects:Project[];published:Publication;operations?:string[]};
export type Action={type:'draft'|'version'|'create'|'rename'|'restore'|'publish';projectId?:string;versionId?:string;name?:string;preset?:string;thumbnail?:string;requestId?:string;baseDraft?:string};
export class LibraryError extends Error {constructor(message:string,public status=400){super(message);}}
const cleanName=(v:unknown,fallback:string)=>typeof v==='string'&&v.trim()?v.trim().slice(0,80):fallback;
export function snapshot(input:Partial<Snapshot>):Snapshot {
 const decoded=decodePreset(input.preset);
 if(!decoded)throw new LibraryError('El diseño no es válido.');
 const thumbnail=typeof input.thumbnail==='string'&&input.thumbnail.length<=90000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(input.thumbnail)?input.thumbnail:'';
 return {preset:encodePreset(decoded),thumbnail};
}
export function initialLibrary():Library {
 const preset=encodePreset(defaults),at='2026-10-15T00:00:00.000Z';
 return {schema:1,revision:0,projects:[{id:'001',name:'Cuaderno',updatedAt:at,draft:{preset,thumbnail:''},versions:[{id:'original',name:'Original',createdAt:at,preset,thumbnail:''}]}],published:{projectId:'001',versionId:'original',preset,at}};
}
export function mutateLibrary(current:Library,action:Action,now=new Date().toISOString()):Library {
 const library=structuredClone(current);
 if(action.type==='create'){
  if(library.projects.length>=24)throw new LibraryError('Tu biblioteca llegó a 24 proyectos.');
  const draft=snapshot(action);
  library.projects.unshift({id:randomUUID(),name:cleanName(action.name,'Cuaderno sin título'),updatedAt:now,draft,versions:[]});
 }else{
  const project=library.projects.find(p=>p.id===action.projectId);
  if(!project)throw new LibraryError('No encontramos este proyecto.',404);
  const addVersion=(value:Snapshot,name:string)=>{
   if(project.versions.length>=100)throw new LibraryError('Este proyecto llegó a 100 versiones. Duplicalo para seguir explorando.');
   const version={...value,id:randomUUID(),name,createdAt:now};project.versions.unshift(version);return version;
  };
  switch(action.type){
   case 'draft':project.draft=snapshot(action);break;
   case 'rename':project.name=cleanName(action.name,project.name);break;
   case 'version':{const value=snapshot(action);project.draft=value;addVersion(value,cleanName(action.name,`Versión ${project.versions.length+1}`));break;}
   case 'restore':{
    const version=project.versions.find(v=>v.id===action.versionId);
    if(!version)throw new LibraryError('Esa versión ya no está disponible.',404);
    if(project.draft.preset!==version.preset&&!project.versions.some(v=>v.preset===project.draft.preset))addVersion(project.draft,'Antes de restaurar');
    project.draft={preset:version.preset,thumbnail:version.thumbnail};break;
   }
   case 'publish':{
    const version=project.versions.find(v=>v.id===action.versionId);
    if(!version)throw new LibraryError('Guardá una versión antes de publicar.');
    library.published={projectId:project.id,versionId:version.id,preset:version.preset,at:now};break;
   }
   default:throw new LibraryError('Acción no válida.');
  }
  project.updatedAt=now;
 }
 library.revision++;return library;
}

// Rebase a user's intent onto the latest library without discarding another draft.
export function rebaseLibrary(current:Library,action:Action):Library {
 const library=structuredClone(current);
 const project=library.projects.find(p=>p.id===action.projectId);
 if(project&&['draft','version','restore'].includes(action.type)&&typeof action.baseDraft==='string'&&project.draft.preset!==action.baseDraft&&project.draft.preset!==action.preset&&!project.versions.some(v=>v.preset===project.draft.preset)){
  if(project.versions.length>=100)throw new LibraryError('No hay espacio para preservar ambas versiones. Tu borrador local sigue disponible.');
  project.versions.unshift({...project.draft,id:randomUUID(),name:'Respaldo de otra sesión',createdAt:new Date().toISOString()});
 }
 const next=mutateLibrary(library,action);
 if(action.requestId)next.operations=[...(current.operations||[]),action.requestId].slice(-64);
 return next;
}
