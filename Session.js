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
	
	 // var startPoint = [{ x: 0, y: 0 },
	 // 		  { x: 1, y: 0 },
	 // 		  { x: 0, y: 2 },
	 // 		  { x: 2, y: 2 }];
    var serverTime;
    var serverDelay;

	/*
	 * broadcast takes in a JSON structure and send it to
	 * all players.
	 *
	 * e.g., broadcast({type: "abc", x: 30});
	 */
	var broadcast = function (msg) {
        var timestamp = new Date().getTime();
        msg["timestamp"] = timestamp + getServerDelay();
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
        var timestamp = new Date().getTime();
        msg["timestamp"] = timestamp + getServerDelay();
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
            var deadCount = 0;
            var sendUpdate = false;

			var states = {};
            states["type"] = "update";

            // update the bombs on the map
            states.bombs = {};
            // check if any bomb explode
            states.bombs.exploded = [];
            states.bombs.active = [];
            for (var i = 0; i < bombs.length; i++) {
                if (bombs[i] !== undefined && bombs[i].isExploded()) {
                    console.log(bombs[i]);

                    states.bombs.exploded.push({x: bombs[i].x, y: bombs[i].y});
                    bombExplode(bombs[i], i);

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
                states.players[players[i].id] = {
                	x: players[i].x,
                	y: players[i].y,
                	bombLeft: players[i].bombLeft,
                	isAlive: players[i].isAlive
                };
            }

            // put the map inside the message
            // states.zooMap = {};
            // var count = 0;
            // for (var x = 0; x < Zoo.ZOO_WIDTH; x++) {
            //     for (var y = 0; y < Zoo.ZOO_HEIGHT; y++) {
            //         states.zooMap[count] = { tile_type: zooMap.cells[x][y].type,
            //             item: zooMap.cells[x][y].item, x: x, y: y};
            //         count ++;
            //     }
            // }
			//counter_debug++
			//if(counter_debug == 1){
			//	console.log("Broadcast to client: "+JSON.stringify(states)+"\r\n");
			//}

            if (sendUpdate)
                broadcast(states);

            if (deadCount >= 3)
                gameEnd = true;
		} else {
			reset();
		}
	};

    var plantBomb = function (player, x, y) {
        var newBomb = new Bomb(player.avatarId, player.id, x, y, player.bombRange);
        bombs.push(newBomb);
        player.bombLeft--;

        // Update the cell to record that the bomb is there
        zooMap.cells[x][y].hasBomb = true;
    }

    var bombExplode = function (bomb, bombIdx) {
    	// Update the cell that has the bomb that the bomb exploded
    	zooMap.cells[bomb.x][bomb.y].hasBomb = false;
        console.log("\n" + JSON.stringify(bombs, null, 2));

        // increase the bombLeft of the player
        for (var i = 0; i < players.length; i++) {
            if (bombs[i] !== undefined && players[i].id == bombs[bombIdx].playerId)
                players[i].bombLeft++;
        }

        //console.log("\n" + JSON.stringify(zooMap.cells, null, 2));
        console.log("\n" + JSON.stringify(bomb, null, 2));

    	// Remove the bomb from the bombs array
    	//bombs.splice(bombIdx, 1);
        bombs[bombIdx] = undefined;


        var up = true, down = true, left = true, right = true;

        for (var i = 1; i <= bomb.range; i++) {
            // if bomb explode upward
            if (up && bomb.y+i < Zoo.ZOO_HEIGHT && zooMap.cells[bomb.x][bomb.y+i].type != 2) {
                zooMap.cells[bomb.x][bomb.y+i].type = 0;
                explodeOtherBomb(bomb.x, bomb.y+i);
                killPlayer(bomb.x, bomb.y+i);
            } else {
            	up = false;
            }

            if (down && bomb.y-i > 0 && zooMap.cells[bomb.x][bomb.y-i].type != 2) {
                zooMap.cells[bomb.x][bomb.y-i].type = 0;
                explodeOtherBomb(bomb.x, bomb.y-i);
                killPlayer(bomb.x, bomb.y-i);
            } else {
            	down = false;
            }

            if (left && bomb.x-i > 0 && zooMap.cells[bomb.x-i][bomb.y].type != 2) {
                zooMap.cells[bomb.x-i][bomb.y].type = 0;
                explodeOtherBomb(bomb.x-i, bomb.y);
                killPlayer(bomb.x-i, bomb.y);
            } else {
            	left = false;
            }

            if (right && bomb.x+i < Zoo.ZOO_WIDTH && zooMap.cells[bomb.x+i][bomb.y].type != 2) {
                zooMap.cells[bomb.x+i][bomb.y].type = 0;
                explodeOtherBomb(bomb.x+i, bomb.y);
                killPlayer(bomb.x+i, bomb.y);
            } else {
            	right = false;
            }
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
                case 1:     //increase bomb range
                    player.bombRange++;
                    break;

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

    var getServerDelay = function () {
        serverDelay = players[0].delay;
        for (var i = 1; i < players.length; i++) {
            if (players[i].delay > serverDelay)
                serverDelay = players[i].delay;
        }
        return serverDelay;
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
                players[i].spawnX = players[i].x;
                players[i].spawnY = players[i].y;
            }

			serverTime = new Date().getTime();

            console.log("Session state:\n" + JSON.stringify(that.getState(), null, 2))
            broadcast({type:"start", content: that.getState().players, startTime: serverTime});


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
                if(selectedAvatar){
                    broadcast({type:"readyReply", status: 0, content: {id: player.id, avatarId:  msg.avatarId, name: player.name}});
                }else{
                    unicast(player, {type:"readyReply", status: 1});
                }
                if (selectedAvatar){
                    broadcast({type:"selectedAvatar", content: player.avatarId});

                    console.log("[Session " + that.sid + "]: Player "+player.id+" ready!");
                }
				break;

			case "start":
				//unicast(player, {type:"message", content:"user call start"});
                //console.log(players[0]);
                startGame();
				break;

			case "move":
                console.log(msg);
				broadcast({
                    type:       "move",
                    playerId:   player.id,
                    cellX:      msg.cellX,
                    cellY:      msg.cellY,
                    direction:  msg.direction,
                    speed:      player.speed
                });
                // wait for delay
                setTimeout(function(){
                    player.isMoving = true;
                    player.direction = msg.direction;
                }, getServerDelay());
				break;

			case "plantBomb":
                broadcast({
                    type: "plantBombReply",
                    playerId: player.id,
                    bombX: msg.x,
                    bombY: msg.y
                });

                setTimeout(function(){
                    plantBomb(player, Math.round(msg.x), Math.round(msg.y));
                }, getServerDelay());                
				console.log(msg);
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
        console.log("[Session " + that.sid + "]: Add new player "+newPlayer.id+"!");
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