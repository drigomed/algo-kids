import {initialState} from './engine.js';
import {renderBoard,describeEnvironment,worldIndicators} from './view.js';
import {renderEnergy} from './presentation/energy-view.js';
import {variantName} from './presentation/map-identification.js';
// Uma fotografia do estado inicial. Não recebe sessão/AST nem avança o interpretador.
export function variantPreview(scenarios,index){
 if(!Number.isInteger(index)||index<0||index>=scenarios.length)throw new Error('Prévia: versão inválida');
 const mission=scenarios[index],state={...initialState(mission),status:'ready',events:[]},name=variantName(mission,index);
 return {index,name,width:mission.grid.width,height:mission.grid.height,state,html:renderBoard(mission,state,null,{mood:'idle'}),energy:renderEnergy(state),indicators:worldIndicators(mission,state),label:`Prévia — não é uma execução. ${name}, ${index+1}/${scenarios.length}. Tabuleiro ${mission.grid.width} por ${mission.grid.height}. Robô inicial linha ${state.row+1}, coluna ${state.col+1}, olhando para ${{N:'norte',L:'leste',S:'sul',O:'oeste'}[state.direction]}. Meta linha ${mission.goal.row+1}, coluna ${mission.goal.col+1}. ${describeEnvironment(mission,state)}`};
}
