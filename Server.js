"use strict";

var LIB_PATH = "./";
require(LIB_PATH + "Zoo.js");
require(LIB_PATH + "Player.js");
require(LIB_PATH + "Bomb.js");
require(LIB_PATH + "ZooMap.js");
require(LIB_PATH + "Cell.js");
require(LIB_PATH + "Session.js");

function Server() {

	// Declare variables
	var port = Zoo.PORT;
	var maxGameRoomSize = 4;
	var maxGameRoomNumber = 10;
	var maxGamePlayer = maxGameRoomSize * maxGameRoomNumber;

	var players = {};
	var sessions = {};

	var broadcast = function (msg) {
		for (var id in players) {
			if(players.hasOwnProperty(id)){
				//players[id].socket.write(JSON.stringify(msg));
				players[id].socket.emit('data',JSON.stringify(msg));
			}
		}
	};

	var unicast = function (socket, msg) {
		//socket.write(JSON.stringify(msg));
		socket.emit('data',JSON.stringify(msg));
		console.log(msg);
	};

	//
	//  return the session list to
	//      show on the game lobby
	//
	var getSessionStats = function () {
		var result = [];
		for (var key in sessions) {
			if (sessions.hasOwnProperty(key)) {
				result.push(sessions[key].getState());
			}
		}
		return result;
	}

	this.start = function () {
		// init all instances, so that players can see
		for (var i = 0; i < maxGameRoomNumber; i++) {
			sessions["10000" + i] = new Session("10000" + i);
		}

		// set event handler for socket messages
		try {
			var playerCount = 0;

			var io = require('socket.io').listen(5000);
			io.sockets.on('connection', function (conn) {
			    console.log('Client connected to this nodeServer');

				if (playerCount === maxGamePlayer) {
					//
					// force disconnect the player.
					unicast(conn, {type: "message", content: "The game is full."});
					conn.disconnect();
				} else {
					//
					// create new player and send session list
					//     a unique id is set to each player
					players[conn.id] = new Player(new Date().getTime(), conn);
					playerCount++;
				}

				console.log("New player connected... (total " + playerCount + ")");

			    conn.on('data', function (data)
			    {
					var message = JSON.parse(data.toString('utf-8'));
					//console.log(data.toString('utf-8'));
					console.log("   Recieve:\n" + JSON.stringify(message, null, 2));
					switch (message.type) {
						case "setProperty":
							//
							// map all properties to user
							//
							var properties = message.properties;
							for (var key in properties) {
								if (properties.hasOwnProperty(key)) {
									players[conn.id][key] = properties[key];
								}
							}
							unicast(conn, {type: "setPropertyReply", status: 0});
							break;
						case "setSession":
							//
							//  add new player to session
							//
							var sessionId = message.sessionId;
							if (sessions[sessionId] !== undefined) {
								if (sessions[sessionId].getPlayerNumber() < maxGameRoomSize) {
									sessions[sessionId].addPlayer(players[conn.id]);
									unicast(conn, {type: "message", status: 0, content: "New player added."});
								} else {
									unicast(conn, {type: "message", status: 1, content: "The room is full."});
								}
							} else {
								unicast(conn, {type: "message", status: 2, content: "Session not exist."});
							}
							break;
						case "getSession":
							unicast(conn, {type: "session", content: players[conn.id].sessionId});
							break;
						case "getAllSession":
							unicast(conn, {type: "session", content: getSessionStats()});
							break;
						default:
							//
							// if user belongs to a session, pass the message
							//   to that session to handle
							//
							if (players[conn.id].sessionId !== undefined) {
								sessions[players[conn.id].sessionId].digest(players[conn.id], message);
							} else {
								console.log("Unhandled message.");
							}
					}  
				});
			});

			// var net = require('net');
			// var server = net.createServer(function (conn)
			// { //'connection' listener
			//     console.log('Client connected to this nodeServer');

			// 	if (playerCount === maxGamePlayer) {
			// 		//
			// 		// force disconnect the player.
			// 		unicast(conn, {type: "message", content: "The game is full."});
			// 		conn.disconnect();
			// 	} else {
			// 		//
			// 		// create new player and send session list
			// 		//     a unique id is set to each player
			// 		players[conn.id] = new Player(new Date().getTime(), conn);
			// 		playerCount++;
			// 	}

			// 	console.log("New player connected... (total " + playerCount + ")");

			//     conn.on('data', function (data)
			//     {
			// 		var message = JSON.parse(data.toString('utf-8'));
			// 		//console.log(data.toString('utf-8'));
			// 		console.log("   Recieve:\n" + JSON.stringify(message, null, 2));
			// 		switch (message.type) {
			// 			case "setProperty":
			// 				//
			// 				// map all properties to user
			// 				//
			// 				var properties = message.properties;
			// 				for (var key in properties) {
			// 					if (properties.hasOwnProperty(key)) {
			// 						players[conn.id][key] = properties[key];
			// 					}
			// 				}
			// 				unicast(conn, {type: "setPropertyReply", status: 0});
			// 				break;
			// 			case "setSession":
			// 				//
			// 				//  add new player to session
			// 				//
			// 				var sessionId = message.sessionId;
			// 				if (sessions[sessionId] !== undefined) {
			// 					if (sessions[sessionId].getPlayerNumber() < maxGameRoomSize) {
			// 						sessions[sessionId].addPlayer(players[conn.id]);
			// 						unicast(conn, {type: "message", status: 0, content: "New player added."});
			// 					} else {
			// 						unicast(conn, {type: "message", status: 1, content: "The room is full."});
			// 					}
			// 				} else {
			// 					unicast(conn, {type: "message", status: 2, content: "Session not exist."});
			// 				}
			// 				break;
			// 			case "getSession":
			// 				unicast(conn, {type: "session", content: players[conn.id].sessionId});
			// 				break;
			// 			case "getAllSession":
			// 				unicast(conn, {type: "session", content: getSessionStats()});
			// 				break;
			// 			default:
			// 				//
			// 				// if user belongs to a session, pass the message
			// 				//   to that session to handle
			// 				//
			// 				if (players[conn.id].sessionId !== undefined) {
			// 					sessions[players[conn.id].sessionId].digest(players[conn.id], message);
			// 				} else {
			// 					console.log("Unhandled message.");
			// 				}
			// 		}  
			//     });

			//     conn.on('end', function ()
			//     {
			//         console.log('client disconnected');
			// 		//
			// 		// remove the player if
			// 		//      it joined any session
			// 		var sid = players[conn.id].sessionId;
			// 		if (sid !== undefined) {
			// 			sessions[sid].removePlayer(players[conn.id]);
			// 		}
			// 		playerCount--;
			//     });
			// });

			// server.listen(Zoo.PORT, function ()
			// { //'listening' listener
			//     console.log('nodeServer listening port: ' + Zoo.PORT);
			// });
			// var express = require('express');
			// var http = require('http');
			// var sockjs = require('sockjs');
			// var sock = sockjs.createServer();

			// //var sock = require('socket.io').listen(Zoo.PORT);

			// var playerCount = 0;

			// // new connection established
			// sock.on('connection', function (conn) {
			// 	console.log("hello");
			// 	// if (playerCount === maxGamePlayer) {
			// 	// 	//
			// 	// 	// force disconnect the player.
			// 	// 	unicast(conn, {type: "message", content: "The game is full."});
			// 	// 	conn.disconnect();
			// 	// } else {
			// 	// 	//
			// 	// 	// create new player and send session list
			// 	// 	//     a unique id is set to each player
			// 	// 	players[conn.id] = new Player(new Date().getTime(), conn);
			// 	// 	playerCount++;
			// 	// }

			// 	// console.log("New player connected... (total " + playerCount + ")");
			// 	// broadcast({type: "message", content: "There are now " + playerCount + " players"});

			// 	// /* When the client close the connection */
			// 	// conn.on('close', function () {
			// 	// 	//
			// 	// 	// remove the player if
			// 	// 	//      it joined any session
			// 	// 	var sid = players[conn.id].sessionId;
			// 	// 	if (sid !== undefined) {
			// 	// 		sessions[sid].removePlayer(players[conn.id]);
			// 	// 	}
			// 	// 	playerCount--;
			// 	// });


			// 	/* When the client send data to the server */
			// 	conn.on('data', function (data) {
			// 		console.log("hello");
			// 	// 	var message = JSON.parse(data);
			// 	// 	console.log("   Recieve:\n" + JSON.stringify(message, null, 2));
			// 	// 	switch (message.type) {
			// 	// 		case "setProperty":
			// 	// 			//
			// 	// 			// map all properties to user
			// 	// 			//
			// 	// 			var properties = message.properties;
			// 	// 			for (var key in properties) {
			// 	// 				if (properties.hasOwnProperty(key)) {
			// 	// 					players[conn.id][key] = properties[key];
			// 	// 				}
			// 	// 			}
			// 	// 			unicast(conn, {type: "setPropertyReply", status: 0});
			// 	// 			break;
			// 	// 		case "setSession":
			// 	// 			//
			// 	// 			//  add new player to session
			// 	// 			//
			// 	// 			var sessionId = message.sessionId;
			// 	// 			if (sessions[sessionId] !== undefined) {
			// 	// 				if (sessions[sessionId].getPlayerNumber() < maxGameRoomSize) {
			// 	// 					sessions[sessionId].addPlayer(players[conn.id]);
			// 	// 					unicast(conn, {type: "message", status: 0, content: "New player added."});
			// 	// 				} else {
			// 	// 					unicast(conn, {type: "message", status: 1, content: "The room is full."});
			// 	// 				}
			// 	// 			} else {
			// 	// 				unicast(conn, {type: "message", status: 2, content: "Session not exist."});
			// 	// 			}
			// 	// 			break;
			// 	// 		case "getSession":
			// 	// 			unicast(conn, {type: "session", content: players[conn.id].sessionId});
			// 	// 			break;
			// 	// 		case "getAllSession":
			// 	// 			unicast(conn, {type: "session", content: getSessionStats()});
			// 	// 			break;
			// 	// 		default:
			// 	// 			//
			// 	// 			// if user belongs to a session, pass the message
			// 	// 			//   to that session to handle
			// 	// 			//
			// 	// 			if (players[conn.id].sessionId !== undefined) {
			// 	// 				sessions[players[conn.id].sessionId].digest(players[conn.id], message);
			// 	// 			} else {
			// 	// 				console.log("Unhandled message.");
			// 	// 			}
			// 	// 	}
			// 	});
			// });

			// var app = express();
			// var httpServer = http.createServer(app);
			// sock.installHandlers(httpServer);
			// httpServer.listen(Zoo.PORT, '0.0.0.0');
			// app.use(express.static(__dirname));
			// console.log('Listening to 0.0.0.0:'+Zoo.PORT);
		} catch (e) {
			console.log("Error: " + e);
		}
	}
}

var gameServer = new Server();
gameServer.start();