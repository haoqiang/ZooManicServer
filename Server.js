"use strict";

var LIB_PATH = "./";
require(LIB_PATH + "Zoo.js");
require(LIB_PATH + "Player.js");
require(LIB_PATH + "Bomb.js");
require(LIB_PATH + "ZooMap.js");
require(LIB_PATH + "Cell.js");

function Server() {
	// Declare variables
	var port = Zoo.PORT;
    var players;            // Associative array for players, indexed via socket ID
    var sockets;            // Associative array for players, indexed via socket ID
    var p1, p2, p3, p4;     // Player 1, 2, 3, 4
                            
    var gameInterval;       // Interval used for gameLoop      

    var zooMap;             // the map object
    var gameEnd = true;

    /*
     * private method: broadcast(msg)
     *
     * broadcast takes in a JSON structure and send it to
     * all players.
     *
     * e.g., broadcast({type: "abc", x: 30});
     */
    var broadcast = function (msg) {
        var id;
        for (id in sockets) {
            sockets[id].write(JSON.stringify(msg));
        }
    }

    /*
     * private method: unicast(socket, msg)
     *
     * unicast takes in a socket and a JSON structure 
     * and send the message through the given socket.
     *
     * e.g., unicast(socket, {type: "abc", x: 30});
     */
    var unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }    

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
    }

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

            var count = 0;
            for (var y = 0; y < Zoo.ZOO_HEIGHT; y++) {
                for (var x = 0; x < Zoo.ZOO_WIDTH; x++) {
                    states.zooMap[count] = {};
                    states.zooMap[count].type = zooMap.cells[x][y].type;
                    states.zooMap[count].item = zooMap.cells[x][y].item;
                    states.zooMap[count].explode = zooMap.cells[x][y].explode;
                    count++;
                }
            }        
            //unicast(sockets[1], states);
            console.log(states);
        } else {
            reset();
        }
    }

    /*
     * private method: startGame()
     *
     * Start a new game. Initialize the map and start the game loop
     */
    var startGame = function () {
        if (gameInterval !== undefined) {
            // There is already a timer running so the game has 
            // already started.
            console.log("Already playing!");
        } else {
            zooMap = new ZooMap();
            gameEnd = false;
            gameInterval = setInterval(function() {gameLoop();}, 1000/Zoo.FRAME_RATE);
        }
    }

    this.start = function () {
        try {
    		// var app = require('express')()
    		//   , server = require('http').createServer(app)
    		//   , io = require('socket.io').listen(server);

            var express = require('express');
            var http = require('http');
            var sockjs = require('sockjs');
            var sock = sockjs.createServer();

            /* Initialize objects */
            gameInterval = undefined;
            zooMap = new ZooMap();
            gameLoop();

            sock.on('connection', function (conn) {
                console.log("connected");

                /* When the client close the connection */
                conn.on('close', function () {
                    reset();
                });


                /* When the client send data to the server */
                conn.on('data', function (data) {
                    var message = JSON.parse(data);

                    switch (message.type) {
                        case "setName":
                            break;

                        case "chooseRoom":
                            break;

                        /* A player is ready */
                        case "ready":
                            manageRoom(room_id);
                            break;

                        case "start":
                            startGame();
                            break;

                        /* A player moves */
                        case "move":
                            break;

                        case "plantBomb":
                            break;

                        default:
                            console.log ("Unhandled " + message.type);
                    }
                });
            });

            var app = express();
            var httpServer = http.createServer(app);
            sock.installHandlers(httpServer, {prefix:'/zoo'});
            httpServer.listen(Zoo.PORT, '0.0.0.0');
            app.use(express.static(__dirname));
        } catch (e) {
            console.log ("Error: " + e);
        }
    }
}

var gameServer = new Server();
gameServer.start();