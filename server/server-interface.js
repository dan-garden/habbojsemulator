//Config
const config = require('./server-config');

//Express and filesystem
const express = require('express');
const fs = require('fs');

//MySQL
const mysql = require('mysql');
const db = mysql.createConnection(config.mysql);

//App and express
const app = express();
const io = require('socket.io').listen(
	app.listen(config.client.port)
);

app.use(express.static(config.client.dir));

db.connect((err) => {
	if (err) console.error(err);
})

console.log("Server Running On: http://localhost:" + config.client.port);

class ServerInterface {
	constructor() {
		this.io = io.of('/server_interface');

		this.bindSockets();
		this.bindDataRequests();

		this.connections = [];
		this.roomSockets = {};
	}

	log(data) {
		if(data.type === 'error') {
			console.error.apply(null, data.args);
		} else {
			console.log.apply(null, data.args);
		}
	}

	bindSockets() {
		this.io.on('connection', socket => {
			this.connectClient(socket);
			socket.on('log', data => {
				this.log(data);
			})

			socket.on('load_room', data => {
				this.connectToRoomSocket(socket, data.roomId);
			});

		});
	}

	bindDataRequests() {
		app.use('/client', express.static('public/client.html'))
		// Use middleware to set the default Content-Type
		app.use(function (req, res, next) {
			res.header('Content-Type', 'application/json');
			next();
		});

		app.post('/api/user_login', (req, res) => {
			const username = req.param('username');
			const password = req.param('password');

			this.log({type: 'log', args: ['test']});
		})

		app.post('/api/available_rooms', (req, res) => {
			db.query(`SELECT * FROM rooms`, (err, result) => {
				res.send(JSON.stringify(result));
			});
		})
	}

	validateSession(handshake, fn) {
		// this.connections[]
		fn(handshake.query);
	}

	connectClient(socket) {
		this.validateSession(socket.handshake, session => {
			socket.emit('client_connected', session);
		});
	}

	roomSocketPath(roomId) {
		return '/loaded_room:' + roomId;
	}

	loadRoomSocket(roomId) {
		this.roomSockets[roomId] = this.io.to(this.roomSocketPath(roomId));
		return this.roomSockets[roomId];
	}

	connectToRoomSocket(socket, roomId) {
		if(!this.roomSockets[roomId]) {
			this.loadRoomSocket(roomId);
		}

		const roomSocketPath = this.roomSocketPath(roomId);
		socket.join(roomSocketPath);

		this.updateRoomSocket(socket, roomId);
	}


	updateRoomSocket(socket, roomId) {
		const roomSocketPath = this.roomSocketPath(roomId);
		db.query(`SELECT * FROM rooms WHERE id='${roomId}'`, (err, roomResult) => {
			
			db.query(`SELECT * FROM room_models WHERE id='${roomResult[0].model_name}'`, (err, modelResult) => {
				roomResult[0].model = modelResult[0];
				this.io.to(roomSocketPath).emit('render_room', roomResult[0]);
			
				//setTimeout(() =>this.updateRoomSocket(socket, roomId), 2000);
			})
		})
	}
}


module.exports = ServerInterface;