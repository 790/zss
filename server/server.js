const Between = require('phaser/src/math/Between');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const itemData = require('../assets/ChestHoleTileset/tile_config.json');

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

const defaultMap = {
    width: 32,
    height: 24,
    ground: new Array(24).fill(0).map(_ => new Array(32).fill(0)),
    structure: [],
    item: []
};

let map = {...defaultMap};

map.ground = map.ground.map(gy => gy.map(t => Between(0,9)===0?641:640));

map.structure.push({
    x: 10,
    y: 10,
    tile: ItemResolver('t_wall_log').fg
});

for(let i = 0; i < 48; i++) {
    let id = ['2x4', 'stick', 'log', 'nail'][Between(0,3)];
    map.item.push({id: id, name: id, tile: ItemResolver(id).fg, x: Between(1,22), y: Between(1,22)});
}

app.get('/', (req, res) => {
    res.send('Hej');
})
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
server.listen(3015, () => {
    console.log("listening on port "+server.address().port)
});
server.lastPlayerId = 0;
io.on('connection', (socket) => {
    console.log("client connected");

    socket.on('helo', (msg) => {
        socket.player = {
            x:getRandomInt(100, 300),
            y:getRandomInt(100, 300),
            id: server.lastPlayerId++,
            inventory: []
        }
        socket.emit('clientList', getClientList(socket))
        socket.broadcast.emit('clientConnected',socket.player);
        socket.emit('map', {
            id: 0,
            map: map
        })
    });
    socket.on('move', (msg) => {
        msg.player.id = socket.player.id;
        
        socket.broadcast.emit('move', msg);
    });
    socket.on('build', (msg) => {
        if(!msg.player) {
            msg.player = {id: socket.player.id}
        } else {
            msg.player.id = socket.player.id;
        }
        map.structure.push({
            x: msg.x, y:msg.y, tile: msg.item.tile
        })
        msg.layer = 'structure';
        socket.emit('setTile',msg);
        socket.broadcast.emit('setTile', msg);
    }).on('pickup', (msg) => {
        if(!msg.player) {
            msg.player = {id: socket.player.id};
        }
        let i = map.item.findIndex(i => i.x === msg.x && i.y === msg.y);
        if(i>=0) {
            let item = map.item.splice(i, 1)[0];
            socket.player.inventory.push(item.tile);
            socket.broadcast.emit('setTile', {layer: 'item', item: { x: msg.x, y:msg.y, tile: -1}});
            socket.emit('setTile', {layer: 'item', item: {x: msg.x, y:msg.y, tile: -1}});
            socket.emit('inventory', {type:'push', item: item});
        }
    })
    socket.on('disconnect',(s) => {
        console.log("client disconnected", s);
        io.emit('clientDisconnected',socket.player);
    });
})

function getClientList(so) {
    console.log(io.sockets.connected)
    return Object.keys(io.sockets.connected).map(s => {
            let p = {...io.sockets.connected[s].player};
            if(so.id===io.sockets.connected[s].id) { 
                p.me = true;
            }
            return p; 
        }).filter(e => e);
}