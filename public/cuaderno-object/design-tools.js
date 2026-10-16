// Design-space dimensions. One scene unit represents 50 mm.
export const MM=50;
export const formats={a5:{width:148,height:210},a6:{width:105,height:148},square:{width:180,height:180},original:{width:142.5,height:202.5}};
export function resizeFormat(config,key,value,locked){
 const next={...config,[key]:value};
 if(locked){const ratio=config.pageWidth/config.pageHeight;if(key==='pageWidth')next.pageHeight=value/ratio;else next.pageWidth=value*ratio;}
 // Scale both axes together at the boundary so the locked ratio is retained.
 const factor=Math.min(1,240/next.pageWidth,320/next.pageHeight);
 next.pageWidth*=factor;next.pageHeight*=factor;
 const minFactor=Math.max(1,90/next.pageWidth,120/next.pageHeight);
 next.pageWidth*=minFactor;next.pageHeight*=minFactor;
 return next;
}
export function holeLayout(c,d){
 const span=(c.pageHeight/50)-2*c.holeEnd/50;
 const y=Array.from({length:c.loops},(_,i)=>-span/2+i*span/(c.loops-1));
 return {y,pitch:span*50/(c.loops-1),width:c.holeSize/50,height:c.holeSize/50*(c.holeShape==='oval'?1.5:1),x:d.holeX};
}
export function designPrompt(c,d){
 const material={acetate:'acetato',linen:'lino',kraft:'kraft',leather:'cuero',soft:'soft touch'}[c.material];
 const holes=holeLayout(c,d);
 return `Render de producto de un cuaderno anillado Taco, fiel a estas decisiones de diseño.\n\nFORMATO\nHojas de ${c.pageWidth.toFixed(1)} × ${c.pageHeight.toFixed(1)} mm. Relación ancho/alto ${(c.pageWidth/c.pageHeight).toFixed(3)}. Tapas de ${(d.coverWidth*50).toFixed(1)} × ${(d.coverHeight*50).toFixed(1)} mm; espesor ${(c.coverThickness*50).toFixed(2)} mm. Esquinas de radio ${c.cornerRadius.toFixed(1)} mm.\n\nTAPAS\n${material}, color ${c.color}. Opacidad ${Math.round(c.opacity*100)}%, brillo ${Math.round(c.gloss*100)}%. Textura ${c.texture}, intensidad ${Math.round(c.textureStrength*100)}%.\n\nANILLADO Y PERFORACIONES\n${{double:'Doble alambre',spiral:'Espiral continuo',single:'Aros simples'}[c.binding]}, color ${c.ringColor}, ancho ${(d.radiusX*100).toFixed(1)} mm, alambre de diámetro ${(c.wire*100).toFixed(2)} mm. ${c.loops} perforaciones ${ {round:'redondas',oval:'ovaladas',square:'rectangulares'}[c.holeShape] }, de ${c.holeSize.toFixed(1)} × ${(holes.height*50).toFixed(1)} mm, paso ${holes.pitch.toFixed(2)} mm. Centro a ${((d.holeX-.02)*50).toFixed(2)} mm del borde de la tapa.\n\nPAPEL\n${c.pages} páginas, tono ${c.paper}, interior ${c.paperStyle==='dots'?'punteado':'liso'}.\n\nIMPRESIÓN\n${c.logo?`Texto: ${JSON.stringify(c.printText)}. Línea secundaria: ${JSON.stringify(c.printCaption)}. ${c.printFont}, ${c.printWeight}, color ${c.printColor}. Ancla a ${(c.printX/100*d.coverWidth*50).toFixed(1)} mm desde la izquierda y ${(c.printY/100*d.coverHeight*50).toFixed(1)} mm desde arriba. Rotación ${c.printRotation}°.`:'Sin impresión.'}\n\nELÁSTICO\n${c.bandVisible?`Color ${c.accent}, ancho ${(c.bandWidth*50).toFixed(1)} mm.`:'Sin elástico.'}\n\nESCENA\nFondo cálido y neutro, composición centrada, materiales legibles y sombras suaves. Luz a ${c.azimuth}° de dirección y ${c.elevation}° de altura; intensidad visual ${c.intensity.toFixed(2)}. Sin textos ni elementos fuera del objeto.\n\nEstas propiedades describen un modelo visual; no constituyen una ficha validada para fabricación.`;
}
