"use strict";

function TestClient() {
	// private variables
	var socket;         // socket used to connect to server
	var playerId;
	this.playerList = {};
	this.x;
	this.y;
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

				if(message.type!=="ping"){
					$("#output").prepend("<hr>incoming:<br><pre>"+JSON.stringify(message, null, 4)+"</pre>");
				}

				switch(message.type){
					case "newPlayerReply":
						playerId = message.playerId;
						$("#playerInfo").find(".player").eq(0).addClass("me").find(".id").html(playerId);
						$("#newPlayer").html("Success: new player created with id: " + playerId);
						break;
					case "ping":
						that.sendToServer(message);
						break;
					case "start":
						for(var i = 0; i<message.content.length; i++){
							var currentId = message.content[i].id;
							that.playerList[currentId] = {};
							that.playerList[currentId].x = message.content[i].spawnX;
							that.playerList[currentId].y = message.content[i].spawnY;
							$("#playerInfo").find(".player").eq(i).removeClass("me").find(".id").html(currentId);
							if(currentId === playerId){
								that.x = message.content[i].spawnX;
								that.y = message.content[i].spawnY;
								$("#playerInfo").find(".player").eq(i).addClass("me");
							}
						}
						that.refresh();
						break;
					case "update":
						var players = message.players;
						for(var key in players){
							if(players.hasOwnProperty(key)){
								that.playerList[key].x = players[key].x;
								that.playerList[key].y = players[key].y;
								that.playerList[key].isAlive = players[key].isAlive;
								if(key+"" === playerId+""){
									that.x = players[key].x;
									that.y = players[key].y;
								}
							}
						}
						that.refresh();
						break;
					default:
						break;
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

	this.refresh = function(){
		$("#playerInfo").find(".player").each(function(){
			var sid = $(this).find(".id").html();
			if(that.playerList[sid]!== undefined){
				$(this).find(".pos_x").val(that.playerList[sid].x);
				$(this).find(".pos_y").val(that.playerList[sid].y);
			}
		});
	}

	this.move = function(dir){
		this.sendToServer({type:"move", cellX: this.playerList[playerId].x, cellY: this.playerList[playerId].y, direction: dir});
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
if(location.host === ""){
	delay = 1000;
}
var interval = 600;
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
		avatarId = $.isNumeric(parseInt(avatarId))?avatarId:0;
		test.sendToServer({type:"playerReady", avatarId: avatarId});
	});

	$("#start").on("click", function(){
		test.sendToServer({type:"start"});
	});

	$(".bomb").on("click", function(){
		test.sendToServer({type:"plantBomb", x: test.x, y: test.y});
	});



	$("#auto").on("click", function(){
		automatedTest();
	});




	$(document).keydown(function(e){
	    if (e.keyCode == 37) {
	    	test.move("LEFT");
	       	return false;
	    }
	    if (e.keyCode == 38) {
	    	test.move("UP");
	       return false;
	    }
	    if (e.keyCode == 39) {
	    	test.move("RIGHT");
	       return false;
	    }
	    if (e.keyCode == 40) {
	    	test.move("DOWN");
	       return false;
	    }
	});

});

function delayCallback(callback){
	setTimeout(callback, delay);
	delay += interval;
}
function automatedTest(){

	delay = 50;
	delayCallback(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 3: Join a game rooms</b></p>";
		test.sendToServer({type:"setSession", sessionId:"100000"});
	});
	delayCallback(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 4: Start the game</b></p>";
		test.sendToServer({type:"start"});
	});
	delayCallback(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 5: Make some move</b></p>";
		test.move("UP");
	});
	delayCallback(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 6: Try disconnect</b></p><hr>";
		test.disconnectNetwork();
	});
	delayCallback(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 8: Try reconnect</b></p><hr>";
		test.initNetwork();
	});
	delayCallback(function(){
		test.move("UP");
	});
	delayCallback(function(){
		test.move("UP");
	});
	delayCallback(function(){
		test.move("UP");
	});
	delayCallback(function(){
		test.move("RIGHT");
	});
	delayCallback(function(){
		test.move("RIGHT");
	});
	delayCallback(function(){
		test.move("RIGHT");
	});
	delayCallback(function(){
		document.getElementById("output").innerHTML += "<p><b>Step 9: Try plant bomb</b></p>";
		test.sendToServer({type:"plantBomb", x: test.x, y: test.y});
	});



}





