"use strict";

function Session(sid) {


	this.sid = sid;    // session id


	var that = this;
	var players = [];  // player list
    var bombs = []; // list of bomb on the map

	var gameInterval;       // Interval used for gameLoop
	var zooMap;             // the map object
	var gameEnd = true;

    var startPoint = [{ x: 0, y: 0 },  {x: Zoo.ZOO_WIDTH-1, y: 0}, 
        {x: 0, y: Zoo.ZOO_HEIGHT-1}, {x: Zoo.ZOO_WIDTH-1, y: Zoo.ZOO_HEIGHT-1}];

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

            // update the bombs on the map
            states.bombs = {};
            // check if any bomb explode
            states.bombs.exploded = [];
            states.bombs.active = [];
            for (var i = 0; i < bombs.length; i++) {
                console.log(bombs[i]);
                if (bombs[i].isExploded()) {
                    // increase the bombLeft of the player
                    for (var i = 0; i < players.length; i++) {
                        if (players[i].id == bombs[i].playerId)
                            players[i].bombLeft++;
                    }

         
                    bombExplode(bombs[i]);
                    states.bombs.exploded.push({x: bombs[i].x, y: bombs[i].y});
                    // remove the bomb from the array
                    bombs.splice[i, 1];
                } else {
                    states.bombs.active.push({x: bombs[i].x, y: bombs[i].y});
                }
            }

            // put players position inside the message
            states.players = {};
            for (var i = 0; i < players.length; i++) {
                states.players[players[i].id] = {x: players[i].x, y: players[i].y};
            }

            // put the map inside the message
            states.zooMap = {};
            var count = 0;
            for (var x = 0; x < Zoo.ZOO_WIDTH; x++) {
                for (var y = 0; y < Zoo.ZOO_HEIGHT; y++) {
                    //states.zooMap[count] = { type: zooMap.cells[x][y].type, item: zooMap.cells[x][y].item };
                    count ++;
                }
            }
            broadcast(states);
		} else {
			reset();
		}
	};

    var plantBomb = function (player, x, y) {
        var newBomb = new Bomb(player.avatarId, player.id. x, y);
        console.log(newBomb);
        bombs.push(newBomb);
        player.bombLeft--;
    }

    var bombExplode = function (bomb) {
        console.log(bomb);
        var up = false, down = false, left = false, right = false;

        for (var i = 1; i <= bomb.range; i++) {
            // if bomb explode upward
            if (up && zooMap.cells[bomb.x][bomb.y+i].type == 1) {
                up = true;
                zooMap.cells[bomb.x][bomb.y+i].type = 0;
            }

            if (down && zooMap.cells[bomb.x][bomb.y-i].type == 1) {
                down = true;
                zooMap.cells[bomb.x][bomb.y-i].type = 0;
            }

            if (up && zooMap.cells[bomb.x-i][bomb.y].type == 1) {
                left = true;
                zooMap.cells[bomb.x-i][bomb.y].type = 0;
            }

            if (up && zooMap.cells[bomb.x+i][bomb.y].type == 1) {
                right = true;
                zooMap.cells[bomb.x+i][bomb.y].type = 0;
            }
        }
    }

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
                console.log(startPoint[i]);
                console.log(players[i]);
            }

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
				//unicast(player, {type:"message", content:"user call start"});
                //console.log(players[0]);
                startGame();
				break;

			case "move":
				//unicast(player, {type:"message", content:"user call move"});
				//console.log("move: " + msg);
                player.x = msg.x;
                player.y = msg.y;
				break;

			case "plantBomb":
                plantBomb(player, msg.x, msg.y);
				//console.log("plantBomb: " + msg);
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