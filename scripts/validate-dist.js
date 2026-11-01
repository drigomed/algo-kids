import {validateAssets} from './validate-assets.js';
import {assetRegistry} from '../src/presentation/asset-registry.js';
import {readdir, readFile, lstat} from 'node:fs/promises';
import {resolve, relative} from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(process.argv[2] ?? 'dist');
const files = new Set();
const assets=new Set(Object.values(assetRegistry).map(file=>`src/assets/${file}`));
async function walk(directory) {
  for (const name of await readdir(directory)) {
    const path = resolve(directory, name);
    const stat = await lstat(path);
    assert(!stat.isSymbolicLink(), `Link simbólico não permitido: ${path}`);
    if (stat.isDirectory()) await walk(path);
    else {
      assert(stat.isFile(), `Entrada não regular: ${path}`);
      const local = relative(root, path).split('\\').join('/');
      assert(local === 'index.html' || (/^src\/.+\.(js|css)$/.test(local)&&!local.startsWith('src/assets/')) || assets.has(local), `Arquivo inesperado no artefato: ${local}`);
      assert(stat.size > 0, `Arquivo vazio: ${local}`);
      files.add(local);
    }
  }
}
await walk(root);
await validateAssets(root);
for (const required of ['index.html', 'src/style.css', 'src/ui.js', 'src/engine.js', 'src/missions.js']) {
  assert(files.has(required), `Recurso obrigatório ausente: ${required}`);
}
const origin = 'https://drigomed.github.io';
const base = `${origin}/algo-kids/`;
for(const file of Object.values(assetRegistry)) {
  const url=new URL(`../assets/${file}`,new URL('src/presentation/asset-registry.js',base));
  assert(url.origin===origin&&url.pathname.startsWith('/algo-kids/src/assets/'),`Asset fora do subdiretório: ${file}`);
  assert(files.has(decodeURIComponent(url.pathname.slice('/algo-kids/'.length))),`Asset não publicado: ${file}`);
}
let references = assets.size;
for (const file of files) {
  const source = await readFile(resolve(root, file), 'utf8');
  assert(!/\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)\b/i.test(source), `Referência local em ${file}`);
  const patterns = file.endsWith('.html')
    ? [/\b(?:src|href)\s*=\s*["']([^"']+)["']/g]
    : file.endsWith('.css')
      ? [/url\(\s*["']?([^\s"')]+)["']?\s*\)/g, /@import\s+["']([^"']+)["']/g]
      : [/\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?["']([^"']+)["']/g, /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g];
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) {
    const ref = match[1];
    if (ref.startsWith('#')) continue;
    assert(!ref.startsWith('/') && !/^[\w+.-]+:/.test(ref), `Use caminho relativo em ${file}: ${ref}`);
    const url = new URL(ref, new URL(file, base));
    assert(url.origin === origin && url.pathname.startsWith('/algo-kids/'), `Referência fora do subdiretório em ${file}: ${ref}`);
    const target = decodeURIComponent(url.pathname.slice('/algo-kids/'.length)) || 'index.html';
    assert(files.has(target) || (target.endsWith('/') && files.has(`${target}index.html`)), `Recurso ausente em ${file}: ${ref}`);
    if (file.endsWith('.js')) assert(ref.startsWith('./') || ref.startsWith('../'), `Import sem caminho relativo em ${file}: ${ref}`);
    references++;
  }
}
console.log(`Artefato validado: ${files.size} arquivos, ${references} referências compatíveis com /algo-kids/.`);
