"use strict";

function Session(sid) {


	this.sid = sid;    // session id


	var that = this;
	var players = [];  // player list
	var bombs = []; // list of bomb on the map

	var gameInterval;       // Interval used for gameLoop
	var zooMap;             // the map object
	var gameEnd = true;
	var counter_debug = 0;

	var startPoint = [
		{ x: 0, y: 0 },
		{ x: Zoo.ZOO_WIDTH - 1, y: 0 },
		{ x: 0, y: Zoo.ZOO_HEIGHT - 1 },
		{ x: Zoo.ZOO_WIDTH - 1, y: Zoo.ZOO_HEIGHT - 1 }
	];

	// var startPoint = [{ x: 0, y: 0 },
	// 		  { x: 1, y: 0 },
	// 		  { x: 0, y: 2 },
	// 		  { x: 2, y: 2 }];
	var serverTime;
	var serverDelay;
    var kill_message = "nothing";

	/*
	 * broadcast takes in a JSON structure and send it to
	 * all players.
	 *
	 * e.g., broadcast({type: "abc", x: 30});
	 */
	var broadcast = function (msg, serverDelay) {
		var timestamp = new Date().getTime();
		serverDelay = (serverDelay === undefined) ? 0 : serverDelay;
		msg.serverDelay = serverDelay;
		msg.timestamp = timestamp + serverDelay;
		//console.log(msg.timestamp);

		for (var i = 0; i < players.length; i++) {
			players[i].socket.write(JSON.stringify(msg));
		}
	};

	/*
	 * broadcast takes in a JSON structure and send it to
	 * all test players.
	 *
	 * e.g., broadcast({type: "abc", x: 30});
	 */
	var testcast = function (msg, serverDelay) {
		var timestamp = new Date().getTime();
		serverDelay = (serverDelay === undefined) ? 0 : serverDelay;
		msg.serverDelay = serverDelay;
		msg.timestamp = timestamp + serverDelay;

		for (var i = 0; i < players.length; i++) {
			if (players[i].type === "test") {
				players[i].socket.write(JSON.stringify(msg));
			}
		}
	};

	/*
	 * unicast takes in a socket and a JSON structure
	 * and send the message through the given socket.
	 *
	 * e.g., unicast(socket, {type: "abc", x: 30});
	 */
	var unicast = function (player, msg, serverDelay) {
		var timestamp = new Date().getTime();
		serverDelay = (serverDelay === undefined) ? 0 : serverDelay;
		msg.serverDelay = serverDelay;
		msg.timestamp = timestamp + serverDelay;

		player.socket.write(JSON.stringify(msg));
	};

	var plantBomb = function (player, x, y) {
		if (!player.bombLeft)
			return;

		var newBomb = new Bomb(player.avatarId, player.id, x, y, player.bombRange);
		bombs.push(newBomb);
		player.bombLeft--;

		// Update the cell to record that the bomb is there
		zooMap.cells[x][y].hasBomb = true;
	};

	var bombExplode = function (bomb, bombIdx, states) {
		if (states !== undefined) {
			states.bombs.exploded.push({
                range: bombs[bombIdx].range,
                x: bombs[bombIdx].x,
                y: bombs[bombIdx].y, 
                playerId: bombs[bombIdx].playerId
            });
		}
		// Update the cell that has the bomb that the bomb exploded
		zooMap.cells[bomb.x][bomb.y].hasBomb = false;
		//console.log("\n" + JSON.stringify(bombs, null, 2));

		// increase the bombLeft of the player
		for (var i = 0; i < players.length; i++) {
			if (bombs[bombIdx] !== undefined && players[i].id == bombs[bombIdx].playerId)
				players[i].bombLeft++;
		}
        var bomb_playerId = bomb.playerId;

		//console.log("\n" + JSON.stringify(zooMap.cells, null, 2));
		//console.log("\n" + JSON.stringify(bomb, null, 2));

		// Remove the bomb from the bombs array
		//bombs.splice(bombIdx, 1);
		bombs[bombIdx] = undefined;


		var up = true, down = true, left = true, right = true;

        killPlayer(bomb.x, bomb.y, bomb_playerId);

		for (var i = 1; i <= bomb.range; i++) {
			// if bomb explode upward
			if (up && bomb.y + i < Zoo.ZOO_HEIGHT && zooMap.cells[bomb.x][bomb.y + i].type != 2) {
				zooMap.cells[bomb.x][bomb.y + i].type = 0;
				explodeOtherBomb(bomb.x, bomb.y + i, states);
				killPlayer(bomb.x, bomb.y + i, bomb_playerId);
			} else {
				up = false;
			}

			if (down && bomb.y - i >= 0 && zooMap.cells[bomb.x][bomb.y - i].type != 2) {
				zooMap.cells[bomb.x][bomb.y - i].type = 0;
				explodeOtherBomb(bomb.x, bomb.y - i, states);
				killPlayer(bomb.x, bomb.y - i, bomb_playerId);
			} else {
				down = false;
			}

			if (left && bomb.x - i >= 0 && zooMap.cells[bomb.x - i][bomb.y].type != 2) {
				zooMap.cells[bomb.x - i][bomb.y].type = 0;
				explodeOtherBomb(bomb.x - i, bomb.y, states);
				killPlayer(bomb.x - i, bomb.y, bomb_playerId);
			} else {
				left = false;
			}

			if (right && bomb.x + i < Zoo.ZOO_WIDTH && zooMap.cells[bomb.x + i][bomb.y].type != 2) {
				zooMap.cells[bomb.x + i][bomb.y].type = 0;
				explodeOtherBomb(bomb.x + i, bomb.y, states);
				killPlayer(bomb.x + i, bomb.y, bomb_playerId);
			} else {
				right = false;
			}
		}
	};

	// Explode the bomb at x, y if there is any
	var explodeOtherBomb = function (x, y, states) {
		if (zooMap.cells[x][y].hasBomb == false)
			return;

		for (var i = 0; i < bombs.length; i++) {
			if (bombs[i] !== undefined && bombs[i].x == x && bombs[i].y == y)
				bombExplode(bombs[i], i, states);
		}
	};

	// Kill any the player if he/she at the position x, y
	var killPlayer = function (x, y, bomb_playerId) {
		for (var i = 0; i < players.length; i++) {
			players[i].getWarpX();
			players[i].getWarpY();
			console.log("Warped: " + players[i].warpX + " " + players[i].warpY);
			if (players[i].isAlive && (players[i].warpX > x - 0.5 && players[i].warpX < x + 0.5) 
                && (players[i].warpY > y - 0.5 && players[i].warpY < y + 0.5)
                && !players[i].checkInvunerable()) {
				console.log("player " + players[i].id + " is killed!");
				players[i].lives--;
				players[i].x = players[i].spawnX;
				players[i].y = players[i].spawnY;
				
				if(!players[i].lives)
					players[i].isAlive = false;

				broadcast({
					type 		: "respawn",
					playerId 	: players[i].id,
					cellX 		: players[i].spawnX,
					cellY 		: players[i].spawnY,
					lives 		: players[i].lives,
					isAlive 	: players[i].isAlive
				});

                var dead_player = players[i].name;
                var scored_player;
                // Increase the kill of the other player
                for (var j = 0; j < players.length; j++) {
                    if (players[j].id == bomb_playerId) {
                        players[j].kill++;
                        scored_player = players[j].name;
                    }
                }
                kill_message = scored_player + " has killed " + dead_player;
			}
		}
	};

	// Check if the player get item the the new position
	var getItem = function (player, x, y) {
		//console.log("x: " + x + " y: " + y); 
		if (zooMap.cells[x][y].item != 0) {
			var item = zooMap.cells[x][y].item;
			player.items[item]++;
			zooMap.cells[x][y].item = 0;

			switch (item) {
				case 1:     //increase bomb range
					player.bombRange += player.bombRange;
					player.items[item]++;
                    player.moreRange = 1;
                    player.moreRange_timestamp = new Date().getTime();
					break;

				case 2: 	//haste
					player.speed += player.speed;
					player.items[item]++;
                    player.haste = 1;
                    player.haste_timestamp = new Date().getTime();
					break;

                case 3:
                    player.invunerable = 1;
                    player.invunerable_timestamp = new Date().getTime();
                    player.items[item]++;
                    break;

				case 4: 	//more bomb
					player.bombLeft += player.bombLeft;
					player.items[item]++;
                    player.moreBomb = 1;
                    player.moreBomb_timestamp = new Date().getTime();
					break;

                case 5:
                    player.items[item]++;
                    player.shakable = 1;
                    player.moreRange_timestamp = new Date().getTime();
                    break;
			}

			if (item)
				return true; 
            else
				return false;

		}
	};

	var selectAvatar = function (player, avatarId) {
		for (var i = 0; i < players.length; i++) {
			if (players[i].avatarId === avatarId)
				return false;
		}
		player.avatarId = avatarId;
		return true;
	};

	var getServerDelay = function () {
		serverDelay = 0;
		for (var i = 0; i < players.length; i++) {
			if (players[i].delay > serverDelay)
				serverDelay = players[i].delay;
		}
		console.log(serverDelay);
		return Math.ceil(serverDelay);
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
			// remove all player
			for (var i = 0; i < players.plength; i++) {
                players.avatarId = undefined;
				players[i] = null;
			}
			players = [];
		}
        
        var serverTime = undefined;
        var serverDelay = undefined;
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
			var aliveCount = 0;
			var sendUpdate = false;
            var winnerId, winnerName;

			var states = {};
			states["type"] = "update";

			// update the bombs on the map
			states.bombs = {};
			// check if any bomb explode
			states.bombs.exploded = [];
			states.bombs.active = [];
			for (var i = 0; i < bombs.length; i++) {
				if (bombs[i] !== undefined && bombs[i].isExploded()) {
					//console.log(bombs[i]);


					bombExplode(bombs[i], i, states);

					sendUpdate = true;
					// remove the bomb from the array
					//bombs.splice(i, 1);
					//console.log(bombs[i]);
				} else if (bombs[i] !== undefined) {
					states.bombs.active.push({x: bombs[i].x, y: bombs[i].y});
				}
			}

			// put players position inside the message
			states.players = {};
			for (var i = 0; i < players.length; i++) {
				players[i].moveOneStep();

                players[i].checkHaste();
                players[i].checkMoreBomb();
                players[i].checkMoreRange();
                players[i].checkShakable();
                players[i].checkInvunerable();

				if (getItem(players[i], Math.round(players[i].x), Math.round(players[i].y)))
					sendUpdate = true;

				states.players[players[i].id] = {
                    name    : players[i].name,
                    kill    : players[i].kill,
					x       : players[i].x,
					y       : players[i].y,
					items   : players[i].items,
					bombLeft: players[i].bombLeft,
					speed   : players[i].speed,
					lives	: players[i].lives,
					isAlive : players[i].isAlive
				};

				if (players[i].isAlive) {
					aliveCount++;
					winnerId = players[i].id;
                	winnerName = players[i].name;
				}
			}

			// put the map inside the message
			states.zooMap = {};
			var count = 0;
			for (var x = 0; x < Zoo.ZOO_WIDTH; x++) {
				for (var y = 0; y < Zoo.ZOO_HEIGHT; y++) {
					states.zooMap[count] = { tile_type: zooMap.cells[x][y].type,
						item                          : zooMap.cells[x][y].item, x: x, y: y};
					count++;
				}
			}


			if (sendUpdate) {
				broadcast(states);
                broadcast({
                    type: "killMessage",
                    content: kill_message
                });
			} else {
				testcast(states);
			}

            // Send message for killing player
            if (kill_message !== "nothing") {
                kill_message = "nothing";
            }

			if (aliveCount <= 1 && players.length > 1) {
				gameEnd = true;
                broadcast({
                    type: "gameEnd",
                    winnerName: winnerName, 
                    winnerId: winnerId
                });
            }
            
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
			// Initialize map
			zooMap = new ZooMap();

			// Initialize player position
			for (var i = 0; i < players.length; i++) {
				players[i].x = startPoint[i].x;
				players[i].y = startPoint[i].y;
				players[i].spawnX = players[i].x;
				players[i].spawnY = players[i].y;
			}

			// Get ZooMap
			var zooState = {};
			var count = 0;
			for (var x = 0; x < Zoo.ZOO_WIDTH; x++) {
				for (var y = 0; y < Zoo.ZOO_HEIGHT; y++) {
					zooState[count] = {
						tile_type: zooMap.cells[x][y].type,
						item     : zooMap.cells[x][y].item,
						x        : x,
						y        : y
					};
					count++;
				}
			}

			serverTime = new Date().getTime();

			console.log("Session state:\n" + JSON.stringify(that.getState(), null, 2))
			broadcast({type: "start", content: that.getState().players, startTime: serverTime, zooMap: zooState});


			gameEnd = false;
			console.log("Session " + that.sid + " start playing!");
			gameInterval = setInterval(gameLoop, 1000 / Zoo.FRAME_RATE);
		}
	};

	//  executing the incoming message
	this.digest = function (player, msg) {
		//console.log("SESSION   Recieve:\n" + JSON.stringify(msg, null, 2));
		switch (msg.type) {
			case "playerReady":
				var selectedAvatar = selectAvatar(player, msg.avatarId);
				if (selectedAvatar) {
					broadcast({type: "readyReply", status: 0, content: {id: player.id, avatarId: msg.avatarId, name: player.name}});
				} else {
					unicast(player, {type: "readyReply", status: 1});
				}
				if (selectedAvatar) {
					broadcast({type: "selectedAvatar", content: player.avatarId});

					console.log("[Session " + that.sid + "]: Player " + player.id + " ready!");
				}
				break;

			case "start":
				//unicast(player, {type:"message", content:"user call start"});
				//console.log(players[0]);
				startGame();
				break;

			case "move":
				var sdelay = getServerDelay();
				
				broadcast({
					type     : "move",
					playerId : player.id,
					cellX    : msg.cellX,
					cellY    : msg.cellY,
					direction: msg.direction,
					speed    : player.speed
				}, sdelay);
				// wait for delay
				setTimeout(function () {
                    var timestamp = new Date().getTime();
                    var gameclock = timestamp - serverTime;
                    console.log("time: " + gameclock);
                    player.x = msg.cellX;
                    player.y = msg.cellY;
					player.isMoving = true;
					player.direction = msg.direction;
				}, sdelay);
				break;

			case "plantBomb":
				var sdelay = getServerDelay();
				broadcast({
					type    : "plantBombReply",
					playerId: player.id,
                    bombLeft: player.bombLeft-1,
					bombX   : msg.x,
					bombY   : msg.y
				}, sdelay);

				setTimeout(function () {
					plantBomb(player, Math.round(msg.x), Math.round(msg.y));
				}, sdelay);
				break;

			default:
				console.log("Unhandled: " + msg.type);
		}
	};

	this.getPlayerNumber = function () {
		return players.length;
	};

	this.addPlayer = function (newPlayer) {
		newPlayer.sessionId = this.sid;
		players.push(newPlayer);
		console.log("[Session " + that.sid + "]: Add new player " + newPlayer.id + "!");
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