import {
    additionalPowerUpConfig,
    aiWeights,
    ai_weights,
    bossConfig,
    enemyColors,
    gameConfig,
    ghostColors,
    ghostModes,
    powerPacketPositions,
    enemyProfiles,
    powerPelletPositions,
    scoreValues,
    storyConfig,
    virusModes
} from '../../src/config/gameConfig.js';

describe('gameConfig', () => {
    describe('score values', () => {
        it('should have correct pellet score', () => {
            expect(scoreValues.pellet).toBe(15);
        });

        it('should have correct power pellet score', () => {
            expect(scoreValues.powerPellet).toBe(75);
        });

        it('should have correct ghost combo scores', () => {
            expect(scoreValues.ghost).toEqual([250, 500, 1000, 2000]);
        });

        it('should have correct boss defeat bonus', () => {
            expect(scoreValues.bossDefeat).toBe(5000);
        });

        it('should have fruit score values', () => {
            expect(scoreValues.fruit).toBeDefined();
            expect(Array.isArray(scoreValues.fruit)).toBe(true);
        });
    });

    describe('additionalPowerUpConfig', () => {
        it('should have shield configuration', () => {
            expect(additionalPowerUpConfig.types.SHIELD).toBeDefined();
            expect(additionalPowerUpConfig.types.SHIELD.duration).toBe(8);
            expect(additionalPowerUpConfig.types.SHIELD.spawnChance).toBe(0.15);
        });

        it('should have speed boost configuration', () => {
            expect(additionalPowerUpConfig.types.SPEED_BOOST).toBeDefined();
            expect(additionalPowerUpConfig.types.SPEED_BOOST.duration).toBe(5);
            expect(additionalPowerUpConfig.types.SPEED_BOOST.spawnChance).toBe(0.2);
        });

        it('should have data magnet configuration', () => {
            expect(additionalPowerUpConfig.types.DATA_MAGNET).toBeDefined();
            expect(additionalPowerUpConfig.types.DATA_MAGNET.duration).toBe(10);
            expect(additionalPowerUpConfig.types.DATA_MAGNET.spawnChance).toBe(0.1);
        });

        it('should have despawn time', () => {
            expect(additionalPowerUpConfig.despawnTime).toBe(15);
        });

        it('should have max on screen', () => {
            expect(additionalPowerUpConfig.maxOnScreen).toBe(3);
        });

        it('should have spawn radius', () => {
            expect(additionalPowerUpConfig.spawnRadius).toBe(3);
        });
    });

    describe('bossConfig', () => {
        it('should have correct spawn levels', () => {
            expect(bossConfig.spawnLevels).toEqual([5, 10, 15, 20]);
        });

        it('should have alpha boss configuration', () => {
            expect(bossConfig.bossTypes.alpha).toBeDefined();
            expect(bossConfig.bossTypes.alpha.health).toBe(3);
            expect(bossConfig.bossTypes.alpha.scoreBonus).toBe(5000);
            expect(bossConfig.bossTypes.alpha.phases).toBe(2);
        });

        it('should have beta boss configuration', () => {
            expect(bossConfig.bossTypes.beta).toBeDefined();
            expect(bossConfig.bossTypes.beta.health).toBe(4);
            expect(bossConfig.bossTypes.beta.scoreBonus).toBe(10000);
            expect(bossConfig.bossTypes.beta.phases).toBe(3);
        });

        it('should have gamma boss configuration', () => {
            expect(bossConfig.bossTypes.gamma).toBeDefined();
            expect(bossConfig.bossTypes.gamma.health).toBe(2);
            expect(bossConfig.bossTypes.gamma.scoreBonus).toBe(7500);
            expect(bossConfig.bossTypes.gamma.phases).toBe(2);
        });

        it('should have delta boss configuration', () => {
            expect(bossConfig.bossTypes.delta).toBeDefined();
            expect(bossConfig.bossTypes.delta.health).toBe(5);
            expect(bossConfig.bossTypes.delta.scoreBonus).toBe(15000);
            expect(bossConfig.bossTypes.delta.phases).toBe(2);
        });

        it('should have phase transition health', () => {
            expect(bossConfig.phaseTransitionHealth).toBeDefined();
            expect(Array.isArray(bossConfig.phaseTransitionHealth)).toBe(true);
        });
    });

    describe('storyConfig', () => {
        it('should have enabled flag', () => {
            expect(storyConfig.enabled).toBe(true);
        });

        it('should have chapters array', () => {
            expect(storyConfig.chapters).toBeDefined();
            expect(Array.isArray(storyConfig.chapters)).toBe(true);
        });

        it('should have network entry chapter', () => {
            const networkEntry = storyConfig.chapters[0];
            expect(networkEntry.level).toBe(1);
            expect(networkEntry.name).toBe('Network Entry');
            expect(networkEntry.bossBattle).toBe(false);
        });

        it('should have alpha breach chapter', () => {
            const alphaBreach = storyConfig.chapters[1];
            expect(alphaBreach.level).toBe(5);
            expect(alphaBreach.name).toBe('Alpha Breach');
            expect(alphaBreach.bossBattle).toBe(true);
            expect(alphaBreach.bossType).toBe('alpha');
        });

        it('should have beta ambush chapter', () => {
            const betaAmbush = storyConfig.chapters[2];
            expect(betaAmbush.level).toBe(10);
            expect(betaAmbush.name).toBe('Beta Ambush');
            expect(betaAmbush.bossBattle).toBe(true);
            expect(betaAmbush.bossType).toBe('beta');
        });

        it('should have gamma glitch chapter', () => {
            const gammaGlitch = storyConfig.chapters[3];
            expect(gammaGlitch.level).toBe(15);
            expect(gammaGlitch.name).toBe('Gamma Glitch');
            expect(gammaGlitch.bossBattle).toBe(true);
            expect(gammaGlitch.bossType).toBe('gamma');
        });

        it('should have delta core chapter', () => {
            const deltaCore = storyConfig.chapters[4];
            expect(deltaCore.level).toBe(20);
            expect(deltaCore.name).toBe('Delta Core');
            expect(deltaCore.bossBattle).toBe(true);
            expect(deltaCore.bossType).toBe('delta');
        });

        it('should have story mode levels', () => {
            expect(storyConfig.storyModeLevels).toBeDefined();
            expect(storyConfig.storyModeLevels).toEqual([1, 5, 10, 15, 20]);
        });

        it('should have chapter complete bonus', () => {
            expect(storyConfig.chapterCompleteBonus).toBe(5000);
        });
    });


    describe('enemy AI balancing configuration', () => {
        it('should expose aiWeights and ai_weights alias', () => {
            expect(aiWeights).toBeDefined();
            expect(ai_weights).toBe(aiWeights);
            expect(aiWeights.targetDistance).toBeGreaterThan(0);
        });

        it('should expose per-enemy profiles for tuning', () => {
            expect(enemyProfiles.alpha).toBeDefined();
            expect(enemyProfiles.beta).toBeDefined();
            expect(enemyProfiles.gamma).toBeDefined();
            expect(enemyProfiles.delta).toBeDefined();
            expect(enemyProfiles.default).toBeDefined();
        });
    });

    describe('virus modes', () => {
        it('should have PATROL mode', () => {
            expect(virusModes.PATROL).toBe('PATROL');
        });

        it('should have HUNT mode', () => {
            expect(virusModes.HUNT).toBe('HUNT');
        });

        it('should have DECRYPTED mode', () => {
            expect(virusModes.DECRYPTED).toBe('DECRYPTED');
        });

        it('should have ELIMINATED mode', () => {
            expect(virusModes.ELIMINATED).toBe('ELIMINATED');
        });
    });

    describe('ghost modes backward compatibility', () => {
        it('should alias SCATTER to PATROL', () => {
            expect(ghostModes.SCATTER).toBe(virusModes.PATROL);
        });

        it('should alias CHASE to HUNT', () => {
            expect(ghostModes.CHASE).toBe(virusModes.HUNT);
        });

        it('should alias FRIGHTENED to DECRYPTED', () => {
            expect(ghostModes.FRIGHTENED).toBe(virusModes.DECRYPTED);
        });

        it('should alias EATEN to ELIMINATED', () => {
            expect(ghostModes.EATEN).toBe(virusModes.ELIMINATED);
        });
    });

    describe('power packet positions alias', () => {
        it('should alias powerPelletPositions to powerPacketPositions', () => {
            expect(powerPacketPositions).toEqual(powerPelletPositions);
        });

        it('should have power packet positions', () => {
            expect(powerPacketPositions).toBeDefined();
            expect(Array.isArray(powerPacketPositions)).toBe(true);
        });

        it('should have correct number of power packets', () => {
            expect(powerPelletPositions.length).toBe(4);
        });
    });

    describe('ghost colors backward compatibility', () => {
        it('should have ghostColors defined', () => {
            expect(ghostColors).toBeDefined();
        });

        it('should have alpha ghost color', () => {
            expect(ghostColors.alpha).toBe(0x9b59b6);
        });

        it('should have beta ghost color', () => {
            expect(ghostColors.beta).toBe(0x7fff00);
        });

        it('should have gamma ghost color', () => {
            expect(ghostColors.gamma).toBe(0xff4444);
        });

        it('should have delta ghost color', () => {
            expect(ghostColors.delta).toBe(0xffa500);
        });
    });

    describe('enemy colors', () => {
        it('should have enemyColors defined', () => {
            expect(enemyColors).toBeDefined();
        });

        it('should have ALPHA enemy color', () => {
            expect(enemyColors.ALPHA).toBe(0x9b59b6);
        });

        it('should have BETA enemy color', () => {
            expect(enemyColors.BETA).toBe(0x7fff00);
        });

        it('should have GAMMA enemy color', () => {
            expect(enemyColors.GAMMA).toBe(0xff4444);
        });

        it('should have DELTA enemy color', () => {
            expect(enemyColors.DELTA).toBe(0xffa500);
        });
    });

    describe('gameConfig basic values', () => {
        it('should have game width', () => {
            expect(gameConfig.width).toBe(500);
        });

        it('should have game height', () => {
            expect(gameConfig.height).toBe(660);
        });

        it('should have tile size', () => {
            expect(gameConfig.tileSize).toBe(20);
        });

        it('should have target FPS', () => {
            expect(gameConfig.targetFPS).toBe(60);
        });
    });

    describe('Phase 5 configuration consistency', () => {
        it('should have consistent boss spawn levels across configs', () => {
            const bossLevels = bossConfig.spawnLevels;
            const storyLevels = storyConfig.storyModeLevels;

            bossLevels.forEach((level) => {
                expect(storyLevels).toContain(level);
            });
        });

        it('should have valid boss phase transitions', () => {
            const alphaPhases = bossConfig.bossTypes.alpha.phaseTransitionHealth;
            const betaPhases = bossConfig.bossTypes.beta.phaseTransitionHealth;

            expect(alphaPhases).toEqual([0.5]);
            expect(betaPhases).toEqual([0.5, 0.25]);
        });

        it('should have valid power-up durations', () => {
            expect(additionalPowerUpConfig.types.SHIELD.duration).toBeGreaterThan(0);
            expect(
                additionalPowerUpConfig.types.SPEED_BOOST.duration
            ).toBeGreaterThan(0);
            expect(
                additionalPowerUpConfig.types.DATA_MAGNET.duration
            ).toBeGreaterThan(0);
        });

        it('should have valid power-up spawn chances', () => {
            const shieldChance = additionalPowerUpConfig.types.SHIELD.spawnChance;
            const speedChance = additionalPowerUpConfig.types.SPEED_BOOST.spawnChance;
            const magnetChance =
				additionalPowerUpConfig.types.DATA_MAGNET.spawnChance;

            expect(shieldChance).toBeGreaterThan(0);
            expect(shieldChance).toBeLessThan(1);
            expect(speedChance).toBeGreaterThan(0);
            expect(speedChance).toBeLessThan(1);
            expect(magnetChance).toBeGreaterThan(0);
            expect(magnetChance).toBeLessThan(1);
        });
    });
});
