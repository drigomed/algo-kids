export const visualChapters=Object.freeze({
 navigator:{label:'Primeiros passos',robotSkin:'mk1',environmentTheme:'grass',goalSkin:'star',obstacleSkin:'rock'},
 collector:{label:'Coleta e escolhas',robotSkin:'mk2',environmentTheme:'trail',goalSkin:'star',obstacleSkin:'rock'},
 reactive:{label:'Mundo inteligente',robotSkin:'mk3',environmentTheme:'yard',goalSkin:'beacon',obstacleSkin:'crate'},
 advanced:{label:'Missões avançadas',robotSkin:'mk4',environmentTheme:'factory',goalSkin:'landing-pad',obstacleSkin:'crate'}
});
const variable=(name,yes='on',no='off')=>({source:'variable',name,values:[{value:true,state:yes},{value:false,state:no}]});
const color=name=>({source:'property',name,values:[{value:'red',state:'red'},{value:'green',state:'green'},{value:'yellow',state:'yellow'},{value:'vermelho',state:'red'},{value:'azul',state:'blue'},{value:'verde',state:'green'}]});
const keys={fechadura:{assetGroup:'lock',state:color('cor')},'opcao-vermelho':{assetGroup:'key',state:color('cor')},'opcao-azul':{assetGroup:'key',state:color('cor')},'opcao-verde':{assetGroup:'key',state:color('cor')}};
export const visualByMission=Object.fromEntries([
 ...[1,2,3,4,5,6].map(id=>[id,{chapter:'navigator'}]),
 ...[7,8,9,10,11,12].map(id=>[id,{chapter:'collector'}]),
 ...[13,14,15,16,17,18,19].map(id=>[id,{chapter:'reactive'}]),
 ...[20,21,22,23,24,25].map(id=>[id,{chapter:'advanced'}])
]);
Object.assign(visualByMission[12],{entities:{'cristal-1':{assetGroup:'crystal',badge:'+2'}},variantLooks:{simples:{entities:{'cristal-1':{assetGroup:'crystal',badge:'+1'},'cristal-2':{assetGroup:'crystal',badge:'+1'}}}}});
Object.assign(visualByMission[13],{properties:{signal:{assetGroup:'traffic',state:color('signal')}},barrierDefaults:{assetGroup:'gate'}});
Object.assign(visualByMission[14],{entities:{objeto:{assetGroup:'key',state:'green'}},barrierDefaults:{assetGroup:'door'}});
Object.assign(visualByMission[15],{entities:{placa:{assetGroup:'plate',state:variable('placaAtiva')}},barrierDefaults:{assetGroup:'bridge'}});
Object.assign(visualByMission[16],{entities:{objeto:{assetGroup:'package'},estacao:{assetGroup:'station',state:variable('entregue','active','idle')}}});
Object.assign(visualByMission[17],{properties:{mark:{assetGroup:'sign',state:color('mark')}}});
Object.assign(visualByMission[18],{entities:{controle:{assetGroup:'button',state:variable('aberta')}}});
Object.assign(visualByMission[19],{entities:{origem:{assetGroup:'package'},destino:{assetGroup:'station',state:variable('entregue','active','idle')}}});
Object.assign(visualByMission[20],{barrierDefaults:{assetGroup:'bridge'}});
for(const id of [21,22])Object.assign(visualByMission[id],{entities:keys,barrierDefaults:{assetGroup:'door'}});
Object.assign(visualByMission[23],{environmentTheme:'parking',obstacleSkin:'cone',entities:{controle:{assetGroup:'terminal',state:variable('liberada','active','idle')}}});
// Conteúdo futuro pode fornecer presentation.visual sem mudar o motor ou este resolvedor.
export function themeConfig(mission,overrides={}) {
 const local=mission.presentation?.visual??{},mapped=visualByMission[mission.id]??{};
 const chapter=Object.hasOwn(visualChapters,local.chapter??mapped.chapter)?local.chapter??mapped.chapter:'navigator';
 const options={...visualChapters[chapter],...mapped,...mapped.variantLooks?.[mission.variantId],...local,...overrides,chapter};
 return {...options,robotSkin:['mk1','mk2','mk3','mk4'].includes(options.robotSkin)?options.robotSkin:'mk1',environmentTheme:['grass','trail','yard','factory','parking'].includes(options.environmentTheme)?options.environmentTheme:'grass',goalSkin:['star','beacon','landing-pad'].includes(options.goalSkin)?options.goalSkin:'star',obstacleSkin:['rock','crate','cone','bollard'].includes(options.obstacleSkin)?options.obstacleSkin:'rock'};
}
