import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({
          key: 'BootScene'
        });
    }
    preload() {
        this.load.image('wormie', 'assets/images/wormie.png');
        this.load.spritesheet('tiles', 'assets/ChestHoleTileset/tiles.png', {frameWidth:24,frameHeight: 24});
    }
    create() {
        this.scene.start('GameScene');
    }
}