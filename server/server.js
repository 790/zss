const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

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
            id: server.lastPlayerId++
        }
        socket.emit('clientList', getClientList(socket))
        socket.broadcast.emit('clientConnected',socket.player);
    });
    socket.on('move', (msg) => {
        msg.player.id = socket.player.id;
        
        socket.broadcast.emit('move', msg);
    })
    socket.on('disconnect',(s) => {
        console.log("client disconnected", s);
        io.emit('clientDisconnected',s);
    });
})

function getClientList(so) {
    return Object.keys(io.sockets.connected).map(s => {
            let p = io.sockets.connected[s].player;
            if(so===io.sockets.connected[s]) { 
                p.me = true;
            } 
            return p; 
        }).filter(e => e);
}