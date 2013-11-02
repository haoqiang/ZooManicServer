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
		if(msg.type!=="ping"){
			$("#output").prepend("<hr>outgoing:<br><pre>"+JSON.stringify(msg, null, 4)+"</pre>");
		}
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
			if(location.host !== ""){
				socket = new SockJS("http://"+location.host+":" + Zoo.PORT + "");
				//socket = new SockJS("http://" + Zoo.SERVER_NAME + ":" + Zoo.PORT + "");
			}else{
				socket = new SockJS("http://localhost:" + Zoo.PORT + "");
			}
			socket.onmessage = function (e) {
				var message = JSON.parse(e.data);

				if(message.type==="newPlayerReply"){
					playerId = message.playerId;
					$("#newPlayer").html("Success: new player created with id: " + playerId);
				}else if(message.type!=="update" && message.type!=="ping"){
					$("#output").prepend("<hr>incoming:<br><pre>"+JSON.stringify(message, null, 4)+"</pre>");
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

var delay = 3000;
var interval = 500;
var test = new TestClient();
test.start();
setTimeout(function(){
	test.sendToServer({type:"newPlayer", playerName: "TestPlayer-"+Math.floor((Math.random()*100)+1) });
}, delay);


$(document).ready(function(){

	$("#getAllPlayer").on("click", function(){
		test.sendToServer({type:"getAllPlayerStats"});
	});

	$("#getAllSession").on("click", function(){
		test.sendToServer({type:"getAllSession"});
	});

	$("#setSession").on("click", function(){
		var sid = $("#sessionId").val();
		if($.isNumeric(sid)){
			test.sendToServer({type:"setSession", sessionId: sid});
		}
	});

	$("#ready").on("click", function(){
		var avatarId = $("#avatarId").val();
		avatarId = $.isNumeric(avatarId)?avatarId:0;
		test.sendToServer({type:"playerReady", avatarId: avatarId});
	});

	$("#start").on("click", function(){
		test.sendToServer({type:"start"});
	});

	$("#move").on("click", function(){
		test.sendToServer({type:"move", x: 5, y: 5});
	});



});

function automatedTest(){

	delay += interval;
	setTimeout(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 2: Get all available game rooms</b></p>";
		test.sendToServer({type:"getAllSession"});
	}, delay);
	delay += interval;
	setTimeout(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 3: Join a game rooms</b></p>";
		test.sendToServer({type:"setSession", sessionId:"100000"});
	}, delay);
	delay += interval;
	setTimeout(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 4: Start the game</b></p>";
		test.sendToServer({type:"start"});
	}, delay);
	delay += interval;
	setTimeout(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 5: Make some move</b></p>";
		test.sendToServer({type:"move", x: 5, y: 5});
	}, delay);
	delay += interval;
	setTimeout(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 6: Try disconnect</b></p><hr>";
		test.disconnectNetwork();
	}, delay);
	delay += interval;
	setTimeout(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 8: Try reconnect</b></p><hr>";
		test.initNetwork();
	}, delay);
	delay += interval;
	setTimeout(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 9: Try make some move</b></p>";
		test.sendToServer({type:"move", x: 51, y: 51});
	}, delay);
	delay += interval;
	setTimeout(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 9: Try make some move again</b></p>";
		test.sendToServer({type:"move", x: 51, y: 51});
	}, delay);
	delay += interval;
}