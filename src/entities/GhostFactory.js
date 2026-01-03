import Ghost from './Ghost.js';
import { ghostColors, ghostNames, ghostStartPositions } from '../config/gameConfig.js';

export class GhostFactory {
    static createGhosts(scene) {
        const ghosts = [];



        ghosts.push(new Ghost(
            scene,
            ghostStartPositions.blinky.x,
            ghostStartPositions.blinky.y,
            ghostNames.BLINKY,
            ghostColors.BLINKY
        ));

        ghosts.push(new Ghost(
            scene,
            ghostStartPositions.pinky.x,
            ghostStartPositions.pinky.y,
            ghostNames.PINKY,
            ghostColors.PINKY
        ));

        ghosts.push(new Ghost(
            scene,
            ghostStartPositions.inky.x,
            ghostStartPositions.inky.y,
            ghostNames.INKY,
            ghostColors.INKY
        ));

        ghosts.push(new Ghost(
            scene,
            ghostStartPositions.clyde.x,
            ghostStartPositions.clyde.y,
            ghostNames.CLYDE,
            ghostColors.CLYDE
        ));

        return ghosts;
    }

    static resetGhosts(ghosts) {
        for (const ghost of ghosts) {
            ghost.reset();
        }
    }

    static setGhostsFrightened(ghosts, duration) {
        for (const ghost of ghosts) {
            if (!ghost.isEaten) {
                ghost.setFrightened(duration);
            }
        }
    }

    static getGhostsByType(ghosts, type) {
        return ghosts.filter(ghost => ghost.type === type);
    }
}
