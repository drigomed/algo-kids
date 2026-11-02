// Metadados do catálogo. IDs só selecionam DADOS, nunca regras do motor/renderizador.
import {themeConfig} from './presentation/theme-config.js';
const property=(name,label)=>({source:'property',name,...(label?{label}:{})});
const variable=(name,label)=>({source:'variable',name,...(label?{label}:{})});
const labels={13:{passagem:'Passagem'},23:{controle:'Controle',passagem:'Saída'},14:{objeto:'Chave',passagem:'Porta'},15:{placa:'Placa',passagem:'Ponte'},16:{objeto:'Pacote',estacao:'Entrega'},17:{passagem:'Passagem'},18:{controle:'Botão',passagem:'Porta'},19:{origem:'Retirada',destino:'Entrega'},20:{'ponte-a':'Ponte A','ponte-b':'Rota B'},21:{fechadura:'Fecho','opcao-vermelho':'V ■','opcao-azul':'A ◆','opcao-verde':'Vd ●',passagem:'Porta'},22:{fechadura:'Fecho','opcao-vermelho':'V ■','opcao-azul':'A ◆','opcao-verde':'Vd ●',passagem:'Porta'},26:{passagem:'Porta'},27:{controle:'A | B',porta:'Porta',desvio:'Desvio'},28:{controle:'Estação',saida:'Saída'},29:{controle:'Triagem',saida:'Saída'},30:{pilha:'Pilha',lixeira:'Lixeira',bloqueio:'Pilha'},31:{pilha:'Pilha',lixeira:'Lixeira',bloqueio:'Pilha'},32:{estacao1:'E1',estacao2:'E2',estacao3:'E3'},33:{pilha:'Pilha',lixeira:'Lixeira',bloqueio:'Pilha'}};
const hidden={17:{properties:{mark:{mark:'corObservada'}}},21:{entities:{fechadura:{cor:'corNecessaria'}},barriers:{passagem:{cor:'corNecessaria'}}},22:{entities:{fechadura:{cor:'corNecessaria'}},barriers:{passagem:{cor:'corNecessaria'}}},26:{barriers:{passagem:{cor:'corNecessaria',forma:'formaNecessaria'}}},32:{entities:Object.fromEntries([1,2,3].map(n=>[`estacao${n}`,{marca:'marcaObservada'}]))}};
function decorate(m){
 const presentation=structuredClone(m.presentation??{}),mapped=themeConfig(m),visual=presentation.visual??={};
 for(const kind of ['entities','barriers']){
  visual[kind]={...structuredClone(mapped[kind]??{}),...visual[kind]};
  for(const object of m[kind]??[]){
   const existing=visual[kind][object.id]??{},friendly=presentation[kind]?.[object.id]?.label??presentation.entityLabel??(kind==='barriers'?'Passagem':'Coleta');
   const badge=labels[m.id]?.[object.id]??existing.badge??friendly;
   visual[kind][object.id]={assetGroup:kind==='barriers'?mapped.barrierDefaults?.assetGroup??'gate':object.collectible?'crystal':'terminal',...existing,badge:badge.slice(0,24),details:existing.details??[]};
   const concealed=hidden[m.id]?.[kind]?.[object.id];if(concealed)visual[kind][object.id].observedProperties=concealed;
  }
 }
 visual.properties={...structuredClone(mapped.properties??{}),...visual.properties};
 for(const cell of m.grid.cells??[])for(const name of Object.keys(cell.properties)){
  visual.properties[name]={assetGroup:'sign',...visual.properties[name],badge:presentation.properties?.[name]?.label??'Sinal'};
  if(hidden[m.id]?.properties?.[name])visual.properties[name].observedProperties=hidden[m.id].properties[name];
 }
 if(m.id===15)visual.properties.marking.state={source:'property',name:'marking',values:[{value:true,state:'green'},{value:false,state:'red'}]};
 if(m.id===20){visual.barriers['ponte-a'].details=[property('capacidade','Até')];visual.barriers['ponte-b'].details=[property('minimo','De'),property('capacidade','Até')];}
 if(m.id===23)visual.barriers.passagem.details=[property('limite','Até')];
 if(m.id===27){visual.entities.controle.details=[variable('autorizacaoA','A'),variable('autorizacaoB','B')];presentation.entities.controle.label='Controle A/B';presentation.barriers.porta.label='Porta principal';presentation.barriers.desvio.label='Desvio sem permissões';}
 if(m.id===28)visual.entities.controle.details=[variable('identificador','ID')];
 if(m.id===29)visual.entities.controle.details=[variable('tipo'),variable('destino')];
 return {...m,presentation};
}
export function identifyCatalogMission(m){
 // Conteúdo inicial deliberadamente intocado, inclusive identidade/HTML dos objetos.
 if(!Object.hasOwn(labels,m.id)&&![9,10,11,12,13,23].includes(m.id))return m;
 const base=decorate(m);if(m.variants)base.variants=m.variants.map(v=>({...v,presentation:decorate({...m,...v,id:m.id,variantId:v.id}).presentation}));return base;
}
