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
	var playerCount = 0;
	var maxGameRoomSize = 4;
	var maxGameRoomNumber = 7;

	var players = {}; // Player List
	var sessions = {}; // Game room

	var broadcast = function (msg) {
		for (var id in players) {
			if (players.hasOwnProperty(id)) {
				players[id].socket.write(JSON.stringify(msg));
			}
		}
	};

	var unicast = function (socket, msg) {
		socket.write(JSON.stringify(msg));
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
	};

	//
	//  return all players status
	//
	var getAllPlayerStats = function () {
		var result = [];
		for (var key in players) {
			if (players.hasOwnProperty(key)) {
				result.push(players[key].getState());
			}
		}
		return result;
	};

	//
	//  measure client delay by ping (not used in final version)
	//      and most importantly check if user is
	//      still connected
	//
	var pingNumber = 7;
	var pingInterval = 5000;
	var updateDelay = function (playerId) {
		if (playerId === undefined) {
			for (var key in players) {
				if (players.hasOwnProperty(key)) {
					if (new Date().getTime() - players[key].lastPing > pingInterval * 1000) {
						delete players[key];
						console.log("Player " + key + " removed due to no responding in " + (pingInterval * 1000)/1000 + "s.");
					}
				}
			}
			for (var key in players) {
				players[key].serialDelay = [];
				for(var i=0; i<pingNumber; i++){
					if(players.hasOwnProperty(key)){
						var si = new Date().getTime();
						players[key].serialDelay.push(0);
						broadcast({type: "ping", timestamp: si, serialNo: i});
					}
				}
			}
		} else {
			players[key].serialDelay = [];
			for(var i=0; i<pingNumber; i++){
				var si = new Date().getTime();
				players[key].serialNo.push(si);
				unicast(players[playerId].socket, {type: "ping", timestamp: si, serialNo: i});
			}
		}
	};

	this.start = function () {
		// Set up the delay detection
		setInterval(updateDelay, pingInterval);

		// init all instances, so that players can see
		for (var i = 0; i < maxGameRoomNumber; i++) {
			sessions["10000" + i] = new Session("10000" + i);
		}

		// set event handler for socket messages
		try {
			var express = require('express');
			var http = require('http');
			var sockjs = require('sockjs');
			var sock = sockjs.createServer();

			//new connection established
			sock.on('connection', function (conn) {

				/* When the client close the connection */
				conn.on('close', function () {
					// we don't care if player get disconnected!
					console.log("" + conn.id + " disconnected!");
				});

				/* When the client send data to the server */
				conn.on('data', function (data) {

					var message = JSON.parse(data);
					var playerId = message.playerId;
					//
					//	check new incoming connection player id
					//
					 if(message.type === "pingRefresh"){ 
						console.log(message)
						conn.write(JSON.stringify(message));
					}

					if (message.type === "newPlayer") {
						playerId = new Date().getTime();
						var playerName = message.playerName;
						if( message.secret === Zoo.SECRET_KEY){
							players[playerId] = new Player(playerId, playerName, conn, "test");
						} else {
							players[playerId] = new Player(playerId, playerName, conn, "player");
						}

						//	return player id
						unicast(conn, {type: "newPlayerReply", status: 0, playerId: playerId});
						setTimeout(updateDelay, 100);

						//	update total player count
						playerCount++;
						broadcast({type: "totalPlayerCount", totalPlayer: playerCount});
						console.log("    Player: " + playerName + "[" + playerId + "] created.");
					} else {
						if (playerId === undefined || players[playerId] === undefined) {
							unicast(conn, {type: "message", status: 1, content: "PlayerId not exist, please apply for new user again."});
							return;
						} else {
							if (players[playerId].socket !== conn) {
								players[playerId].socket = conn;
								console.log("    Player: " + players[playerId].name + "[" + playerId + "] updated connection.");
							}
						}
						switch (message.type) {
							case "setProperty":
								//
								//	map all properties to user
								//
								var properties = message.properties;
								for (var key in properties) {
									if (properties.hasOwnProperty(key)) {
										players[playerId][key] = properties[key];
									}
								}
								unicast(conn, {type: "setPropertyReply", status: 0});
								break;
							case "setSession":
								//
								//	add new player to session
								//
								var sessionId = message.sessionId;
								if (sessions[sessionId] !== undefined) {
									if (sessions[sessionId].getPlayerNumber() < maxGameRoomSize) {
										sessions[sessionId].addPlayer(players[playerId]);
										unicast(conn, {type: "message", status: 0, content: "New player added."});
									} else {
										unicast(conn, {type: "message", status: 1, content: "The room is full."});
									}
								} else {
									unicast(conn, {type: "message", status: 2, content: "Session not exist."});
								}
								break;
							case "getSession":
								unicast(conn, {type: "oneSession", content: players[playerId].sessionId});
								break;
							case "getRoomSession":
								unicast(conn, {type: "roomSession", content: getSessionStats()});
								break;
							case "getAllSession":
								unicast(conn, {type: "session", content: getSessionStats()});
								break;
							case "getAllPlayerStats":
								unicast(conn, {type: "playerStates", content: getAllPlayerStats()});
								break;
							case "ping":
								// Delay is half RTT, not used in latest part
								var time = message.timestamp;
									var currentTime = new Date().getTime();
									players[playerId].serialDelay[message.serialNo] = (currentTime - time) / 2;
									players[playerId].lastPing = currentTime;

									if(message.serialNo === pingNumber - 1){
										var temp = 0;
										for(var i=0; i<pingNumber; i++){
											temp += players[playerId].serialDelay[i];
											if(players[playerId].serialDelay[i]===0){
												console.log("Packet lost!");
											}
										}
										//console.log("Delay*7: " + temp);
										players[playerId].delay =  Math.round(temp/pingNumber)+1;
										console.log("Delay: " + players[playerId].delay);
									}
								break; 

							default:
								//
								// if user belongs to a session, pass the message
								//    to that session to handle
								//
								if (players[playerId].sessionId !== undefined) {
									// if(message.delay !== undefined && message.delay > 0){
									// 	players[playerId].delay = message.delay;
									// }
									sessions[players[playerId].sessionId].digest(players[playerId], message);
								} else {
									console.log("Unhandled message." + message.type);
								}
						}
					}
				});
			});

			var app = express();
			var httpServer = http.createServer(app);
			sock.installHandlers(httpServer, {
				log             : function (severity, message) {
					if (severity === "error") {
						console.log("Sever eroor: " + message);
					}
				},
				disconnect_delay: 600000
			});
			httpServer.listen(Zoo.PORT, '0.0.0.0');
			app.use(express.static(__dirname));
			console.log('Listening to 0.0.0.0:' + Zoo.PORT);
		} catch (e) {
			console.log("Error: " + e);
		}
	}
}

var gameServer = new Server();
gameServer.start();