import {validateAssets} from './validate-assets.js';
import {cp,mkdir,rm} from 'node:fs/promises';
await validateAssets('.');
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
await cp('index.html','dist/index.html');
await cp('src','dist/src',{recursive:true});
console.log('Build estático criado em dist/');
