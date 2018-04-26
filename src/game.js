import Phaser from 'phaser';

import {Player} from './entity/player';

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
        let layer = map.createBlankDynamicLayer('ground', tileset, 0,0);
    
        map.randomize(0, 0, map.width, map.height, [640, 640, 640, 640, 640, 640, 640, 640, 640, 641]);
        const player = new Player({
            x: 400, y: 300, name: 'wormie'
        });
        const sprite = this.physics.add.sprite(400, 300, 'wormie');
        //const player = 
        this.player = player;
        player.sprite = sprite;
        console.log(player,"x");
        sprite.scaleX = 2;
        sprite.scaleY = 2;
    
        sprite.body.setGravity(0);
    
        //const sprite = this.add.tileSprite(200, 200, 24, 24, 'tiles', 802);
    }
    update() {
        const cursors = this.input.keyboard.createCursorKeys();
        const player = this.player;
        const sprite = player.sprite;
        let move = false;
        if (cursors.left.isDown) {
            player.x -= 1*player.speed;
            sprite.x = player.x;
            move = true;
        }
        else if (cursors.right.isDown) {
            player.x += 1*player.speed;
            sprite.x = player.x;
            move = true;
        }
        if(cursors.up.isDown) {
            player.y -= 1*player.speed;
            sprite.y = player.y;
            move = true;
        } else if(cursors.down.isDown) {
            player.y += 1*player.speed;
            sprite.y = player.y;
            move = true;
        }
        
        if(!move) {
            sprite.setVelocity(0, 0);
        }
    }
}