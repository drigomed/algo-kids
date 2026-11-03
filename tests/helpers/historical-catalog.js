// Frozen V093 curriculum: historical tests cover the old content contracts.
// V094 curriculum and migration are exercised separately in v094.test.js.
import {readFileSync} from 'node:fs';
export const missions=JSON.parse(readFileSync(new URL('../fixtures/v093-catalog.json',import.meta.url)));
export {missionVariants} from '../../src/missions.js';
