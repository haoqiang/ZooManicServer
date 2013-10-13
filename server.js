"use strict";

function Server() {
	// Declare variables
	var port = "5000";

    // this.start = function () {
    //     try {
    //         var express = require('express');
    //         var http = require('http');
    //         var sockjs = require('sockjs');
    //         var sock = sockjs.createServer();

    //         // reinitialize variables

    //         console.log("Initialize Server");

    //         // Upon client establish connection
    //         sock.on('connection', function (conn) {
    //         	console.log("client connected");

    //         	/* When the client closes the connection */
    //         	conn.on('close', function() {
            		
    //         	});

    //         	 When the client sends data to the server 
    //         	conn.on('data', function (data) {

    //         	});
    //         });

    //         // Standard code to starts the Pong server and listen
    //         // for connection
    //         var app = express();
    //         var httpServer = http.createServer(app);
    //         sock.installHandlers(httpServer, {prefix:'/zoo-manic'});
    //         httpServer.listen(port, '0.0.0.0');
    //         app.use(express.static(__dirname));
    //         console.log(sock);

    //     } catch (e) {
    //         console.log("Cannot listen to " + port);
    //         console.log("Error: " + e);
    //     }	
    // }

    this.start = function () {
		var app = require('express')()
		  , server = require('http').createServer(app)
		  , io = require('socket.io').listen(server);

		server.listen(80);

		app.get('/', function (req, res) {
		  res.sendfile(__dirname + '/index.html');
		});

		io.sockets.on('connection', function (socket) {
		  socket.emit('message', 'Hello World!');
		  socket.on('my other event', function (data) {
		    console.log(data);
		  });
		});
    }
}

var gameServer = new Server();
gameServer.start();