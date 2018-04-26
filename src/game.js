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
        this.keys = {};
        this.layers = {};
    }
    preload() {

    }
    create() {
        let map = this.make.tilemap({tileWidth: 24, tileHeight: 24, width: 32, height:24});
        
        let tileset = map.addTilesetImage('tiles', 'tiles', 24, 24);
        

        //map.setLayer(0);
        let backgroundLayer = map.createBlankDynamicLayer('background', tileset, 0,0);
        this.layers.background = backgroundLayer;
        map.randomize(0, 0, map.width, map.height, [640, 640, 640, 640, 640, 640, 640, 640, 640, 641]);
        const player = new Player({
            x: 400, y: 300, name: 'wormie'
        });
        this.map = map;
        
        //structureLayer.setCollisionByProperty({collides:true});
        let structureLayer = map.createBlankDynamicLayer('structures', tileset, 0, 0);
        structureLayer.setCollisionBetween(3240, 3250);
        this.impact.world.setCollisionMapFromTilemapLayer(structureLayer, { defaultCollidingSlope: 1 });

        console.log(structureLayer);
        this.layers.structure = structureLayer;
        
        let itemMap = this.make.tilemap({tileWidth: 24, tileHeight: 24, width: 32, height:24});
        
        let itemTileset = itemMap.addTilesetImage('tiles', 'tiles', 24, 24);
        itemMap.setLayer(2);
        let itemLayer = itemMap.createBlankDynamicLayer('items', itemTileset, 0,0);
        
        this.itemMap = itemMap;

        const sprite = this.impact.add.sprite(400, 300, 'wormie', 1);
        sprite.setMaxVelocity(300, 400);
        this.player = player;
        player.sprite = sprite;
        console.log(player,"x");
        sprite.scaleX = 2;
        sprite.scaleY = 2;
    
        /* Add some random items */
        for(let i = 0; i < 4; i++) {

            let item = new Item({name: 'Wood', tile: 3245, x: Phaser.Math.Between(0,24), y: Phaser.Math.Between(0,24)});
            console.log(item);

            let itemTile = new Phaser.Tilemaps.Tile(itemLayer, item.tile, item.x, item.y);
            itemTile.properties = item;

            itemMap.putTileAt(itemTile, item.x, item.y);
        }
        

        const marker = this.add.graphics();
        marker.lineStyle(2, 0x000000, 1);
        marker.strokeRect(0, 0, map.tileWidth * backgroundLayer.scaleX, map.tileHeight * backgroundLayer.scaleY);
        this.marker = marker;

        this.keys.buildKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
        this.keys.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keys.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keys.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keys.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

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

        let moveX = false;
        let moveY = false;
        sprite.setVelocity(0,0);
        if (cursors.left.isDown || this.keys.leftKey.isDown) {
            sprite.setVelocityX(-100);
            //player.x -= 1*player.speed;
            //sprite.x = player.x;
            moveX = true;
        }
        else if (cursors.right.isDown || this.keys.rightKey.isDown) {
            sprite.setVelocityX(100);
            //player.x += 1*player.speed;
            //sprite.x = player.x;
            moveX = true;
        }
        if(cursors.up.isDown || this.keys.upKey.isDown) {
            sprite.setVelocityY(-100);
            //player.y -= 1*player.speed;
            //sprite.y = player.y;
            moveY = true;
        } else if(cursors.down.isDown || this.keys.downKey.isDown) {
            sprite.setVelocityY(100);
            //player.y += 1*player.speed;
            //sprite.y = player.y;
            moveY = true;
        }
        if(this.keys.buildKey.isDown) {
            if(player.inventory.length>0 && !this.layers.structure.getTileAt(pointerTileX, pointerTileY)) {
                let item = player.inventory.shift();
                let itemTile = new Phaser.Tilemaps.Tile(this.itemMap, item.tile, item.x, item.y);
                item.collision = 1;
                itemTile.properties = item;
                this.layers.structure.putTileAt(itemTile, pointerTileX, pointerTileY);
                this.impact.world.setCollisionMapFromTilemapLayer(this.layers.structure, { defaultCollidingSlope: 1 });
            }
        }

        UI.update({player:player});
    }
}