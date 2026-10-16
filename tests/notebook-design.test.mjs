import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,normalize,dimensions} from '../public/cuaderno-object/builder-model.js';
import {resizeFormat,holeLayout,designPrompt} from '../public/cuaderno-object/design-tools.js';
import {decodePreset,encodePreset} from '../public/cuaderno-object/share-preset.js';
import {setPaperSize,stripPositions} from '../public/cuaderno-object/paper-physics.js';
test('legacy v1 presets gain dimensions without losing their design',()=>{
 const value='eyJ2IjoxLCJ2YWx1ZXMiOlsiIzAwODBmZiIsImFjZXRhdGUiLCIjZmFmNWU4Iiw5NiwiZG91YmxlIiwiI2ZmNjMwZiIsIiMyY2VkN2YiLDE0NSw1NSwyLjgsMCwwLjYyLCJub25lIiwwLDAuMTIsMC4xNSwwLjA4LDAuMjcsMC4wMjIsMjQsMCwwLjQsImRvdHMiLDAuMTYsdHJ1ZSx0cnVlLCJ0YWNvXG5zdHVkaW8iLCIiLCIjZmZmZmZmIiwiQ291cmllciBOZXciLDM4LDQxLjU1MjkwOTAxMDE0MDk0LDUwLjkwOTA4MjYzMTYzNjA3NSwwLDAuOSwiYm9sZCIsImxlZnQiXX0';
 const decoded=decodePreset(value);assert.equal(decoded.pageWidth,142.5);assert.equal(decoded.printText,'taco\nstudio');assert.equal(decoded.color,'#0080ff');assert.deepEqual(decodePreset(encodePreset(decoded)),decoded);
});
test('format locking retains proportions at both size limits',()=>{
 for(const key of ['pageWidth','pageHeight'])for(const value of [90,120,200,240,320]){
  const next=resizeFormat(defaults,key,value,true);assert.ok(Math.abs(next.pageWidth/next.pageHeight-defaults.pageWidth/defaults.pageHeight)<1e-9);assert.ok(next.pageWidth>=90&&next.pageWidth<=240);assert.ok(next.pageHeight>=120&&next.pageHeight<=320);
 }
});
test('manual perforation position controls wire crossing and survives sharing',()=>{
 const config=normalize({...defaults,pageWidth:180,pageHeight:180,holeAuto:false,holeInset:15,holeShape:'oval',holeEnd:12,loops:9});
 const d=dimensions(config),holes=holeLayout(config,d);
 assert.equal(holes.y.length,9);assert.equal(holes.pitch,19.5);
 assert.ok(Math.abs(d.radiusX*Math.sqrt(1-((d.top-d.centerZ)/d.radiusZ)**2)-d.holeX)<1e-10);
 assert.equal((d.holeX-.02)*50,15);assert.deepEqual(decodePreset(encodePreset(config)),config);
 const prompt=designPrompt(config,d);assert.match(prompt,/180.0 × 180.0/);assert.match(prompt,/9 perforaciones ovaladas/);assert.match(prompt,/15.00 mm del borde/);
});
test('paper turning geometry follows physical format',()=>{
 setPaperSize(3.6,3.6);const p=stripPositions(0);assert.ok(Math.abs(p[57*3-3]-3.695)<1e-5);assert.ok(Math.abs(p[1]+1.8)<1e-5);setPaperSize(2.85,4.05);
});
