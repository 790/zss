import Phaser from 'phaser';

import BootScene from './boot';
import GameScene from './game';

const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    physics: {
        impact: {
        },
        arcade: {
        
        }
    },
    pixelArt: true,
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);