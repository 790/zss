import Phaser from 'phaser';

import {Player} from './entity/player';
import UI from './ui';
import { Item, ItemResolver } from './entity/item';
import { LivingEntity } from './entity/entity';

export default class GameScene extends Phaser.Scene {
    constructor(e) {
        super({
            key: 'GameScene',
            physics: {
                impact: {},
                arcade: {}
            }
        });
        this.player = null;
        this.map = null;
        this.keys = {};
        this.layers = {};

        this.entities = [];
        this.entityUpdateTimer = null;

        this.projectiles = [];
    }
    preload() {

    }
    create() {
        this.physics.world.setBounds();
        this.impact.world.setBounds();

        let map = this.make.tilemap({tileWidth: 24, tileHeight: 24, width: 32, height:24});
        
        let tileset = map.addTilesetImage('tiles', 'tiles', 24, 24);
        
        map.setLayer(0);
        let backgroundLayer = map.createBlankDynamicLayer('background', tileset, 0,0);
        this.layers.background = backgroundLayer;
        
        map.randomize(0, 0, map.width, map.height, [640, 640, 640, 640, 640, 640, 640, 640, 640, 641]);
        const player = new Player({
            x: 400, y: 300, name: 'wormie'
        });
        this.map = map;
        
        let structureLayer = map.createBlankDynamicLayer('structures', tileset, 0, 0);
        structureLayer.setCollisionByProperty({collision:true});
        structureLayer.setCollisionBetween(640, 3250);
        structureLayer.fill(644, 0,0,map.width, map.height);
        structureLayer.fill(null, 1, 1, map.width-2, map.height-2);
        this.impact.world.setCollisionMapFromTilemapLayer(structureLayer, { defaultCollidingSlope: 1 });
        console.log(structureLayer);
        this.layers.structure = structureLayer;
        
        let itemMap = this.make.tilemap({tileWidth: 24, tileHeight: 24, width: 32, height:24});
        
        let itemTileset = itemMap.addTilesetImage('tiles', 'tiles', 24, 24);
        itemMap.setLayer(2);
        let itemLayer = itemMap.createBlankDynamicLayer('items', itemTileset, 0,0);
        
        this.itemMap = itemMap;

        const sprite = this.impact.add.sprite(400, 300, 'wormie');
        sprite.setActive().setMaxVelocity(300, 300).setActiveCollision(true);
        
        
        this.player = player;
        player.sprite = sprite;
        console.log(player,"x");
        sprite.scaleX = 2;
        sprite.scaleY = 2;
        sprite.setBodyScale(2, 2);
        this.cameras.main.setSize(800, 600);
        this.cameras.main.startFollow(sprite);
        this.entityGroup = this.physics.add.group();

        /* Add some random items */
        for(let i = 0; i < 24; i++) {

            let item = new Item({name: 'Wood', id: 'wood_plate', x: Phaser.Math.Between(1,22), y: Phaser.Math.Between(1,22)});
            console.log(item);

            let itemTile = new Phaser.Tilemaps.Tile(itemLayer, item.tile, item.x, item.y);
            itemTile.properties = item;

            itemMap.putTileAt(itemTile, item.x, item.y);
        }
        
        /* Add some random enemies */
        for(let i = 0; i < 1; i++) {
            let enemy = new LivingEntity({
                x: 100, y:100, name: 'enemy', tile: ItemResolver('mon_zombie_2').fg
            });
            let enemySprite = this.physics.add.sprite(enemy.x, enemy.y, 'tiles', enemy.tile);
            enemySprite.enableBody(true, 100, 100)
            enemySprite.setActive(true).setMaxVelocity(100, 100);//.setActiveCollision(true);
            enemySprite.setCollideWorldBounds(true);
            this.physics.add.collider(enemySprite, this.layers.structure);
            console.log(enemySprite);
            enemy.sprite = enemySprite;
            enemySprite.properties = enemy;
            this.entities.push(enemy);
            this.entityGroup.add(enemy.sprite);
        }
        const marker = this.add.graphics();
        marker.lineStyle(2, 0x000000, 1);
        marker.strokeRect(0, 0, map.tileWidth * backgroundLayer.scaleX, map.tileHeight * backgroundLayer.scaleY);
        this.marker = marker;

        this.ghostBuilding = null;

        this.keys.buildKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
        this.keys.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keys.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keys.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keys.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keys.toggleInventory = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keys.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.keys.escapeKey = [
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
        ];
        this.keys.rotateKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        UI.create({game: this});
    
        let projectiles = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 50,
            collideWorldBounds: true,
            enabledBody: true,
            physicsBodyType: Phaser.Physics.ARCADE,

        });

        this.projectiles = projectiles;
        this.entityUpdateTimer = this.time.addEvent({ delay: 1000, callback: this.updateEntities, callbackScope: this, loop: true });
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
        marker.x = map.tileToWorldX(pointerTileX);
        marker.y = map.tileToWorldY(pointerTileY);

        const proximity = Phaser.Math.Distance.Between(marker.x, marker.y, player.sprite.x, player.sprite.y) < 60;

        if((map.getTileAt(pointerTileX, pointerTileY) && proximity) || this.building) {
            marker.visible = true;
        } else {
            marker.visible = false;
        }
        if(this.building) {
            this.ghostBuilding.x = marker.x;
            this.ghostBuilding.y = marker.y;
            if(this.player.inventory.length>0) {
                this.marker.lineStyle(2, 0x000000, 1);
                this.marker.strokeRect(0, 0, map.tileWidth * this.layers.background.scaleX, map.tileHeight * this.layers.background.scaleY);
            }
            else {
                this.marker.lineStyle(2, 0x770000, 1);
                this.marker.strokeRect(0, 0, map.tileWidth * this.layers.background.scaleX, map.tileHeight * this.layers.background.scaleY);
            }
        }
        if (this.input.manager.activePointer.isDown && proximity) {
            let item = map.getTileAt(pointerTileX, pointerTileY);
            if(item && player.inventory.canAddToInventory(item)) {
                player.inventory.push(item.properties);
                map.removeTileAt(pointerTileX, pointerTileY);
            } else if(!item && this.building) {
                this.buildItem(this.building, pointerTileX, pointerTileY);
            }
        }

        sprite.setVelocity(0,0);
        if (cursors.left.isDown || this.keys.leftKey.isDown) {
            sprite.setVelocityX(-100);
        }
        else if (cursors.right.isDown || this.keys.rightKey.isDown) {
            sprite.setVelocityX(100);
        }
        if(cursors.up.isDown || this.keys.upKey.isDown) {
            sprite.setVelocityY(-100);
        } else if(cursors.down.isDown || this.keys.downKey.isDown) {
            sprite.setVelocityY(100);
        }
        if(Phaser.Input.Keyboard.JustDown(this.keys.buildKey)) {
            if(!this.building) {
                this.startBuilding();
            } else {
                this.stopBuilding();
            }
            //this.buildItem('t_wall_log', pointerTileX, pointerTileY);
        }
        this.keys.escapeKey.forEach(ek => {
            if(Phaser.Input.Keyboard.JustDown(ek)) {
                this.stopBuilding();
            }
        });
        if(Phaser.Input.Keyboard.JustDown(this.keys.toggleInventory)) {
            UI.setState({
                inventoryOpen: !UI.uiState.inventoryOpen
            })
        }
        if(Phaser.Input.Keyboard.JustDown(this.keys.rotateKey)) {
            let t = this.layers.structure.getTileAt(pointerTileX, pointerTileY);
            
            if(t.index) {
                let r = Phaser.Math.RadToDeg(t.rotation);
                r += 90;
                if(r>=360) {
                    r=0;
                }
                t.rotation = Phaser.Math.DegToRad(r);
            }
        }
        if(Phaser.Input.Keyboard.JustDown(this.keys.fireKey)) {
            let projectile = this.projectiles.get(player.sprite.x, player.sprite.y, 'tiles', ItemResolver('animation_bullet_normal').fg); //this.physics.add.image(player.sprite.x-8, player.sprite.y-8, 'tiles', ItemResolver('bullet_crossbow').fg);
            
            if(projectile) {
                projectile.enableBody(true,player.sprite.x, player.sprite.y).setActive(true).setVisible(true);
                projectile.setCollideWorldBounds(true);
                projectile.setCircle(4, 10, 10);
                this.physics.add.collider(projectile, this.entityGroup, (a,b) => {
                    console.log("collision entity", a,b);
                    if(b.properties.hp <= 0) {
                        this.entities.splice(this.entities.indexOf(b.properties), 1);
                        b.destroy();
                    } else {
                        b.properties.hp -= 20;
                    }
                    a.destroy();
                });
                this.physics.add.collider(projectile, this.layers.structure, (a,b) => {
                    console.log("collision struct", a,b);
                    a.destroy();
                });
                this.physics.moveTo(projectile, this.input.x + this.cameras.main.scrollX, this.input.y + this.cameras.main.scrollY, 500);
            }
        }
        UI.update({player:player});
    }
    buildItem(item_id, x, y) {
        const player = this.player;
        if(player.inventory.length>0) {
            let t = this.layers.structure.getTileAt(x, y);
            let adjacent = this.layers.structure.getTilesWithin(x-1, y-1, 3, 3, {isNotEmpty: true,isColliding:true}).filter(t => t.x == x || t.y == y);
            if(!t || !t.canCollide) {
                let item = player.inventory.remove('wood_plate', 1);
                if(item) {
                    item.tile = ItemResolver(item_id).fg;
                    if(adjacent.length === 3) {
                        item.tile = 2248;
                    }
                    if(adjacent.length === 2 && ((adjacent[0].x === adjacent[1].x) || (adjacent[0].y === adjacent[1].y))) {
                        // middle
                        item.tile = 2242; // ItemResolver(item_id).additional_tiles
                        if(adjacent[0].y === adjacent[1].y) {
                            item.rotation = Phaser.Math.DegToRad(90);
                        }
                    } else if(adjacent.length === 2) {

                        // corner
                        item.tile = 2246; // ItemResolver(item_id).additional_tiles
                    } else if(adjacent.length === 1) {
                        // end
                        
                    }
                    let itemTile = new Phaser.Tilemaps.Tile(this.itemMap, item.tile, item.x, item.y);
                    itemTile.angle = item.angle||0;
                    itemTile.properties = item;
                    this.layers.structure.putTileAt(itemTile, x, y);
                    this.impact.world.setCollisionMapFromTilemapLayer(this.layers.structure, { defaultCollidingSlope: 1 });
                }
            }
        }
    }
    startBuilding() {
        this.building = 't_wall_log';
        this.ghostBuilding = this.add.image(this.marker.x, this.marker.y, 'tiles', ItemResolver(this.building).fg);
        this.ghostBuilding.setOrigin(0, 0);
        this.ghostBuilding.setAlpha(0.4);
        this.ghostBuilding.x = this.marker.x;
        this.ghostBuilding.y = this.marker.y;
        UI.setState({
            building: true
        })
    }
    stopBuilding() {
        if(this.ghostBuilding) {
            this.ghostBuilding.destroy();
            this.ghostBuilding = null;
        }
        this.marker.lineStyle(2, 0x000000, 1);
        this.marker.strokeRect(0, 0, this.itemMap.tileWidth * this.layers.background.scaleX, this.itemMap.tileHeight * this.layers.background.scaleY);
        this.building = false; 
        UI.setState({
            building: false
        })
    }
    updateEntities(time, delta) {
        this.entities.forEach(e => e.update(time, delta));
    }
}