import {gameController as controller} from './controllers.js';
import {missions} from './historical-catalog.js';
export {studioController,memoryStorage} from './controllers.js';
export const gameController=(options={})=>controller({...options,catalog:missions});
