// Missões são configuração; nenhuma capacidade depende destes IDs.
import {seq,eq,mem,set,all,gridFrom,lockMissionData,approach,returnToGoal} from './lock-mission-data.js';
const inc=(variable,amount)=>({type:'increment',variable,amount});
const act=(entityId,actionId,relativeTo='here')=>({type:'interact',relativeTo,entityId,actionId});
const interact=(id,when,effects,relativeTo=['here'])=>({id,relativeTo,once:false,consume:false,when,effects});
const fixedVisual={chapter:'advanced',goalSkin:'star',boardStyle:'blueprint'};
const stationVisual={...fixedVisual,entities:{controle:{assetGroup:'terminal',state:{source:'variable',name:'liberada',values:[{value:true,state:'active'},{value:false,state:'idle'}]}}}};
const inspectShape={type:'inspect',source:{type:'barrierProperty',relativeTo:'front',property:'forma',barrierId:'passagem'},into:'formaNecessaria'};
const keys=[['vermelho','redonda','redround'],['vermelho','quadrada','redsquare'],['azul','redonda','blueround'],['azul','quadrada','bluesquare']];
const pick=(color,shape)=>act(`chave-${color}-${shape}`,'take','front');
const shapeChoice=color=>({type:'if',condition:mem('formaNecessaria','redonda'),then:[pick(color,'redonda')],else:[pick(color,'quadrada')]});
const mission26={...lockMissionData(),id:26,title:'A chave tem cor e forma',demo:true,
 instructions:'Observe cor e forma da fechadura. Use dois SE aninhados para escolher uma chave com as duas propriedades e volte à porta.',hint:'Verifique a cor no SE de fora e a forma em cada ramo. Vermelha não significa redonda: teste as quatro combinações.',
 initialVariables:{cor:'vermelho',forma:'redonda',liberada:false,escolhida:''},robotMemory:{corNecessaria:{type:'string',initial:null},formaNecessaria:{type:'string',initial:null}},
 entities:keys.map(([cor,forma])=>({id:`chave-${cor}-${forma}`,row:0,col:2,collectible:false,onEnter:[],properties:{cor,forma},interactions:[interact('take',all(mem('corNecessaria',cor),mem('formaNecessaria',forma),eq('cor',cor),eq('forma',forma)),[set('liberada',true),set('escolhida',`${cor}-${forma}`)],['front'])]})),
 barriers:[{id:'passagem',row:2,col:2,properties:{cor:{stateVariable:'cor'},forma:{stateVariable:'forma'}},passableWhen:eq('liberada',true),failureCode:'locked'}],
 commandOptions:[{id:'cor',label:'Inspecionar cor da fechadura',node:approach()[1]},{id:'forma',label:'Inspecionar forma da fechadura',node:inspectShape},...keys.map(([c,f])=>({id:`pegar_${c}_${f}`,label:`Pegar chave ${c} ${f}`,node:pick(c,f)}))],
 conditionOptions:[{id:'cor',label:'A cor é vermelha?',condition:mem('corNecessaria','vermelho'),values:[{value:'vermelho',label:'Vermelha',question:'A cor é vermelha?'}]},{id:'forma',label:'A forma é redonda?',condition:mem('formaNecessaria','redonda'),values:[{value:'redonda',label:'Redonda',question:'A forma é redonda?'}]}],
 variants:keys.map(([cor,forma])=>({id:`${cor}-${forma}`,label:`${cor} / ${forma}`,initialVariables:{cor,forma,liberada:false,escolhida:''}})),
 solution:[...seq('A'),approach()[1],inspectShape,...seq('EAAD'),{type:'if',condition:mem('corNecessaria','vermelho'),then:[shapeChoice('vermelho')],else:[shapeChoice('azul')]},...returnToGoal()],
 presentation:{visual:{...fixedVisual,barrierDefaults:{assetGroup:'door'},entities:Object.fromEntries(keys.map(([c,f,state])=>[`chave-${c}-${f}`,{assetGroup:'shapekey',state,badge:`${c==='vermelho'?'V':'A'} ${f==='redonda'?'●':'■'}`}]))},memory:{corNecessaria:{label:'Cor observada'},formaNecessaria:{label:'Forma observada'}},entities:Object.fromEntries(keys.map(([c,f])=>[`chave-${c}-${f}`,{label:`Chave ${c} ${f}`,glyph:f==='redonda'?'●':'■',role:'collectible',interactionMessage:`Chave ${c} ${f} escolhida!`}])),barriers:{passagem:{label:'Fechadura com cor e forma',propertyLabels:{cor:'Cor',forma:'Forma'}}}}
};
const permitA=eq('autorizacaoA',true),permitB=eq('autorizacaoB',true);
const direct=id=>[act('controle',id),...seq('AAA')];
const mission27={id:27,title:'Uma das duas permissões',demo:true,
 instructions:'A OU B pode liberar a porta. SE A, acione A; SENÃO SE B, acione B; sem nenhuma permissão, use o desvio reservado.',hint:'OU é inclusivo: quando as duas permissões existem, usar A já basta. O segundo SE só é avaliado no SENÃO.',
 grid:gridFrom([[2,1],[2,2],[2,3],[2,4],[1,1],[1,2],[1,3]]),start:{row:2,col:1,direction:'L'},goal:{row:2,col:4},initialVariables:{autorizacaoA:false,autorizacaoB:false,liberada:false},
 entities:[{id:'controle',row:2,col:1,collectible:false,onEnter:[],interactions:[interact('acionarA',permitA,[set('liberada',true)]),interact('acionarB',permitB,[set('liberada',true)])]}],
 barriers:[{id:'porta',row:2,col:2,passableWhen:eq('liberada',true),failureCode:'locked'},{id:'desvio',row:1,col:1,passableWhen:all(eq('autorizacaoA',false),eq('autorizacaoB',false)),failureCode:'reserved'}],
 commandOptions:['A','B'].map(c=>({id:`acionar${c}`,label:`Acionar mecanismo ${c}`,node:act('controle',`acionar${c}`)})),conditionOptions:[{id:'A',label:'Tenho permissão A?',condition:permitA},{id:'B',label:'Tenho permissão B?',condition:permitB}],
 variants:[[false,false],[true,false],[false,true],[true,true]].map(([autorizacaoA,autorizacaoB],i)=>({id:`permissoes${i}`,label:`A ${autorizacaoA?'sim':'não'} / B ${autorizacaoB?'sim':'não'}`,initialVariables:{autorizacaoA,autorizacaoB,liberada:false}})),
 solution:[{type:'if',condition:permitA,then:direct('acionarA'),else:[{type:'if',condition:permitB,then:direct('acionarB'),else:seq('EADAADAEA')}]}],
 presentation:{visual:stationVisual,stateIndicators:[{variable:'autorizacaoA',label:'Permissão A'},{variable:'autorizacaoB',label:'Permissão B'}],entities:{controle:{label:'Controle A / B',glyph:'◎'}},barriers:{porta:{label:'Porta A ou B'},desvio:{label:'Desvio reservado a quem não tem permissão'}},failures:{reserved:'O desvio é reservado a quem não tem nenhuma permissão. Use um dos controles.'}}
};
function selectionStation({id,title,instructions,variables,variants,actions,switchOptions,solution,north=false}) {return {
 id,title,demo:true,instructions,hint:'Escolha usando os valores do mundo. A ação incorreta falha; trocar só um dado pode mudar a escolha.',
 grid:gridFrom(north?[[4,2],[3,2],[2,2],[1,2],[0,2]]:[[4,0],[4,1],[4,2],[4,3],[4,4]]),start:north?{row:4,col:2,direction:'N'}:{row:4,col:0,direction:'L'},goal:north?{row:0,col:2}:{row:4,col:4},initialVariables:{...variables,liberada:false},
 entities:[{id:'controle',... (north?{row:4,col:2}:{row:4,col:0}),collectible:false,onEnter:[],interactions:actions.map(a=>interact(a.id,a.when,[set('liberada',true)]))}],
 barriers:[{id:'saida',...(north?{row:3,col:2}:{row:4,col:1}),passableWhen:eq('liberada',true),failureCode:'locked'}],
 commandOptions:actions.map(a=>({id:a.id,label:a.label,node:act('controle',a.id)})),switchOptions,variants:variants.map((v,i)=>({id:`cenario${i}`,label:Object.values(v).join(' / '),initialVariables:{...v,liberada:false}})),solution:[...solution,...seq('AAAA')],
 presentation:{visual:stationVisual,stateIndicators:Object.keys(variables).map(variable=>({variable,label:variable})),entities:{controle:{label:'Estação de seleção',glyph:'◎',interactionMessage:'Seleção aceita! A passagem foi liberada.'}},barriers:{saida:{label:'Saída controlada'}}}
};}
const selector=name=>({kind:'worldVariable',name});
const switches=(name,values)=>({id:`por_${name}`,label:`Escolher ${name}`,selector:selector(name),cases:values.map(value=>({value,label:String(value)})),defaultLabel:'Outro valor'});
const mission28=selectionStation({id:28,title:'Quatro destinos, um identificador',instructions:'Observe o identificador de 0 a 3 e use ESCOLHA. Cada caso aciona um destino diferente da estação antes de seguir à estrela.',variables:{identificador:0},variants:[0,1,2,3].map(identificador=>({identificador})),actions:[0,1,2,3].map(n=>({id:`destino${n}`,label:`Selecionar destino ${n}`,when:eq('identificador',n)})),switchOptions:[switches('identificador',[0,1,2,3])],solution:[{type:'switch',selector:selector('identificador'),cases:[0,1,2,3].map(value=>({value,body:[act('controle',`destino${value}`)]})),default:[]}]});
const pairs=['carta','caixa'].flatMap(tipo=>['norte','sul'].map(destino=>({tipo,destino})));
const mission29=selectionStation({id:29,title:'Duas etiquetas, duas escolhas',instructions:'Leia o tipo de pacote e o destino. No ESCOLHA de tipo, coloque outro ESCOLHA para o destino. Entregue a combinação correta.',variables:{tipo:'carta',destino:'norte'},variants:pairs,north:true,actions:pairs.map(({tipo,destino})=>({id:`entregar_${tipo}_${destino}`,label:`Entregar ${tipo} ao ${destino}`,when:all(eq('tipo',tipo),eq('destino',destino))})),switchOptions:[switches('tipo',['carta','caixa']),switches('destino',['norte','sul'])],solution:[{type:'switch',selector:selector('tipo'),cases:['carta','caixa'].map(tipo=>({value:tipo,body:[{type:'switch',selector:selector('destino'),cases:['norte','sul'].map(destino=>({value:destino,body:[act('controle',`entregar_${tipo}_${destino}`)]})),default:[]}]})),default:[]}]});
export const removeBox=act('pilha','retirar','front'),discardBox=act('lixeira','descartar');
export const inspectBoxes={type:'inspect',source:{type:'entityProperty',relativeTo:'front',property:'quantidade',entityId:'pilha'},into:'quantidadeObservada'};
export const observedCount={kind:'memoryVariable',name:'quantidadeObservada'};
const remaining={type:'stateAtLeast',variable:'restantes',value:1};
function boxesMission(id,title,counts,kind,energy=false){const dynamic=kind==='for';return {
 id,title,demo:true,instructions:dynamic?'Inspecione a pilha. REPITA a quantidade observada: retire UMA caixa e jogue na lixeira. Só depois atravesse até a estrela.':'ENQUANTO ainda houver caixas: retire UMA e jogue na lixeira ao seu lado. Quando não houver mais, atravesse até a estrela.',
 hint:dynamic?'A quantidade guardada é lida uma vez, ao entrar no REPITA. Teste a mesma solução com 1, 2 e 3 caixas.':'O ENQUANTO verifica novamente a pilha a cada ciclo. Se ela estiver vazia, não execute o corpo.',
 start:{row:2,col:1,direction:'L'},goal:{row:2,col:4},grid:gridFrom([[2,1],[2,2],[2,3],[2,4]]),initialVariables:{restantes:counts[0],carregando:false,descartadas:0},
 ...(dynamic?{robotMemory:{quantidadeObservada:{type:'number',initial:null}}}:{}),
 entities:[{id:'pilha',row:2,col:2,collectible:false,onEnter:[],properties:{quantidade:{stateVariable:'restantes'}},interactions:[interact('retirar',all(remaining,eq('carregando',false)),[inc('restantes',-1),set('carregando',true)],['front'])]},
 {id:'lixeira',row:2,col:1,collectible:false,onEnter:[],properties:{quantidade:{stateVariable:'descartadas'}},interactions:[interact('descartar',eq('carregando',true),[set('carregando',false),inc('descartadas',1)])]}],
 barriers:[{id:'bloqueio',row:2,col:2,passableWhen:eq('restantes',0),failureCode:'stackBlocked'}],winCondition:all(eq('restantes',0),eq('carregando',false)),
 commandOptions:[...(dynamic?[{id:'inspecionar',label:'Inspecionar quantidade à frente',node:inspectBoxes}]:[]),{id:'retirar',label:'Retirar uma caixa à frente',node:removeBox},{id:'descartar',label:'Jogar uma caixa na lixeira aqui',node:discardBox}],
 loopOptions:dynamic?[{id:'observado',label:'Repetir a quantidade observada',kind:'for',count:observedCount},{id:'uma',label:'Repetir 1 vez (quantidade fixa)',kind:'for',times:1}]:[{id:'restam',label:'Ainda há caixas?',kind:'while',condition:remaining}],
 solution:[...(dynamic?[inspectBoxes]:[]),dynamic?{type:'for',count:observedCount,body:[removeBox,discardBox]}:{type:'while',condition:remaining,body:[removeBox,discardBox]},...seq('AAA')],
 variants:counts.map(n=>({id:`caixas${n}`,label:`${n} caixa(s)`,initialVariables:{restantes:n,carregando:false,descartadas:0},...(energy?{energy:{initial:4*n+8,costs:{move:2,turnLeft:1,turnRight:1,interact:2,inspect:0,setMemory:0}}}:{})})),
 ...(energy?{energy:{initial:4*counts[0]+8,costs:{move:2,turnLeft:1,turnRight:1,interact:2,inspect:0,setMemory:0}}}:{}),
 presentation:{visual:{...fixedVisual,entities:{pilha:{assetGroup:'stack',quantity:{source:'property',name:'quantidade',empty:'hideImage'}},lixeira:{assetGroup:'bin',quantity:{source:'property',name:'quantidade'}}}},memory:dynamic?{quantidadeObservada:{label:'Quantidade observada'}}:{},stateIndicators:[{variable:'restantes',label:'Caixas na pilha'},{variable:'carregando',label:'Carregando uma caixa'},{variable:'descartadas',label:'Caixas na lixeira'}],entities:{pilha:{label:'Pilha de caixas',glyph:'▣',propertyLabels:{quantidade:'Caixas restantes'},interactionMessage:'Você retirou uma caixa. Agora jogue-a na lixeira!',failureMessages:{preconditionFailed:'Verifique se ainda há caixas e se suas mãos estão vazias.'}},lixeira:{label:'Lixeira',glyph:'▤',role:'delivery',interactionMessage:'Caixa descartada na lixeira!',failureMessages:{preconditionFailed:'Primeiro retire uma caixa da pilha.'}}},barriers:{bloqueio:{label:'Corredor bloqueado pela pilha'}},failures:{stackBlocked:'Ainda há caixas bloqueando a passagem. Retire e descarte uma por vez.'}}
};}
const mission30=boxesMission(30,'Quantas caixas preciso retirar?',[1,2,3],'for');
const mission31=boxesMission(31,'Enquanto houver caixas',[0,1,2,3],'while');
const stations=north=>[1,2,3].map(n=>({id:`estacao${n}`,row:north?4-n:4,col:north?4:n,collectible:false,onEnter:[],properties:{marca:'registrar'},interactions:[{id:'registrar',relativeTo:['here'],once:true,when:mem('marcaObservada','registrar'),effects:[inc('registradas',1)]}]}));
const inspectStation={type:'inspect',source:{type:'entityProperty',relativeTo:'here',property:'marca'},into:'marcaObservada'};
const register={type:'interact',relativeTo:'here',actionId:'registrar'};
const mission32={id:32,title:'Inspecionar, registrar, avançar',demo:true,instructions:'REPITA 3 VEZES: avance até a próxima estação, inspecione e registre. Depois avance à estrela. Todas as estações precisam ser registradas.',hint:'O corpo tem três ações. Dois ciclos não bastam; o mesmo programa funciona no corredor em outra direção.',
 grid:gridFrom([[4,0],[4,1],[4,2],[4,3],[4,4],[3,0],[3,1]]),start:{row:4,col:0,direction:'L'},goal:{row:4,col:4},initialVariables:{registradas:0},robotMemory:{marcaObservada:{type:'string',initial:null}},entities:stations(false),winCondition:eq('registradas',3),
 commandOptions:[{id:'observar',label:'Inspecionar estação aqui',node:inspectStation},{id:'registrar',label:'Registrar estação aqui',node:register}],loopOptions:[{id:'tres',label:'Repetir 3 vezes',kind:'for',times:3},{id:'duas',label:'Repetir 2 vezes',kind:'for',times:2}],
 solution:[{type:'for',times:3,body:[...seq('A'),inspectStation,register]},...seq('A')],
 variants:[{id:'horizontal',label:'Corredor horizontal'},{id:'vertical',label:'Corredor vertical',grid:gridFrom([[4,4],[3,4],[2,4],[1,4],[0,4]]),start:{row:4,col:4,direction:'N'},goal:{row:0,col:4},entities:stations(true)}],
 presentation:{visual:{...fixedVisual,entities:Object.fromEntries([1,2,3].map(n=>[`estacao${n}`,{assetGroup:'station'}]))},memory:{marcaObservada:{label:'Marca da estação'}},stateIndicators:[{variable:'registradas',label:'Estações registradas'}],entities:Object.fromEntries([1,2,3].map(n=>[`estacao${n}`,{label:`Estação ${n}`,glyph:'▤',interactionMessage:`Estação ${n} registrada!`}]))}
};
const mission33=boxesMission(33,'Descarte eficiente',[1,2],'while',true);
mission33.instructions+=' A bateria tem limite, mas há energia para uma pequena variação do caminho. Planeje sem buscar um caminho perfeito.';
export const demoMissionsV092=[mission26,mission27,mission28,mission29,mission30,mission31,mission32,mission33];
