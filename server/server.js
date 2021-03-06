import {Item} from '../src/entity/item';
import Inventory from '../src/entity/inventory';
import {Player} from '../src/entity/player';

import {CraftingRecipes} from '../src/crafting';

import ACTIONS from '../src/actions.json';
import Prefab from './prefab';

import {FurnitureData, TerrainData} from '../src/tiles';
import {getRandomInt} from '../src/utils';

const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const glob = require('glob');
const fs = require('fs');

const itemData = {};

function loadItemData() {
    glob.sync('**/*.json', {cwd: __dirname +'//'+ '../data/json/items'}).forEach(filename => {
        console.log("Loading item group: "+filename);
        let items = JSON.parse(fs.readFileSync(__dirname +'//'+'../data/json/items/' + filename));
        items.forEach(ig => {
            itemData[ig.id] = ig;
        })
    });
}
loadItemData();
app.use(cors());
const tileData = require('../assets/ChestHoleTileset/tile_config.json');
let lastInstanceId = 0;
class Instance {
    constructor(width=32, height=32, opts={}) {
        this.id = lastInstanceId++;
        let basemap = new Array(height).fill(0).map(_ => new Array(width).fill(-1));
        basemap = basemap.map(gy => gy.map(t => getRandomInt(0,9)===0?{id:'t_dirt'}:{id:'t_grass'}));
        // direction can be 0,90,180,270 degrees rotation
        let pf = new Prefab({basemap: basemap, direction: 0, offsetx: 0, offsety: 0, mapfilename: opts.mapfilename||null});
        this.map = { width: pf.width, height: pf.height, ground:pf.ground, structure: pf.structure, item: pf.item};
        this.created = new Date();
    }
    getMap() {
        return this.map;
    }
    randomize() {

    }
}
const instances = {};

let defaultInstance = new Instance(64,64);
instances[defaultInstance.id] = defaultInstance;

const Between = getRandomInt;

let itemMap = {};
tileData['tiles-new'][0]['tiles'].forEach(t => {
    if(t.id instanceof Array) {
        t.id.forEach(id => {
            itemMap[id] = t;
        })
    } else {
        itemMap[t.id] = t
    }
});

function ItemResolver(id) {
    return itemMap[id];
}
const defaultMapWidth = 64;
const defaultMapHeight = 64;
const defaultMap = {
    width: defaultMapWidth,
    height: defaultMapHeight,
    ground: new Array(defaultMapHeight).fill(0).map(_ => new Array(defaultMapWidth).fill(0)),
    structure: [],
    item: []
};
defaultInstance.randomize();
let map = defaultInstance.getMap();

/*
map.ground = map.ground.map(gy => gy.map(t => Between(0,9)===0?{id:'t_dirt'}:{id:'t_grass'}));
map.structure.push({
    x: 10,
    y: 10,
    id: 't_wall_log'
});

for(let i = 0; i < 48; i++) {
    let id = ['2x4', 'stick', 'log', 'nail'][Between(0,3)];
    map.item.push({id: id, name: id, x: Between(1,22), y: Between(1,22)});
}
*/
app.get('/', (req, res) => {
    res.send('Hej');
})

server.listen(3015, () => {
    console.log("listening on port "+server.address().port)
});
server.lastPlayerId = 0;
io.on('connection', (socket) => {
    console.log("client connected");

    socket.on('helo', (msg) => {
        socket.player = new Player({
            x:getRandomInt(100, 300),
            y:getRandomInt(100, 300),
            id: server.lastPlayerId++,
            instance: defaultInstance.id,
            inventory: new Inventory([])
        });
        socket.emit('clientList', getClientList(socket))
        socket.broadcast.emit('clientConnected',socket.player);
        socket.emit('map', {
            id: 0,
            map: instances[socket.player.instance].getMap()
        })
    });
    socket.on(ACTIONS.ACTION_MOVE, (msg) => {
        msg.player.id = socket.player.id;
        socket.player.x = msg.player.x;
        socket.player.y = msg.player.y;
        socket.broadcast.emit(ACTIONS.ACTION_MOVE, msg);
    })
    .on(ACTIONS.ACTION_OPEN, (msg) => {
        let map = instances[socket.player.instance].getMap();
        let i = TerrainData[map.ground[msg.y][msg.x].id];
        console.log(i);
        if(i && i.open) {
            map.ground[msg.y][msg.x] = {id: i.open};
            socket.emit('setTile', {
                x: msg.x,
                y: msg.y,
                layer: 'foreground',
                item: {id: i.open}
            });
            socket.broadcast.emit('setTile', {
                x: msg.x,
                y: msg.y,
                layer: 'foreground',
                item: {id: i.open}
            });
        }

    })
    .on(ACTIONS.ACTION_CLOSE, (msg) => {
        let map = instances[socket.player.instance].getMap();
        let t = map.ground[msg.y][msg.x];
        if(!t) {
            return;
        }
        let i = TerrainData[t.id];
        console.log(i);
        if(i && i.close) {
            map.ground[msg.y][msg.x] = {id: i.close};
            socket.emit('setTile', {
                x: msg.x,
                y: msg.y,
                layer: 'foreground',
                item: {id: i.close}
            });
            socket.broadcast.emit('setTile', {
                x: msg.x,
                y: msg.y,
                layer: 'foreground',
                item: {id: i.close}
            });
        }

    })
    .on(ACTIONS.ACTION_TRAVEL, (msg) => {
        console.log("asgag", msg);
        if(msg.dest === 'home') {
            socket.player.instance = defaultInstance.id;

        } else if(msg.dest === 'school') {
            let newInstance = new Instance(64, 64, {mapfilename: 'school_1.json'});
            instances[newInstance.id] = newInstance;
            socket.player.instance = newInstance.id;
        } else if(msg.dest === 'bank') {
            let newInstance = new Instance(64, 64, {mapfilename: 'bank.json'});
            instances[newInstance.id] = newInstance;
            socket.player.instance = newInstance.id;
        } else if(msg.dest === 'shelter') {
            let newInstance = new Instance(64, 64, {mapfilename: 'shelter.json'});
            instances[newInstance.id] = newInstance;
            socket.player.instance = newInstance.id;
        } else if(msg.dest === 'house') {
            let newInstance = new Instance(64, 64, {mapfilename: 'house/house05.json'});
            instances[newInstance.id] = newInstance;
            socket.player.instance = newInstance.id;
        } else if(msg.dest === 'random') {
            let newInstance = new Instance(64, 64);
            instances[newInstance.id] = newInstance;
            socket.player.instance = newInstance.id;
        }
        let map = instances[socket.player.instance].getMap();
        socket.emit('map', {
            id: instances[socket.player.instance].id,
            width: map.width,
            height: map.height,
            map: map
        })
    });

    socket.on('fire', (msg) => {
        msg.instance = socket.player.instance;
        msg.source.x = socket.player.x;
        msg.source.y = socket.player.y;
        socket.emit('projectile',msg);
        socket.broadcast.emit('projectile', msg);
    })
    socket.on('build', (msg) => {
        let map = instances[socket.player.instance].getMap();
        const player = socket.player;
        if(!msg.player) {
            msg.player = {id: socket.player.id}
        } else {
            msg.player.id = socket.player.id;
        }
        let recipe = CraftingRecipes.find(cr => cr.post_terrain === msg.item.id);

        if(!recipe) {
            socket.emit('action_error', {command: 'build', msg: 'Could not build. Invalid recipe'});
            return;
        }

        /* Check the player has required components */
        let hasComponents = recipe.components.filter(r => {
            return r.filter(component => player.inventory.has(component[0], component[1])).length>0
        }).length===recipe.components.length;
        console.log(hasComponents, recipe.components, player.inventory.inventory)
        /* Check there's no building present already */
        if(map.structure.find(t => t.x === msg.x && t.y === msg.y)) {
            socket.emit('action_error', {command: 'build', msg: 'Could not build. Structure already present'});
            return;
        }
        if(hasComponents) {

            /* Remove components from player's inventory */
            recipe.components.forEach(r => {
                let x = r.filter(component => player.inventory.has(component[0], component[1]));
                if(x.length) {
                    player.inventory.remove(x[0][0], x[0][1]);
                }

            });
            map.structure.push({
                x: msg.x, y:msg.y, tile: msg.item.tile
            })
            msg.layer = 'structure';
            socket.emit('setTile',msg);
            socket.broadcast.emit('setTile', msg);

            socket.emit('inventory', {type:'set', inventory: player.inventory.toArray()});
        } else {
            socket.emit('action_error', {command: 'build', msg: 'Could not build. Missing components'});
        }
    }).on('pickup', (msg) => {
        let map = instances[socket.player.instance].getMap();
        if(!msg.player) {
            msg.player = {id: socket.player.id};
        }
        console.log("pickup", msg);
        let i = map.item.findIndex(i => i.x === msg.x && i.y === msg.y);
        if(i>=0) {
            let item = map.item.splice(i, 1)[0];
            socket.player.inventory.push(item);
            socket.broadcast.emit('setTile', {layer: 'item', x: msg.x, y:msg.y, item: { id: -1 }});
            socket.emit('setTile', {layer: 'item', x: msg.x, y:msg.y, item: {id: -1}});
            socket.emit('inventory', {type:'push', item: item});
        }
    })
    socket.on('disconnect',(s) => {
        console.log("client disconnected", s);
        io.emit('clientDisconnected',socket.player);
    });
})

function getClientList(so) {
    return Object.keys(io.sockets.connected).map(s => {
            let p = {...io.sockets.connected[s].player};
            if(so.id===io.sockets.connected[s].id) {
                p.me = true;
            }
            return p;
        }).filter(e => e);
}
