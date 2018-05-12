import Phaser from 'phaser';

import {Player} from './entity/player';
import UI from './ui';
import { Item, ItemResolver } from './entity/item';
import { LivingEntity } from './entity/entity';

import Network from './network';

import ACTIONS from '../src/actions.json';

import {FurnitureData, TerrainData} from './tiles';

const TILE_WIDTH = 24;
const TILE_HEIGHT = 24;

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

        /* Network clients */
        this.clients = {};
        this.clientMap = {};
    }
    preload() {

    }
    create() {
        Network.start().then(_ => {
            console.log("connected2");
            Network.socket.on('clientList', (data) => {
                console.log("Client list", data);
                data.forEach(client => {
                    if(!client.me) {
                        this.clients[client.id] = client;
                        let sprite = this.physics.add.sprite(client.x, client.y, 'tiles', ItemResolver('mon_bandit_looter').fg);
                        sprite.setActive().setMaxVelocity(300,300);
                        sprite.setPosition(client.x, client.y);
                        this.clientMap[client.id] = sprite;
                    } else {
                        
                        this.player.id = client.id;
                        this.player.sprite.destroy();

                        //this.player.sprite.x = client.x;//setPosition(client.x, client.y);
                        //this.player.sprite.y = client.y;
                        this.player.x = client.x;
                        this.player.y = client.y;
                        const sprite = this.impact.add.sprite(this.player.x, this.player.y, 'wormie');
                        sprite.setActive().setMaxVelocity(300, 300).setActiveCollision(true);
                        this.player.sprite = sprite;
                        sprite.scaleX = 2;
                        sprite.scaleY = 2;
                        sprite.setBodyScale(2, 2);
                        this.cameras.main.startFollow(sprite);
                    }
                })
            }).on('clientConnected', (client) => {
                console.log(client);
                if(!this.clients[client.id]) {
                    this.clients[client.id] = client;
                    let sprite = this.physics.add.sprite(client.x, client.y, 'tiles', ItemResolver('mon_bandit_looter').fg);
                    sprite.setActive().setMaxVelocity(300,300);
                    sprite.setPosition(client.x, client.y);
                    this.clientMap[client.id] = sprite;
                }
            }).on('clientDisconnected', (client) => {
                console.log(client.id, this.clientMap);
                if(this.clientMap[client.id]) {
                    this.clientMap[client.id].destroy();
                    delete this.clientMap[client.id];
                    delete this.clients[client.id];
                }
            }).on(ACTIONS.ACTION_MOVE, data => {
                if(data && data.player.id && this.clientMap[data.player.id]) {
                    let player = this.clientMap[data.player.id];
                    player.setPosition(data.player.x, data.player.y);
                }
            }).on('setTile', data => {
                console.log("net set tile", data);
                let item = data.item;
                if(!this.layers[data.layer]) {
                    return;
                }
                if(item.id === -1) {
                    this.layers[data.layer].removeTileAt(data.x, data.y);
                    this.collisionMap[data.y][data.x] = 0;
                } else {
                    item.tile = ItemResolver(item.id).fg;
                }
                let itemTile = new Phaser.Tilemaps.Tile(this.layers[data.layer], item.tile, data.x, data.y);
                itemTile.angle = item.angle||0;
                itemTile.properties = item;
                
                if(data.layer === 'structure') {
                    if(TerrainData[item.id]) {
                        this.collisionMap[data.y][data.x] = (TerrainData[item.id].move_cost === 0) ? 1:0;
                        itemTile.properties = TerrainData[item.id];
                    }
                    if(FurnitureData[item.id]) {
                        this.collisionMap[data.y][data.x] = (FurnitureData[item.id].move_cost_mod === -1) ? 1:0
                        itemTile.properties = FurnitureData[item.id];
                    }
                }
                this.layers[data.layer].putTileAt(itemTile, data.x, data.y);
            }).on('map', data => {
                let map = data.map;
                this.setMap(data.id, map.width, map.height, map);
            }).on('inventory', data => {
                if(data.type === 'push') {
                    console.log(data);
                    player.inventory.push(data.item);
                } else if(data.type === 'set') {
                    player.inventory.from(data.inventory);
                }
                
            }).on('projectile', data => {
                this.fireProjectile(data);
            }).on('action_error', data => { /* Sent by server when we failed to do something */
                console.log("[ACTION ERROR]", data);
            });
        });
        this.setupMap();

        this.physics.world.setBounds(0,0,this.layers.background.width, this.layers.background.height );
        this.impact.world.setBounds(0,0,this.layers.background.width, this.layers.background.height);

        const player = new Player({
            x: 400, y: 300, name: 'wormie'
        });
        const sprite = this.impact.add.sprite(400, 300, 'wormie');
        sprite.setActive().setMaxVelocity(300, 300).setActiveCollision(true);
        
        
        this.player = player;
        player.sprite = sprite;
        console.log(player,"x");
        sprite.scaleX = 2;
        sprite.scaleY = 2;
        sprite.setBodyScale(2, 2);
        this.cameras.main.setSize(800, 600);
        console.log(this.layers.background);
        this.cameras.main.setBounds(0,0, this.layers.background.width, this.layers.background.height)
        this.cameras.main.startFollow(sprite);
        this.entityGroup = this.physics.add.group();
        
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
        marker.strokeRect(0, 0, TILE_WIDTH * this.layers.background.scaleX, TILE_HEIGHT * this.layers.background.scaleY);
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
        UI.actionEmitter.on('build', this.onBuild);
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
        const map = this.layers.item;
        const pointerTileX = map.worldToTileX(worldPoint.x);
        const pointerTileY = map.worldToTileY(worldPoint.y);
        
        const marker = this.marker;
        marker.x = map.tileToWorldX(pointerTileX);
        marker.y = map.tileToWorldY(pointerTileY);

        const proximity = Phaser.Math.Distance.Between(marker.x, marker.y, player.sprite.x, player.sprite.y) < 60;
        
        let moved = false;

        if((map.getTileAt(pointerTileX, pointerTileY) && proximity) || this.building) {
            marker.visible = true;
        } else {
            marker.visible = false;
        }
        if(this.building) {
            this.ghostBuilding.x = marker.x + this.ghostBuilding.width / 2;
            this.ghostBuilding.y = marker.y + this.ghostBuilding.height / 2;
            if(this.player.inventory.length>0) {
                this.marker.clear();
                this.marker.lineStyle(2, 0x000000, 1);
                this.marker.strokeRect(0, 0, map.tileWidth * this.layers.background.scaleX, map.tileHeight * this.layers.background.scaleY);
            }
            else {
                this.marker.clear();
                this.marker.lineStyle(2, 0x770000, 1);
                this.marker.strokeRect(0, 0, map.tileWidth * this.layers.background.scaleX, map.tileHeight * this.layers.background.scaleY);
            }
        }
        if (this.input.manager.activePointer.justDown && proximity) {
            let item = map.getTileAt(pointerTileX, pointerTileY);
            if(item && player.inventory.canAddToInventory(item)) {
                /*player.inventory.push(item.properties);
                map.removeTileAt(pointerTileX, pointerTileY);*/
                Network.send('pickup', {x: pointerTileX, y: pointerTileY});

            } else if(!item && this.building) {
                this.buildItem(this.building, pointerTileX, pointerTileY);
            }
            let tile = this.layers.structure.getTileAt(pointerTileX, pointerTileY);
            if(tile) {
                if(tile.properties.open) {
                    Network.send(ACTIONS.ACTION_OPEN, {x: pointerTileX, y: pointerTileY});
                } else if(tile.properties.close) {
                    Network.send(ACTIONS.ACTION_CLOSE, {x: pointerTileX, y: pointerTileY});
                }
                if(0 && (tile.properties.open || tile.properties.close)) {
                    console.log(tile);
                    let s = {x: pointerTileX, y: pointerTileY, id: tile.properties.open||tile.properties.close};
                    this.layers.structure.removeTileAt(pointerTileX, pointerTileY);
                    let t = new Phaser.Tilemaps.Tile(this.layers.structure, ItemResolver(tile.properties.open||tile.properties.close).fg);
                    if(TerrainData[s.id]) {
                        this.collisionMap[s.y][s.x] = (TerrainData[s.id].move_cost === 0) ? 1:0;
                        t.properties = TerrainData[s.id];
                    }
                    if(FurnitureData[s.id]) {
                        this.collisionMap[s.y][s.x] = (FurnitureData[s.id].move_cost_mod === -1) ? 1:0
                        t.properties = FurnitureData[s.id];
                    }
                    this.layers.structure.putTileAt(t, s.x, s.y);
                }
            }
        }

        sprite.setVelocity(0,0);
        if (cursors.left.isDown || this.keys.leftKey.isDown) {
            sprite.setVelocityX(-100);
            moved = true;
        }
        else if (cursors.right.isDown || this.keys.rightKey.isDown) {
            sprite.setVelocityX(100);
            moved = true;
        }
        if(cursors.up.isDown || this.keys.upKey.isDown) {
            sprite.setVelocityY(-100);
            moved = true;
        } else if(cursors.down.isDown || this.keys.downKey.isDown) {
            sprite.setVelocityY(100);
            moved = true;
        }
        if(Phaser.Input.Keyboard.JustDown(this.keys.buildKey)) {
            if(!UI.uiState.craftingOpen) {
                UI.setState({
                    craftingOpen: true
                })
            } else {
                UI.setState({
                    craftingOpen: false
                })
            }
        }
        this.keys.escapeKey.forEach(ek => {
            if(Phaser.Input.Keyboard.JustDown(ek)) {
                this.stopBuilding();
                UI.setState({
                    inventoryOpen: false,
                    craftingOpen: false
                })
            }
        });
        if(Phaser.Input.Keyboard.JustDown(this.keys.toggleInventory)) {
            UI.setState({
                inventoryOpen: !UI.uiState.inventoryOpen
            })
        }

        /* Rotate building or ghost building */
        if(Phaser.Input.Keyboard.JustDown(this.keys.rotateKey)) {
            let t;
            if(this.ghostBuilding) {
                t = this.ghostBuilding;
                console.log(t);
            } else {
                t = this.layers.structure.getTileAt(pointerTileX, pointerTileY);
                if(!t.index) {
                    t = null;
                }
            }
            if(t) {
                let r = Phaser.Math.RadToDeg(t.rotation);
                r += 90;
                if(r>=360) {
                    r=0;
                }
                t.rotation = Phaser.Math.DegToRad(r);
            }
        }
        if(Phaser.Input.Keyboard.JustDown(this.keys.fireKey)) {
            Network.send('fire', {
                source: {x: player.sprite.x, y: player.sprite.y},
                dest: {x: this.input.x + this.cameras.main.scrollX, y: this.input.y + this.cameras.main.scrollY}
            });
            /*this.fireProjectile({
                source: {x: player.sprite.x, y: player.sprite.y},
                dest: {x: this.input.x + this.cameras.main.scrollX, y: this.input.y + this.cameras.main.scrollY}
            });*/
        }
        if(moved) {
            Network.send(ACTIONS.ACTION_MOVE, {player: {x: Math.round(player.sprite.x), y: Math.round(player.sprite.y)}});
        }
        Object.keys(this.clientMap).forEach(k => {
            this.clientMap[k].update();
        })
        UI.update({player:player});
    }
    fireProjectile(opts) {
        let {source, dest} = opts;

        let projectile = this.projectiles.get(source.x, source.y, 'tiles', ItemResolver('animation_bullet_normal').fg); //this.physics.add.image(player.sprite.x-8, player.sprite.y-8, 'tiles', ItemResolver('bullet_crossbow').fg);
            
        if(projectile) {
            projectile.enableBody(true, source.x, source.y).setActive(true).setVisible(true);
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
            this.physics.moveTo(projectile, dest.x, dest.y, 500);
        }
    }
    setupMap(id=0, width=64, height=64) {
        let map = this.make.tilemap({tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT, width: width, height: height});
        
        let tileset = map.addTilesetImage('tiles', 'tiles', TILE_WIDTH, TILE_HEIGHT);
        
        map.setLayer(0);

        let backgroundLayer = map.createBlankDynamicLayer('background', tileset, 0,0);
        this.layers.background = backgroundLayer;
        
        map.fill(null, 0, 0, width-1, height-1);
        map.randomize(0, 0, map.width, map.height, [640, 640, 640, 640, 640, 640, 640, 640, 640, 641]);
        
        this.map = map;

        let structureLayer = map.createBlankDynamicLayer('structures', tileset, 0, 0);
        structureLayer.setCollisionByProperty({collides:true});
        structureLayer.setCollisionBetween(640, 3250);
        structureLayer.fill(644, 0,0,map.width, map.height);
        structureLayer.fill(null, 1, 1, map.width-2, map.height-2);
        this.impact.world.setCollisionMapFromTilemapLayer(structureLayer, { defaultCollidingSlope: 1 });

        this.layers.structure = structureLayer;

        let itemMap = this.make.tilemap({tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT, width: width, height:height});
        
        let itemTileset = itemMap.addTilesetImage('tiles', 'tiles', TILE_WIDTH, TILE_HEIGHT);
        itemMap.setLayer(2);
        let itemLayer = itemMap.createBlankDynamicLayer('items', itemTileset, 0,0);
        /* Add some random items */
        for(let i = 0; i < 48; i++) {
            let id = ['2x4', 'stick', 'log', 'nail'][Phaser.Math.Between(0,3)];
            let item = new Item({name: id, id: id, x: Phaser.Math.Between(1,22), y: Phaser.Math.Between(1,22)});
            //console.log(item);

            let itemTile = new Phaser.Tilemaps.Tile(itemLayer, item.tile, item.x, item.y);
            itemTile.properties = item;

            itemLayer.putTileAt(itemTile, item.x, item.y);
        }
        this.layers.item = itemLayer;
        this.itemMap = itemMap;

    }
    setMap(id, width, height, map) {
        this.layers.background.fill(-1, 0, 0, width, height);
        this.layers.structure.fill(-1, 0, 0, width, height);
        this.layers.item.fill(-1, 0, 0, width, height);
        /*for(let y = 0; y<height; y++) {
            for(let x = 0; x<width; x++) {
                this.layers.background.putTileAt(map.ground[y][x], x, y);
            }
        }*/
        let collisionMap = new Array(height).fill(0).map(_ => new Array(width).fill(0));
        let ground = map.ground.map((r,y) => {
            return r.map((t,x) => {
                let i = ItemResolver(t.id);
                if(!i.bg && i.fg) {
                    return new Phaser.Tilemaps.Tile(this.layers.background, i.fg);
                } else if(i.bg && i.fg) {
                    
                    map.structure.push({id: t.id, tile: i.fg, x, y});
                    return new Phaser.Tilemaps.Tile(this.layers.background, i.bg);
                } else if(i.bg && !i.fg) {
                    return new Phaser.Tilemaps.Tile(this.layers.background, i.bg);
                }
            })
        });
        console.log(map.structure);
        this.layers.background.putTilesAt(ground, 0, 0);
        
        map.structure.forEach(s => {
            let t = new Phaser.Tilemaps.Tile(this.layers.structure, s.tile||ItemResolver(s.id).fg);
            if(TerrainData[s.id]) {
                if(TerrainData[s.id].move_cost === 0) {
                    collisionMap[s.y][s.x] = 1;    
                }
                t.properties = TerrainData[s.id];
            }
            if(FurnitureData[s.id]) {
                if(FurnitureData[s.id].move_cost_mod === -1) {
                    collisionMap[s.y][s.x] = 1;
                }
                t.properties = FurnitureData[s.id];
            }
            this.layers.structure.putTileAt(t, s.x, s.y);
        });
        map.item.forEach(i => {
            this.layers.item.putTileAt(ItemResolver(i.id).fg, i.x, i.y);
        });
        this.collisionMap = collisionMap;
        //this.impact.world.setCollisionMapFromTilemapLayer(this.layers.structure, { defaultCollidingSlope: 1 });
        this.impact.world.setCollisionMap(this.collisionMap, TILE_WIDTH);
    }
    buildItem(recipe, x, y) {
        const item_id = recipe.post_terrain;
        const player = this.player;
        if(player.inventory.length>0) {
            let t = this.layers.structure.getTileAt(x, y);
            let adjacent = this.layers.structure.getTilesWithin(x-1, y-1, 3, 3, {isNotEmpty: true,isColliding:true}).filter(t => t.x == x || t.y == y);
            if(!t || !t.canCollide) {

                /* Does the player have all the components the recipe requires */
                let hasComponents = recipe.components.filter(component => {
                    return player.inventory.has(component[0], component[1]);
                }).length>0;
                
                if(hasComponents) {
                    let item = new Item({
                        id: item_id
                    });
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
                    let itemTile = new Phaser.Tilemaps.Tile(this.layers.item, item.tile, item.x, item.y);
                    itemTile.angle = item.angle||0;
                    itemTile.properties = item;
                    if(this.ghostBuilding && this.ghostBuilding.rotation) {
                        itemTile.rotation = this.ghostBuilding.rotation;
                    }
                    //this.layers.structure.putTileAt(itemTile, x, y);
                    //this.impact.world.setCollisionMapFromTilemapLayer(this.layers.structure, { defaultCollidingSlope: 1 });
                    console.log("net send",{item:item,x:x,y:y} )
                    Network.send('build', {item, x, y});
                }
            }
        }
    }
    startBuilding(recipe) {
        this.building = recipe;
        
        this.ghostBuilding = this.add.image(this.marker.x + this.marker.width / 2, this.marker.y + this.marker.height / 2, 'tiles', ItemResolver(this.building.post_terrain).fg);
        this.ghostBuilding.setOrigin(0.5);
        
        this.ghostBuilding.setAlpha(0.4);
        this.ghostBuilding.x = this.marker.x;
        this.ghostBuilding.y = this.marker.y;
        UI.setState({
            building: this.building
        })
    }
    stopBuilding() {
        if(this.ghostBuilding) {
            this.ghostBuilding.destroy();
            this.ghostBuilding = null;
        }
        this.marker.clear();
        this.marker.lineStyle(2, 0x000000, 1);
        this.marker.strokeRect(0, 0, this.layers.item.tileWidth * this.layers.background.scaleX, this.layers.item.tileHeight * this.layers.background.scaleY);
        this.building = false; 
        UI.setState({
            building: false
        })
    }
    updateEntities(time, delta) {
        this.entities.forEach(e => e.update(time, delta));
    }
    onBuild = (args) => {
        let recipe = args.recipe;
        this.startBuilding(recipe);
    }
}