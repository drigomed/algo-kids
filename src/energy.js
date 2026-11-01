import {record,assertJsonData} from './data.js';
export const ENERGY_ACTIONS=['move','turnLeft','turnRight','interact','inspect','setMemory'];
export const defaultEnergy=()=>({initial:10,costs:{move:2,turnLeft:1,turnRight:1,interact:1,inspect:0,setMemory:0}});
export const energyMessage='A bateria acabou! Tente um caminho que gaste menos energia.';
export function validateEnergy(energy){
 if(energy===undefined)return;assertJsonData(energy,'energy');
 if(!record(energy)||Object.keys(energy).length!==2||!Object.hasOwn(energy,'initial')||!Object.hasOwn(energy,'costs')||!Number.isSafeInteger(energy.initial)||energy.initial<1||energy.initial>10000)throw new Error('energy: bateria inicial deve ser inteiro de 1 a 10000, com initial e costs');
 if(!record(energy.costs)||Object.keys(energy.costs).length!==ENERGY_ACTIONS.length||ENERGY_ACTIONS.some(key=>!Object.hasOwn(energy.costs,key)||!Number.isSafeInteger(energy.costs[key])||energy.costs[key]<0||energy.costs[key]>100))throw new Error('energy.costs: declare exatamente seis custos inteiros de 0 a 100');
}
