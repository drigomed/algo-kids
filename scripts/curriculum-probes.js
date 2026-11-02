// Contraprovas limitadas: lineariza somente os ramos da referência.
// Não enumera todas as soluções, não prova unicidade e não otimiza energia.
export function linearPrograms(list){
 let result=[[]];
 for(const n of list){let options;
 if(n.type==='if')options=[...linearPrograms(n.then),...linearPrograms(n.else)];
 else if(n.type==='switch')options=[...n.cases.flatMap(c=>linearPrograms(c.body)),...linearPrograms(n.default)];
 else if(['for','while'].includes(n.type))options=(n.times?[n.times]:[0,1,2,3,4]).flatMap(times=>linearPrograms(n.body).map(body=>Array.from({length:times},()=>body).flat()));
 else options=[[n]];
 result=result.flatMap(a=>options.map(b=>[...a,...b])).slice(0,256);
 }
 return [...new Map(result.map(p=>[JSON.stringify(p),p])).values()];
}
export function omitCommand(list,type){return list.filter(n=>n.type!==type).map(n=>({...n,...(n.then?{then:omitCommand(n.then,type),else:omitCommand(n.else,type)}:{}),...(n.body?{body:omitCommand(n.body,type)}:{}),...(n.cases?{cases:n.cases.map(c=>({...c,body:omitCommand(c.body,type)})),default:omitCommand(n.default,type)}:{})}));}
