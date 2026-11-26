// Cap Retina cost by both density and total pixels; CSS size stays unchanged.
export function renderPixelRatio(width,height,dpr=1){
 const area=Math.max(1,width*height);
 return Math.min(Math.max(.5,dpr||1),1.5,Math.sqrt(3_000_000/area));
}

// Render on input and while a spring is moving. No background polling or idle
// GPU submissions; a fresh gesture starts with a normal timestep after sleep.
export function createRenderLoop(render,{
 requestFrame=callback=>requestAnimationFrame(callback),
 cancelFrame=id=>cancelAnimationFrame(id),
 visible=typeof document==='undefined'||!document.hidden,
}={}){
 let frame=null,lastTime=null,dirty=false;
 function schedule(){if(visible&&frame===null)frame=requestFrame(tick);}
 function tick(now){
  frame=null;
  if(!visible)return;
  const dt=lastTime===null?1/60:Math.min(.033,Math.max(0,(now-lastTime)/1000));
  lastTime=now;dirty=false;
  const moving=render(now,dt);
  if(moving||dirty)schedule();else lastTime=null;
 }
 return {
  invalidate(){dirty=true;schedule();},
  setVisible(value){
   visible=Boolean(value);lastTime=null;
   if(!visible){if(frame!==null)cancelFrame(frame);frame=null;}
   else {dirty=true;schedule();}
  },
  dispose(){visible=false;if(frame!==null)cancelFrame(frame);frame=null;lastTime=null;},
 };
}
