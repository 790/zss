import Phaser from 'phaser';

import {Player} from './entity/player';
import UI from './ui';
import { Item } from './entity/entity';

export default class GameScene extends Phaser.Scene {
    constructor(e) {
        super({
            key: 'GameScene'
        });
        this.player = null;
        this.map = null;
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
        this.map = map;

        let itemMap = this.make.tilemap({tileWidth: 24, tileHeight: 24, width: 32, height:24});
        
        let itemTileset = itemMap.addTilesetImage('tiles', 'tiles', 24, 24);
        itemMap.setLayer(1);
        let itemLayer = itemMap.createBlankDynamicLayer('items', itemTileset, 0,0);
    
        this.itemMap = itemMap;

        const sprite = this.physics.add.sprite(400, 300, 'wormie');
        //const player = 
        this.player = player;
        player.sprite = sprite;
        console.log(player,"x");
        sprite.scaleX = 2;
        sprite.scaleY = 2;
    
        sprite.body.setGravity(0);
        
        for(let i = 0; i < 4; i++) {

            let item = new Item({name: 'Wood', tile: 3245, x: Phaser.Math.Between(0,24), y: Phaser.Math.Between(0,24)});
            console.log(item);

            let itemTile = new Phaser.Tilemaps.Tile(itemLayer, item.tile, item.x, item.y);
            itemTile.properties = item;

            itemMap.putTileAt(itemTile, item.x, item.y);
        }
        
        const marker = this.add.graphics();
        marker.lineStyle(2, 0x000000, 1);
        marker.strokeRect(0, 0, map.tileWidth * layer.scaleX, map.tileHeight * layer.scaleY);
        this.marker = marker;

        UI.create({game: this});

    }
    update(time, delta) {
        const cursors = this.input.keyboard.createCursorKeys();
        const player = this.player;
        const sprite = player.sprite;

        const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
        const map = this.itemMap;
        const pointerTileX = map.worldToTileX(worldPoint.x);
        const pointerTileY = map.worldToTileY(worldPoint.y);
        
        const marker = this.marker;
        if(map.getTileAt(pointerTileX, pointerTileY)) {
            marker.visible = true;
        } else {
            marker.visible = false;
        }
        marker.x = map.tileToWorldX(pointerTileX);
        marker.y = map.tileToWorldY(pointerTileY);
        
        if (this.input.manager.activePointer.isDown) {
            let item = map.getTileAt(pointerTileX, pointerTileY);
            if(item) {
                player.inventory.push(item.properties);
                map.removeTileAt(pointerTileX, pointerTileY);
            }
        }

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

        UI.update({player:player});
    }
}