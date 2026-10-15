import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from '../public/cuaderno-object/builder-model.js';
import {encodePreset,decodePreset,presetLink} from '../public/cuaderno-object/share-preset.js';
test('shared links reproduce every setting, including Unicode print and light',()=>{
 const config={...defaults,material:'leather',color:'#802a39',printText:'Milonga 🐈\nEdición ñ',bandVisible:false,azimuth:245,pages:192,printX:73.5};
 const link=new URL(presetLink(config,'https://www.juan.software'));
 assert.equal(link.pathname,'/001');assert.equal(link.search,'');
 assert.deepEqual(decodePreset(new URLSearchParams(link.hash.slice(1)).get('preset')),config);
});
test('invalid or unsupported links are ignored',()=>{
 for(const value of ['', 'invalid!', 'x'.repeat(12001),btoa('{"v":2,"values":[]}')])assert.equal(decodePreset(value),null);
});
test('preset values are normalized and unrelated data is not shared',()=>{
 const result=decodePreset(encodePreset({...defaults,pages:9999,color:'invalid',ink:'private'}));
 assert.equal(result.pages,240);assert.equal(result.color,defaults.color);assert.ok(!('ink' in result));
});
