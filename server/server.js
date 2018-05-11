import {Item} from '../src/entity/item';
import Inventory from '../src/entity/inventory';
import {Player} from '../src/entity/player';

import {CraftingRecipes} from '../src/crafting';


const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const itemData = require('../assets/ChestHoleTileset/tile_config.json');
const mapData = require('./house04.json');
if (mapData.length!==1)
{
        console.error("error: json map file need 1 entry. this file provides", mapData.length);
        process.exit(1);
}
if (mapData[0].type !== "mapgen")
{
        console.error("error: json map file is not type mapgen. this file provides", mapData[0].type);
        process.exit(1);
}


app.use(cors());

let lastInstanceId = 0;
class Instance {
    constructor(width=32, height=32) {
        this.id = lastInstanceId++;
let     x,y,w,h,
        obj=mapData[0].object;
        w = obj.rows[0].length;
        h = obj.rows.length;
let     buf_rows = [];
let structures = [];
buf_rows = new Array(height).fill(0).map(_ => new Array(width).fill(-1));
for(y=0;y<obj.rows.length;y++) {
        //let buf_row = [];
        for(x=0;x<obj.rows[y].length;x++) {
                let tile_char = obj.rows[y][x];
                let tile_name = obj.terrain[tile_char];
                if(tile_name === undefined) {
                        tile_name = obj.fill_ter;
                }
                // x scanning and filling
                //buf_row.push({id: tile_name});
                if(obj.furniture[tile_char]) {
                    structures.push({
                        id: obj.furniture[tile_char], x, y
                    });
                }
		buf_rows[y][x] = {id: tile_name};
        }
        //buf_rows.push(buf_row);
}

this.map = { width, height, ground:buf_rows,structure: structures, item: []};	    


        /*
            map properties.

            ground is a NxN 2d array. rows are Y, columns are X.
            Each tile should look like: {
                id: 't_floor'
            }. A 2x2 example with grass in the bottom right: [
                [ {id: 't_floor'}, {id: 't_floor'} ],
                [ {id: 't_floor'}, {id: 't_grass'} ]
            ]

            structure is a 1d array of tiles which will have collision applied.
            [
                { id: 't_wall', x: 10, y: 12 },
                { id: 'f_chair', x: 40, y: 40 }
            ]

            item is same as structure but for items that can be picked up.
            [
                { id: '2x4', x: 20, y: 20 },
                { id: 'nail', x: 20, y: 20, count: 10 }
            ]
        */
        /*this.map = {
            width,
            height,
            ground: new Array(height).fill(0).map(_ => new Array(width).fill(-1)),
            structure: [],
            item: []
        };*/


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

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
const Between = getRandomInt;

let itemMap = {};
itemData['tiles-new'][0]['tiles'].forEach(t => {
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
    socket.on('move', (msg) => {
        msg.player.id = socket.player.id;
        socket.player.x = msg.player.x;
        socket.player.y = msg.player.y;
        socket.broadcast.emit('move', msg);
    });
    socket.on('fire', (msg) => {
        msg.source.x = socket.player.x;
        msg.source.y = socket.player.y;
        socket.emit('projectile',msg);
        socket.broadcast.emit('projectile', msg);
    })
    socket.on('build', (msg) => {
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
        if(!msg.player) {
            msg.player = {id: socket.player.id};
        }
        let i = map.item.findIndex(i => i.x === msg.x && i.y === msg.y);
        if(i>=0) {
            let item = map.item.splice(i, 1)[0];
            socket.player.inventory.push(item);
            socket.broadcast.emit('setTile', {layer: 'item', item: { x: msg.x, y:msg.y, tile: -1}});
            socket.emit('setTile', {layer: 'item', item: {x: msg.x, y:msg.y, id: -1}});
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
