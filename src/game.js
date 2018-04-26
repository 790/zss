import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameScene'
        });
        this.player = null;
    }
    preload() {

    }
    create() {
        let map = this.make.tilemap({tileWidth: 24, tileHeight: 24, width: 32, height:24});
        let tileset = map.addTilesetImage('tiles', 'tiles', 24, 24);
        map.setLayer(0);
        let layer = map.createBlankDynamicLayer('bgLayer', tileset, 0,0);
    
        map.randomize(0, 0, map.width, map.height, [640, 640, 640, 640, 640, 640, 640, 640, 640, 641]);
        
        const player = this.physics.add.sprite(400, 300, 'wormie');
        this.player = player;
        console.log(player,"x");
        player.smoothed = false;
        player.scaleX = 2;
        player.scaleY = 2;
    
        player.body.setGravity(0);
    
        const sprite = this.add.tileSprite(200, 200, 24, 24, 'tiles', 802);
    }
    update() {
        const cursors = this.input.keyboard.createCursorKeys();
        const player = this.player;
        let move = false;
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
            move = true;
        }
        else if (cursors.right.isDown) {
            player.setVelocityX(160);
            move = true;
        }
        if(cursors.up.isDown) {
            player.setVelocityY(-160);
            move = true;
        } else if(cursors.down.isDown) {
            player.setVelocityY(160);
            move = true;
        }
        
        if(!move) {
            player.setVelocity(0, 0);
        }
    }
}