const reserved = new Set(['__proto__','prototype','constructor','collectedCount']);
export function validVariable(name) { return typeof name==='string' && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(name) && !reserved.has(name); }
export function scalar(value) { return ['string','boolean'].includes(typeof value) || (typeof value==='number' && Number.isFinite(value)); }
export function record(value) { return value!==null && typeof value==='object' && !Array.isArray(value); }
// Validação estrutural JSON, sem invocar getters nem serializar funções silenciosamente.
export function assertJsonData(value, root='dados') {
  const ancestors=new Set(); let count=0;
  function visit(item,path,depth) {
    const fail=message=>{throw new Error(`${path}: ${message}`);};
    if (++count>30000 || depth>40) fail('dados muito grandes ou profundos');
    if (item===null || typeof item==='boolean' || (typeof item==='number'&&Number.isFinite(item))) return;
    if (typeof item==='string') { if(item.length>4096)fail('texto muito longo'); return; }
    if (!record(item)&&!Array.isArray(item)) fail('valor não compatível com JSON');
    if (Array.isArray(item) ? Object.getPrototypeOf(item)!==Array.prototype : ![Object.prototype,null].includes(Object.getPrototypeOf(item))) fail('objeto deve ser declarativo');
    if (ancestors.has(item)) fail('referência circular');
    ancestors.add(item);
    const descriptors=Object.getOwnPropertyDescriptors(item);
    if (Reflect.ownKeys(item).some(key=>typeof key==='symbol')) fail('chave não compatível com JSON');
    if (Array.isArray(item) && item.length>1000) fail('lista muito longa');
    for (const [key,descriptor] of Object.entries(descriptors)) {
      if (Array.isArray(item)&&key==='length') continue;
      if (['__proto__','prototype','constructor'].includes(key) || descriptor.get || descriptor.set) fail('campo inseguro');
      if (Array.isArray(item)&&(!/^\d+$/.test(key)||String(Number(key))!==key||Number(key)>=item.length)) fail('campo inválido em lista');
      visit(descriptor.value,`${path}.${key}`,depth+1);
    }
    if(Array.isArray(item)&&Object.keys(item).length!==item.length)fail('lista esparsa');
    ancestors.delete(item);
  }
  visit(value,root,0);
}
export class ExecutionFault extends Error {
  constructor(reason,details={}) { super(reason); this.reason=reason; this.details=details; }
}
export function actionFailure(state,reason,details={}) {
  return {...state,status:'actionFailed',lastEvent:'actionFailed',reason,events:[{type:'actionFailed',reason,success:false,...details}]};
}
