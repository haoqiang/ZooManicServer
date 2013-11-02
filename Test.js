"use strict";

function TestClient() {
	// private variables
	var socket;         // socket used to connect to server
	var playerId;
	var that = this;


	/*
	 * private method: sendToServer(msg)
	 *
	 * The method takes in a JSON structure and send it
	 * to the server, after converting the structure into
	 * a string.
	 */
	this.sendToServer = function (msg) {
		if(playerId!==undefined){
			msg.playerId = playerId;
		}
		document.getElementById("output").innerHTML += "<hr>outgoing:<br><pre>"+JSON.stringify(msg, null, 4)+"</pre>";
		socket.send(JSON.stringify(msg));
	}

	/*
	 * private method: initNetwork(msg)
	 *
	 * Connects to the server and initialize the various
	 * callbacks.
	 */
	this.initNetwork = function () {
		// Attempts to connect to game server
		try {
			//socket = new SockJS("http://" + Zoo.SERVER_NAME + ":" + Zoo.PORT + "");
			if(location.host !== ""){
				socket = new SockJS("http://"+location.host+":" + Zoo.PORT + "");
			}else{
				socket = new SockJS("http://localhost:" + Zoo.PORT + "");
			}
			//socket = new SockJS("http://ec2-54-225-24-113.compute-1.amazonaws.com:" + Zoo.PORT + "");
			socket.onmessage = function (e) {
				var message = JSON.parse(e.data);

				if(message.type!=="update"){
					document.getElementById("output").innerHTML += "<hr>incoming:<br><pre>"+JSON.stringify(message, null, 4)+"</pre>";
				}
				if(message.type==="newPlayerReply"){
					playerId = message.playerId;
				}
				if(message.type==="ping"){
					that.sendToServer(message);
				}

			};
		} catch (e) {
			console.log("Failed to connect");
		}
	}

	this.disconnectNetwork = function () {
		// Attempts to connect to game server
		socket.close();
	}


	/*
	 * priviledge method: start
	 *
	 * Create the ball and paddles objects, connects to
	 * server, draws the GUI, and starts the rendering
	 * loop.
	 */
	this.start = function () {

		// Initialize network and GUI
		this.initNetwork();
	}
}

var test = new TestClient();
test.start();

$(document).ready(function(){


	var delay = 3000;

	var interval = 500;
	setTimeout(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 1: Request server to create new player</b></p>";
		test.sendToServer({type:"newPlayer", playerName: "test player"});
	}, delay);
	// delay += interval;
	// setTimeout(function(){
	// 	document.getElementById("output").innerHTML += "<p><b>Step 2: Get all available game rooms</b></p>";
	// 	test.sendToServer({type:"getAllSession"});
	// }, delay);
	// delay += interval;
	// setTimeout(function(){
	// 	document.getElementById("output").innerHTML += "<p><b>Step 3: Join a game rooms</b></p>";
	// 	test.sendToServer({type:"setSession", sessionId:"100000"});
	// }, delay);
	// delay += interval;
	// setTimeout(function(){
	// 	document.getElementById("output").innerHTML += "<p><b>Step 4: Start the game</b></p>";
	// 	test.sendToServer({type:"start"});
	// }, delay);
	// delay += interval;
	// setTimeout(function(){
	// 	document.getElementById("output").innerHTML += "<p><b>Step 5: Make some move</b></p>";
	// 	test.sendToServer({type:"move", x: 5, y: 5});
	// }, delay);
	// delay += interval;
	// setTimeout(function(){
	// 	document.getElementById("output").innerHTML += "<p><b>Step 6: Try disconnect</b></p><hr>";
	// 	test.disconnectNetwork();
	// }, delay);
	// delay += interval;
	// setTimeout(function(){
	// 	document.getElementById("output").innerHTML += "<p><b>Step 8: Try reconnect</b></p><hr>";
	// 	test.initNetwork();
	// }, delay);
	// delay += interval;
	// setTimeout(function(){
	// 	document.getElementById("output").innerHTML += "<p><b>Step 9: Try make some move</b></p>";
	// 	test.sendToServer({type:"move", x: 51, y: 51});
	// }, delay);
	// delay += interval;
	// setTimeout(function(){
	// 	document.getElementById("output").innerHTML += "<p><b>Step 9: Try make some move again</b></p>";
	// 	test.sendToServer({type:"move", x: 51, y: 51});
	// }, delay);
	// delay += interval;




	$("#getAllSession").on("click", function(){
		test.sendToServer({type:"getAllPlayerStats"});
	});


	$("#testPing").on("click", function(){
		test.sendToServer({type:"test"});
	});




});
