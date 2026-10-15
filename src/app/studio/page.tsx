import StudioWorkspace from '@/components/studio/StudioWorkspace';
import {configured,isOwner} from '@/lib/studio/auth';
export const dynamic='force-dynamic';
export const metadata={title:'Studio',robots:{index:false,follow:false}};
export default async function Studio(){
 if(await isOwner())return <StudioWorkspace/>;
 return <main style={{minHeight:'100svh',display:'grid',placeItems:'center',padding:24}}><div style={{maxWidth:340}}><p style={{fontSize:11,letterSpacing:2}}>JUAN.SOFTWARE</p><h1 style={{fontSize:36,letterSpacing:-1}}>Studio</h1><p style={{color:'#74746b',fontSize:14,lineHeight:1.6}}>Tu espacio para editar los experimentos.</p>{configured()?<a href="/studio/login" style={{display:'inline-block',background:'#20221b',color:'#f6f5f0',borderRadius:24,padding:'13px 22px',marginTop:16}}>Entrar con GitHub</a>:<p>El acceso privado todavía no está configurado.</p>}<p style={{fontSize:12,color:'#74746b',marginTop:24}}>Acceso exclusivo para jgravano.</p></div></main>;
}
