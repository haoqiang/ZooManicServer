"use strict";

function Session(sid) {


	this.sid = sid;    // session id


	var that = this;
	var players = [];  // player list

	var gameInterval;       // Interval used for gameLoop
	var zooMap;             // the map object
	var gameEnd = true;

	/*
	 * broadcast takes in a JSON structure and send it to
	 * all players.
	 *
	 * e.g., broadcast({type: "abc", x: 30});
	 */
	var broadcast = function (msg) {
		for (var i = 0; i < players.length; i++) {
			players[i].socket.write(JSON.stringify(msg));
		}
	};

	/*
	 * unicast takes in a socket and a JSON structure
	 * and send the message through the given socket.
	 *
	 * e.g., unicast(socket, {type: "abc", x: 30});
	 */
	var unicast = function (player, msg) {
		player.socket.write(JSON.stringify(msg));
	};

	/*
	 * private method: reset()
	 *
	 * Reset the game to its initial state.  Clean up
	 * any remaining timers.  Usually called when the
	 * connection of a player is closed.
	 */
	var reset = function () {
		// Clears gameInterval and set it to undefined
		if (gameInterval !== undefined) {
			clearInterval(gameInterval);
			gameInterval = undefined;
			gameEnd = true;
		}
		console.log("Session " + that.sid + " has just ended!");
	};

	/*
	 * private method: gameLoop()
	 *
	 * The main game loop.  Called every interval at a
	 * period roughly corresponding to the frame rate
	 * of the game
	 */
	var gameLoop = function () {
		if (!gameEnd) {
			var states = {};
			states.zooMap = {};



		} else {
			reset();
		}
	};

	/*
	 * private method: startGame()
	 *
	 * Start a new game. Initialize the map and start the game loop
	 */
	var startGame = function () {
		if (gameInterval !== undefined) {
			// There is already a timer running so the game has already started.
			console.log("Session " + that.sid + " is already playing!");
		} else {
			zooMap = new ZooMap();
			gameEnd = false;
			console.log("Session " + that.sid + " start playing!");
			gameInterval = setInterval(gameLoop, 1000 / Zoo.FRAME_RATE);
		}
	};

	//  executing the incoming message
	this.digest = function (player, msg) {
		switch (msg.type) {
			case "ready":
				break;

			case "start":
				unicast(player, {type:"message", content:"user call start"});
				break;

			case "move":
				unicast(player, {type:"message", content:"user call move"});
				console.log("move: " + msg);
				break;

			case "plantBomb":
				console.log("plantBomb: " + msg);
				break;

			default:
				console.log("Unhandled: " + msg.type);
		}
	};

	this.getRoomSize = function () {
		return players.length;
	};

	this.addPlayer = function (newPlayer) {
		newPlayer.sessionId = this.sid;
		players.push(newPlayer);
		console.log("   Session " + that.sid + " add new player.");
	};

	this.removePlayer = function (oldPlayer) {
		for (var i = 0; i < players.length; i++) {
			if (players[i].id = oldPlayer.id) {
				players.splice(i,1);
				break;
			}
		}
		console.log("   Session " + that.sid + " remove one player.");
	};

	// return current states
	this.getState = function () {
		var playerStates = [];
		for (var i = 0; i < players.length; i++) {
			playerStates.push(players[i].getState());
		}
		return {
			id     : that.sid,
			size   : players.length,
			players: playerStates
		}
	};

}

global.Session = Session;