import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Taco Studio — prototipo 001', description: 'Prototipo digital de un cuaderno Taco Studio: abrir, hojear y escribir.' };
export default function Notebook(){return <iframe title="Taco Studio — cuaderno interactivo" src="/cuaderno-object/index.html" allow="autoplay" style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,zIndex:100,background:'#e9e5dc'}}/>;}
