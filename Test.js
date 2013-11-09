"use strict";


function TestClient(id, shouldPrint) {

	// private variables
	var socket;         // socket used to connect to server
	var playerId;
	var that = this;

	// public
	this.x;
	this.y;
	this.delay = 0;
	this.localTime = 0;
	this.serverTime = 0;
	this.subjectId = id;
	this.playerList = {};
	this.shouldPrint = shouldPrint;

	this.sendToServer = function (msg) {
		if (playerId !== undefined) {
			msg.playerId = playerId;
			msg.delay = that.delay;
		}
		if (msg.type !== "ping") {
			$("#output").prepend("<hr>outgoing:<br><pre>" + JSON.stringify(msg, null, 4) + "</pre>");
		}
		socket.send(JSON.stringify(msg));
	}

	this.initNetwork = function () {
		// Attempts to connect to game server
		try {
			if (location.host !== "") {
				socket = new SockJS("http://" + location.host + ":" + Zoo.PORT + "");
				//socket = new SockJS("http://" + Zoo.SERVER_NAME + ":" + Zoo.PORT + "");
			} else {
				socket = new SockJS("http://localhost:" + Zoo.PORT + "");
			}
			socket.onmessage = function (e) {
				var message = JSON.parse(e.data);

				if (message.type !== "ping" && message.type !== "") {
					//$("#output").prepend("<hr>incoming:<br><pre>"+JSON.stringify(message, null, 4)+"</pre>");
					if (that.shouldPrint) {
						console.log("[" + playerId + "] incoming:" + JSON.stringify(message, null, 4));
					}
				}

				switch (message.type) {
					case "newPlayerReply":
						playerId = message.playerId;
						$("#gameControl").find(".player").eq(that.subjectId).addClass("player" + playerId).attr("playerId", playerId).attr("subjectId", that.subjectId).find(".id").css({"color": textColor[that.subjectId]}).html(playerId);
						$("#playerInfo").find(".player").eq(that.subjectId).addClass("player" + playerId).attr("playerId", playerId).attr("subjectId", that.subjectId).find(".id").css({"color": textColor[that.subjectId]}).html(playerId);
						$("#newPlayer").append("<br>Success: new player created with id: " + playerId);
						break;
					case "ping":
						that.sendToServer(message);
						break;
					case "start":
						that.serverTime = message.startTime;
						that.localTime = new Date().getTime();
						for (var i = 0; i < message.content.length; i++) {
							var currentId = message.content[i].id;
							that.playerList[currentId] = {};
							that.playerList[currentId].x = message.content[i].spawnX;
							that.playerList[currentId].y = message.content[i].spawnY;
							$("#playerInfo").find(".player" + playerId).find(".id").html(currentId).append(" started!");
							if (currentId === playerId) {
								that.x = message.content[i].spawnX;
								that.y = message.content[i].spawnY;
							}
						}
						that.refresh();
						break;
					case "update":
						var players = message.players;
						for (var key in players) {
							if (players.hasOwnProperty(key)) {
								that.playerList[key].x = players[key].x;
								that.playerList[key].y = players[key].y;
								that.playerList[key].isAlive = players[key].isAlive;
								if (key + "" === playerId + "") {
									that.x = players[key].x;
									that.y = players[key].y;
									if (!players[key].isAlive && key !== playerId) {
										socket.close();
										$("#output").prepend("<h3>Player "+playerId+" is killed!</h3>");
									}
								}
								var delay = ((message.timestamp - that.serverTime) - (new Date().getTime() - that.localTime));
								if(delay > 0){
									that.delay = delay;
								}

//								if (that.shouldPrint) {
//									console.log("[" + playerId + "] server game clock: " + (message.timestamp - that.serverTime));
//									console.log("[" + playerId + "] local game clock: " + (new Date().getTime() - that.localTime));
//									console.log("[" + playerId + "] delay: " + ((message.timestamp - that.serverTime) - (new Date().getTime() - that.localTime)));
//								}

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

	this.refresh = function () {
		$("#playerInfo").find(".player").each(function () {
			var sid = $(this).attr("playerId");
			if (that.playerList[sid] !== undefined) {
				$(this).find(".pos_x").val(that.playerList[sid].x);
				$(this).find(".pos_y").val(that.playerList[sid].y);
			}
		});
	}

	this.move = function (dir) {
		this.sendToServer({type: "move", cellX: this.x, cellY: this.y, direction: dir});
	}

	this.start = function () {

		// Initialize network and GUI
		this.initNetwork();
		var delay = 3000;
		if (location.host === "") {
			delay = 1000;
		}
		setTimeout(function () {
			that.sendToServer({type: "newPlayer", playerName: "TestPlayer-" + Math.floor((Math.random() * 10)) });
		}, delay + 10 * that.subjectId);
	}
}

var interval = 2000;



var textColor = ["red", "green", "orange", "blue"];
var testMove = ["UP RIGHT UP RIGHT UP RIGHT", "UP LEFT UP LEFT UP LEFT", "DOWN RIGHT DOWN RIGHT DOWN RIGHT",
                "DOWN LEFT DOWN LEFT DOWN LEFT"];


var testSubject = [];
var testSubjectSize = 4;

for (var i = 0; i < testSubjectSize; i++) {
	if(i===0){
		testSubject.push(new TestClient(i, true));
	} else {
		testSubject.push(new TestClient(i, false));
	}
	testSubject[i].start();
}

$(document).ready(function () {

	$(".getAllPlayer").on("click", function () {
		testSubject[0].sendToServer({type: "getAllPlayerStats"});
	});

	$(".getAllSession").on("click", function () {
		testSubject[0].sendToServer({type: "getAllSession"});
	});

	$(".setAllSession").on("click", function () {
		var sid = $("#sessionId").val();
		if ($.isNumeric(sid)) {
			for (var i = 0; i < testSubjectSize; i++) {
				testSubject[i].sendToServer({type: "setSession", sessionId: sid});
			}
		}
	});

	$(".readyAll").on("click", function () {
		for (var i = 0; i < testSubjectSize; i++) {
			testSubject[i].sendToServer({type: "playerReady", avatarId: i});
		}
	});

	$(".setSession").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");

		var sid = $(this).parent(".player").find(".sessionId").val();
		if ($.isNumeric(sid)) {
			testSubject[subjectId].sendToServer({type: "setSession", sessionId: sid});
		}
	});

	$(".ready").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");
		var avatarId = $("#avatarId").val();
		avatarId = $.isNumeric(parseInt(avatarId)) ? avatarId : 0;

		testSubject[subjectId].sendToServer({type: "playerReady", avatarId: avatarId});
	});

	$(".start").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");

		testSubject[subjectId].sendToServer({type: "start"});
	});

	$(".bomb").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");

		testSubject[subjectId].sendToServer({type: "plantBomb", x: testSubject[subjectId].x, y: testSubject[subjectId].y});
	});


	$(".up").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");

		testSubject[subjectId].move("UP");
	});

	$(".left").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");

		testSubject[subjectId].move("LEFT");
	});

	$(".down").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");

		testSubject[subjectId].move("DOWN");
	});

	$(".right").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");

		testSubject[subjectId].move("RIGHT");
	});



	$(".auto").on("click", function () {
		testSubject[0].sendToServer({type: "setSession", sessionId: "100000"});
		testSubject[0].sendToServer({type: "start"});
		automatedTestFor(0, 50, "UP RIGHT UP RIGHT");
	});
	$(".autoAll").on("click", function () {
		var sid = $("#sessionId").val();
		var delay = 0;
		delay = delayCallback(function () {
			for (var i = 0; i < testSubjectSize; i++) {
				testSubject[i].sendToServer({type: "setSession", sessionId: sid});
			}
		}, delay);
		delay = delayCallback(function () {
			for (var i = 0; i < testSubjectSize; i++) {
				testSubject[i].sendToServer({type: "playerReady", avatarId: i});
			}
		}, delay);
		delay = delayCallback(function () {
			testSubject[0].sendToServer({type: "start"});
		}, delay);
		delay = delayCallback(function () {
			for (var i = 0; i < testSubjectSize; i++) {
				automatedTestFor(i, 50 * i, testMove[i]);
			}
		}, delay);
	});
});

function delayCallback(callback, delay) {
	setTimeout(callback, delay);
	return delay + interval;
}

function automatedTestFor(subjectId, initialDelay, moveSequence) {

	var delay = initialDelay;
	moveSequence = moveSequence.split(" ");


	for (var i = 0; i < moveSequence.length; i++) {
		var dir = moveSequence[i];
		setTimeout(function (dir, i) {
			//console.log("testSubject" +i+" move " + dir+". ");
			testSubject[subjectId].move(dir);
		}, delay, dir, subjectId);
		delay += interval;
	}
	delayCallback(function () {
		testSubject[subjectId].sendToServer({type: "plantBomb", x: testSubject[subjectId].x, y: testSubject[subjectId].y});
	}, delay);

}





