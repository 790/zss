import io from 'socket.io-client';

class Network {
    constructor() {
        this.socket = null;
    }
    start() {
        return new Promise((resolve, reject) => {
            console.log("Connecting");
            let socket = io.connect('http://'+window.location.hostname+':3015/', {reconnection: false});
            socket.on('connect', _ => {
                socket.emit('helo');
                console.log("Connected");
                resolve();
            }).on('disconnect', () => {
                io.emit('clientDisconnected', socket.player);
            });
            this.socket = socket;
        });
    }
    send(event_name, data) {
        if(this.socket) {
            this.socket.emit(event_name, data);
        }
    }
}

export default new Network();