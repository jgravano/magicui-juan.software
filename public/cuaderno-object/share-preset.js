import {normalize} from './builder-model.js';
// Version 1 field order is permanent so existing links survive new settings.
const presetKeys=["color","material","paper","pages","binding","accent","ringColor","azimuth","elevation","intensity","opacity","gloss","texture","textureStrength","marginX","marginY","coverThickness","ringSize","wire","loops","metalness","paperTexture","paperStyle","bandWidth","bandVisible","logo","printText","printCaption","printColor","printFont","printSize","printX","printY","printRotation","printSpacing","printWeight","printAlign"];
export function encodePreset(config){
 const clean=normalize(config),values=presetKeys.map(key=>clean[key]);
 const bytes=new TextEncoder().encode(JSON.stringify({v:1,values}));
 return btoa(Array.from(bytes,byte=>String.fromCharCode(byte)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function decodePreset(value){
 try{
  if(!value||value.length>12000)return null;
  const bytes=Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
  const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  const keys=presetKeys;
  if(data.v!==1||!Array.isArray(data.values)||data.values.length!==keys.length)return null;
  return normalize(Object.fromEntries(keys.map((key,i)=>[key,data.values[i]])));
 }catch{return null;}
}
export function presetLink(config,origin){
 const base=new URL(origin);if(base.hostname==='studio.juan.software')base.hostname='www.juan.software';const url=new URL('/001',base);url.hash='preset='+encodePreset(config);return url.href;
}
