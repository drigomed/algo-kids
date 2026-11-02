// Fábrica de DADOS: fechadura, alcance e chaves; nenhuma regra do interpretador.
export const seq=text=>[...text].map(c=>({type:{A:'move',E:'turnLeft',D:'turnRight'}[c]}));
export const eq=(variable,value)=>({type:'stateEquals',variable,value});
export const mem=(variable,value)=>({type:'memoryEquals',variable,value});
export const set=(variable,value)=>({type:'set',variable,value});
export const all=(...conditions)=>({type:'all',conditions});
export const gridFrom=free=>({width:5,height:5,obstacles:Array.from({length:25},(_,i)=>({row:Math.floor(i/5),col:i%5})).filter(p=>!free.some(([r,c])=>p.row===r&&p.col===c))});
export const colors=[['vermelho','vermelha','red'],['azul','azul','blue'],['verde','verde','green']];
export const inspectLock={type:'inspect',source:{type:'barrierProperty',relativeTo:'front',property:'cor',barrierId:'passagem'},into:'corNecessaria'};
export const take=color=>({type:'interact',relativeTo:'front',actionId:'take',entityId:`opcao-${color}`});
export const approach=()=>[...seq('A'),structuredClone(inspectLock),...seq('EAAD')];
export const returnToGoal=()=>seq('DAAEAAA');
export function lockMissionData(){return {
 start:{row:2,col:0,direction:'L'},goal:{row:2,col:4},grid:gridFrom([[2,0],[2,1],[2,2],[2,3],[2,4],[1,1],[0,1],[0,2],[3,1],[4,1]]),
 initialVariables:{cor:'vermelho',liberada:false,escolhida:''},robotMemory:{corNecessaria:{type:'string',initial:null}},
 entities:[{id:'fechadura',row:2,col:2,collectible:false,onEnter:[],properties:{cor:{stateVariable:'cor'}}},...colors.map(([color])=>({id:`opcao-${color}`,row:0,col:2,collectible:false,onEnter:[],properties:{cor:color},interactions:[{id:'take',relativeTo:['front'],once:true,consume:true,when:all(mem('corNecessaria',color),eq('cor',color)),effects:[set('escolhida',color),set('liberada',true)]}]}))],
 barriers:[{id:'passagem',row:2,col:2,properties:{cor:{stateVariable:'cor'}},passableWhen:eq('liberada',true),failureCode:'locked'}],
 commandOptions:[{id:'observarFechadura',label:'Inspecionar a cor da fechadura à frente',node:structuredClone(inspectLock)},...colors.map(([color,label])=>({id:`retirar${color}`,label:`Retirar a chave ${label} à frente`,node:take(color)}))],
 conditionOptions:colors.slice(0,2).map(([color,label])=>({id:`cor${color}`,label:`A cor observada é ${label}?`,condition:mem('corNecessaria',color),values:[{value:color,label,question:`A cor observada é ${label}?`}]})),
 variants:colors.map(([cor,label])=>({id:cor,label:`Fechadura ${label}`,initialVariables:{cor,liberada:false,escolhida:''}})),
 presentation:{visual:{chapter:'advanced',boardStyle:'blueprint',goalSkin:'star',barrierDefaults:{assetGroup:'door'},entities:{fechadura:{assetGroup:'lock',state:{source:'property',name:'cor',values:colors.map(([value,,state])=>({value,state}))}},...Object.fromEntries(colors.map(([color,,state])=>[`opcao-${color}`,{assetGroup:'key',state}]))}},memory:{corNecessaria:{label:'Cor observada',values:colors.map(([value,label])=>({value,label}))}},entities:{fechadura:{label:'Fechadura',glyph:'▥',propertyLabels:{cor:'Cor requerida'}},...Object.fromEntries(colors.map(([color,label])=>[`opcao-${color}`,{label:`Chave ${label}`,glyph:{vermelho:'■',azul:'◆',verde:'●'}[color],role:'collectible',interactionMessage:`Você retirou a chave ${label}!`,failureMessages:{preconditionFailed:'Essa chave não corresponde à fechadura observada.'}}]))},barriers:{passagem:{label:'Porta',propertyLabels:{cor:'Cor'}}},failures:{locked:'A passagem está fechada. Observe a fechadura antes de buscar a chave.'}}
};}
