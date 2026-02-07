import { FixedTimeStepLoop } from '../../src/systems/FixedTimeStepLoop.js';
import { physicsConfig } from '../../src/config/gameConfig.js';
import { createGameModel } from '../utils/modelTestUtils.js';

describe('GameModel + FixedTimeStepLoop Integration', () => {
    test('Deterministische Tick-Folge führt zu identischem Respawn-Timing', () => {
        const fixedDt = physicsConfig.FIXED_DT;
        const deathPauseDuration = fixedDt * 3;

        const runSimulation = () => {
            const model = createGameModel({ state: { lives: 1, deathPauseDuration } });
            const events = [];

            const loop = new FixedTimeStepLoop(() => {
                events.push(model.step(fixedDt));
            });

            model.beginDeath();
            loop.update(fixedDt * 3);

            return {
                events,
                snapshot: model.getStateSnapshot()
            };
        };

        const simulationA = runSimulation();
        const simulationB = runSimulation();

        expect(simulationA.events).toEqual(simulationB.events);
        expect(simulationA.events).toHaveLength(3);
        expect(simulationA.events[2]).toEqual({ event: 'respawn' });
        expect(simulationA.snapshot.lives).toBe(0);
    });
});
