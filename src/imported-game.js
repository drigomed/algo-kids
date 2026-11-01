import {parseMission} from './mission-io.js';
import {createSession} from './session.js';
export function loadImportedGame(text,previous){const mission=parseMission(text);return {mission,program:[],target:[],session:createSession(mission,[]),previous};}
