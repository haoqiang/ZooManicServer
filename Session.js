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

    var startPoint = [{ x: 0,               y: 0 },
                      { x: Zoo.ZOO_WIDTH-1, y: 0 },
                      { x: 0,               y: Zoo.ZOO_HEIGHT-1 },
                      { x: Zoo.ZOO_WIDTH-1, y: Zoo.ZOO_HEIGHT-1 }];
    var serverTime;

	/*
	 * broadcast takes in a JSON structure and send it to
	 * all players.
	 *
	 * e.g., broadcast({type: "abc", x: 30});
	 */
	var broadcast = function (msg) {
		//if (count && msg.type == 'update') {
		//	console.log("Broadcast to client: "+JSON.stringify(msg)+"\r\n");
		//	count --;
		//}
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
            // remove all player
            for(var i =0; i < players.plength; i++){
                players[i] = null;
            }
            player = [];
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
            states["type"] = "update";

            // update the bombs on the map
            states.bombs = {};
            // check if any bomb explode
            states.bombs.exploded = [];
            states.bombs.active = [];
            for (var i = 0; i < bombs.length; i++) {
                if (bombs[i].isExploded()) {
                    console.log(bombs[i]);

                    bombExplode(bombs[i], i);
                    states.bombs.exploded.push({x: bombs[i].x, y: bombs[i].y});
                    // remove the bomb from the array
                    //bombs.splice(i, 1);
                    //console.log(bombs[i]);
                } else {
                    states.bombs.active.push({x: bombs[i].x, y: bombs[i].y});
                }
            }

            // put players position inside the message
            states.players = {};
            for (var i = 0; i < players.length; i++) {
                // states.players[players[i].id] = {
                // 	x: players[i].x,
                // 	y: players[i].y,
                // 	bombLeft: players[i].bombLeft,
                // 	isAlive: players[i].isAlive
                // };
                players[i].moveOneStep();
            }

            // put the map inside the message
            states.zooMap = {};
            var count = 0;
            for (var x = 0; x < Zoo.ZOO_WIDTH; x++) {
                for (var y = 0; y < Zoo.ZOO_HEIGHT; y++) {
                    states.zooMap[count] = { tile_type: zooMap.cells[x][y].type,
                        item: zooMap.cells[x][y].item, x: x, y: y};
                    count ++;
                }
            }
			//counter_debug++
			//if(counter_debug == 1){
			//	console.log("Broadcast to client: "+JSON.stringify(states)+"\r\n");
			//}

            broadcast(states);
		} else {
			reset();
		}
	};

    var plantBomb = function (player, x, y) {
        var newBomb = new Bomb(player.avatarId, player.id, x, y);
        bombs.push(newBomb);
        player.bombLeft--;

        // Update the cell to record that the bomb is there
        zooMap.cells[x][y].hasBomb = true;
    }

    var bombExplode = function (bomb, bombIdx) {
    	// Update the cell that has the bomb that the bomb exploded
    	zooMap.cells[bomb.x][bomb.y].hasBomb = false;

    	// Remove the bomb from the bombs array
    	bombs.splice(i, 1);

        //console.log(bomb);
        var up = true, down = true, left = true, right = true;

        for (var i = 1; i <= bomb.range; i++) {
            // if bomb explode upward
            if (up && zooMap.cells[bomb.x][bomb.y+i].length != 0 && zooMap.cells[bomb.x][bomb.y+i].type != 2) {
                zooMap.cells[bomb.x][bomb.y+i].type = 0;
                explodeOtherBomb(bomb.x, bomb.y+i);
                killPlayer(bomb.x, bomb.y+i);
            } else {
            	up = false;
            }

            if (down && zooMap.cells[bomb.x][bomb.y-i].length != 0 && zooMap.cells[bomb.x][bomb.y-i].type != 2) {
                zooMap.cells[bomb.x][bomb.y-i].type = 0;
                explodeOtherBomb(bomb.x, bomb.y-i);
                killPlayer(bomb.x, bomb.y-i);
            } else {
            	down = false;
            }

            if (left && zooMap.cells[bomb.x-i][bomb.y].length != 0 && zooMap.cells[bomb.x-i][bomb.y].type != 2) {
                zooMap.cells[bomb.x-i][bomb.y].type = 0;
                explodeOtherBomb(bomb.x-i, bomb.y);
                killPlayer(bomb.x-i, bomb.y);
            } else {
            	left = false;
            }

            if (right && zooMap.cells[bomb.x+i][bomb.y].length != 0 && zooMap.cells[bomb.x+i][bomb.y].type != 2) {
                zooMap.cells[bomb.x+i][bomb.y].type = 0;
                explodeOtherBomb(bomb.x+i, bomb.y);
                killPlayer(bomb.x+i, bomb.y);
            } else {
            	right = false;
            }
        }

        // increase the bombLeft of the player
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == bombs[i].playerId)
                players[i].bombLeft++;
        }
    }

    // Explode the bomb at x, y if there is any
    var explodeOtherBomb = function (x, y) {
    	if (zooMap.cells[x][y].hasBomb == false)
    		return;

    	for (var i = 0; i < bombs.length; i++) {
    		if (bombs[i].x == x && bombs[i].y == y)
    			bombExplode(bombs[i], i);
    	}
    }

    // Kill any the player if he/she at the position x, y
    var killPlayer = function (x, y) {
        for (var i = 0; i < players.length; i++) {
            if ((players[i].x > x-0.5 || players[i].x < x+0.5) && (players[i].y > y-0.5 || players[i].y < y+0.5))
                players[i].isAlive = false;
        }
    }

    // Check if the player get item the the new position
    var getItem = function (player, x, y) {
    	if (zooMap.cells[x][y].item != 0) {
    		var item = zooMap.cells[x][y].item;
    		player.items[item]++;
    		zooMap.cells[x][y].item = 0;

    		switch(item) {
    			case 2: 	//haste
    				player.speed+= 5;
    				break;

    			case 4: 	//more bomb
    				player.bombLeft++;
    				break;
    		}
    	}
    }

    var selectAvatar = function (player, avatarId) {
    	for (var i = 0; i < players.length; i++) {
    		if (players[i].avatarId === avatarId)
    			return false;
    	}
    	player.avatarId = avatarId;
    	return true;
    }

    var simulateMove

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

			serverTime = new Date().getTime();

            console.log("Session state:\n" + JSON.stringify(that.getState(), null, 2))
            broadcast({type:"start", content: that.getState().players, timestamp: serverTime});


            gameEnd = false;
            console.log("Session " + that.sid + " start playing!");
            gameInterval = setInterval(gameLoop, 1000 / Zoo.FRAME_RATE);
		}
	};

	//  executing the incoming message
	this.digest = function (player, msg) {
		switch (msg.type) {
			case "playerReady":
				var selectedAvatar = selectAvatar(player, msg.avatarId);
                if(selectedAvatar){
                    broadcast({type:"readyReply", status: 0, content: {id: player.id, avatarId:  msg.avatarId, name: player.name}});
                }else{
                    unicast(player, {type:"readyReply", status: 1});
                }
                if (selectedAvatar){
                    broadcast({type:"selectedAvatar", content: player.avatarId});
                }
				break;

			case "start":
				//unicast(player, {type:"message", content:"user call start"});
                //console.log(players[0]);
                startGame();
				break;

			case "move":
				broadcast({
                    type:       "move",
                    playerId:   player.id,
                    cellX:      msg.cellX,
                    cellY:      msg.cellY,
                    direction:  msg.direction,
                    speed:      player.speed
                });
                // wait for delay
                player.isMoving = true;
                player.direction = msg.direction;
				break;

			case "plantBomb":
                plantBomb(player, Math.round(msg.x), Math.round(msg.y));
				//console.log("plantBomb: " + msg);
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
		console.log("    Session " + that.sid + " add new player.");
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