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
	this.gameClock = 0;
	this.subjectId = id;
	this.playerList = {};
	this.readyForAction = true;
	this.shouldPrint = shouldPrint;

	this.sendToServer = function (msg) {
		if (playerId !== undefined) {
			msg.playerId = playerId;
			msg.delay = that.delay;
		}
		if (msg.type !== "ping") {
			//$("#output").prepend("<hr>outgoing:<br><pre>" + JSON.stringify(msg, null, 4) + "</pre>");
		}
		socket.send(JSON.stringify(msg));
	}

	this.initNetwork = function () {
		// Attempts to connect to game server
		try {
			if (location.host !== "") {
				//socket = new SockJS("http://" + location.host + ":" + Zoo.PORT + "");
				socket = new SockJS("http://" + Zoo.SERVER_NAME + ":" + Zoo.PORT + "");
			} else {
				socket = new SockJS("http://localhost:" + Zoo.PORT + "");
			}
			socket.onmessage = function (e) {
				var message = JSON.parse(e.data);

				if (message.type !== "ping" && message.type !== "") {
					//$("#output").prepend("<hr>incoming:<br><pre>"+JSON.stringify(message, null, 4)+"</pre>");
					if (that.shouldPrint) {
						message.zooMap = undefined;
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
									if ((that.x + "").match(/^\d+$/) && (that.y + "").match(/^\d+$/)) {
										that.readyForAction = true;
									}
									if (!players[key].isAlive) {
										$("#output").prepend("<hr><h3>Player " + playerId + " is killed!</h3>");
										socket.close();
									}
								}
								that.gameClock = message.timestamp - that.serverTime;
								var delay = ((message.timestamp - that.serverTime) - (new Date().getTime() - that.localTime)) - message.serverDelay;
								if (delay > 0) {
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
	};

	this.setSession = function (sid) {
		that.sendToServer({
			type: "setSession",
			sessionId: sid
		});
	};

	this.ready = function (avatarId) {
		that.sendToServer({
			type: "playerReady",
			avatarId: avatarId
		});
	};

	this.start = function () {
		that.sendToServer({
			type: "start"
		});
	};

	this.move = function (dir) {
		that.sendToServer({
			type     : "move",
			cellX    : that.x,
			cellY    : that.y,
			direction: dir
		});
	};

	this.bomb = function () {
		that.sendToServer({
			type: "plantBomb",
			x   : that.x,
			y   : that.y
		});
	};

	this.refresh = function () {
		$("#playerInfo").find(".player").each(function () {
			var sid = $(this).attr("playerId");
			if (that.playerList[sid] !== undefined) {
				$(this).find(".pos_x").val(that.playerList[sid].x);
				$(this).find(".pos_y").val(that.playerList[sid].y);
			}
		});
	};

	this.init = function (delay) {
		// Initialize network and GUI
		this.initNetwork();
		delay = (delay===undefined)?0:delay;
		setTimeout(function () {
			that.sendToServer({
				type: "newPlayer",
				playerName: "TestPlayer-" + Math.floor((Math.random() * 10)),
				secret: Zoo.SECRET_KEY
			});
		}, delay);
	};
}

var interval = 600;
var textColor = ["red", "green", "orange", "blue"];

//  Regression test
//var testMove = ["UP RIGHT UP RIGHT UP RIGHT",
//                "UP LEFT UP LEFT UP LEFT",
//                "DOWN RIGHT DOWN RIGHT DOWN RIGHT",
//                "DOWN LEFT DOWN LEFT DOWN LEFT"];

//  Concective explode test
//var testMove = ["RIGHT BOMB RIGHT BOMB RIGHT BOMB UP",
//                "",
//                "",
//                ""];

//  Explode with no hit
var testMove = ["RIGHT BOMB RIGHT BOMB", "", "", ""];


var testSubject = [];



$(document).ready(function () {

	var delay = 3000;
	if (location.host === "") {
		delay = 1000;
	}


	$(".createPlayer").on("click", function () {
		console.log($(this).attr("player"));
		if ($(this).attr("player") === "all") {
			for (var i = 0; i < 4; i++) {
				if (i === 0) {
					testSubject.push(new TestClient(i, true));
				} else {
					testSubject.push(new TestClient(i, false));
				}
				testSubject[i].init(50 * i + delay);
			}
		} else {
			testSubject.push(new TestClient(testSubject.length, false));
			testSubject[testSubject.length - 1].init(delay);
		}
	});
	$(".getAllPlayer").on("click", function () {
		testSubject[0].sendToServer({type: "getAllPlayerStats"});
	});
	$(".getAllSession").on("click", function () {
		testSubject[0].sendToServer({type: "getAllSession"});
	});
	$(".setAllSession").on("click", function () {
		var sid = $("#sessionId").val();
		if ($.isNumeric(sid)) {
			for (var i = 0; i < testSubject.length; i++) {
				testSubject[i].setSession(sid);
			}
		}
	});
	$(".readyAll").on("click", function () {
		for (var i = 0; i < testSubject.length; i++) {
			testSubject[i].ready(i);
		}
	});


	// Full user control
	$(".setSession").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");
		var sid = $(this).parent(".player").find(".sessionId").val();
		if ($.isNumeric(sid)) {
			testSubject[subjectId].setSession(sid);
		}
	});
	$(".ready").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");
		var avatarId = $("#avatarId").val();
		avatarId = $.isNumeric(parseInt(avatarId)) ? avatarId : 0;
		testSubject[subjectId].ready(avatarId);
	});
	$(".start").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");
		testSubject[subjectId].start();
	});
	$(".bomb").on("click", function () {
		var subjectId = $(this).parent(".player").attr("subjectId");
		testSubject[subjectId].bomb();
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


	// For auto testing
	$(".auto").on("click", function () {
		testSubject[0].sendToServer({type: "setSession", sessionId: "100000"});
		testSubject[0].sendToServer({type: "start"});
		automatedTestFor(0, 50, "UP RIGHT UP RIGHT");
	});
	$(".autoAll").on("click", function () {
		var sid = $("#sessionId").val();
		var delay = 3000;
		if (location.host === "") {
			delay = 1000;
		}
		for (var i = 0; i < 4; i++) {
			if (i === 0) {
				testSubject.push(new TestClient(i, true));
			} else {
				testSubject.push(new TestClient(i, false));
			}
			testSubject[i].init(50 * i + delay);
		}
		delay = delayCallback(function () {
			for (var i = 0; i < testSubject.length; i++) {
				testSubject[i].sendToServer({type: "setSession", sessionId: sid});
			}
		}, delay);
		delay = delayCallback(function () {
			for (var i = 0; i < testSubject.length; i++) {
				testSubject[i].sendToServer({type: "playerReady", avatarId: i});
			}
		}, delay);
		delay = delayCallback(function () {
			testSubject[0].sendToServer({type: "start"});
		}, delay);
		delay = delayCallback(function () {
			for (var i = 0; i < testSubject.length; i++) {
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
	moveSequence = moveSequence.split(" ");
	setTimeout(makeAction, initialDelay, subjectId, moveSequence, 0);
}

var deafaultDelay = 100;
function makeAction(subjectId, moveSequence, index) {
	if (moveSequence.length > 0) {
		var cp = testSubject[subjectId];
		if (cp.readyForAction) {
			var dir = moveSequence[index];
			console.log(moveSequence[index]);
			if (dir === "BOMB") {
				cp.bomb();
				console.log("[" + subjectId + "]" + " plantBomb at " + cp.gameClock);
			} else if (dir === "UP" || dir === "DOWN" || dir === "LEFT" || dir === "RIGHT") {
				cp.move(dir);
				cp.readyForAction = false;
				console.log("[" + subjectId + "]" + " move " + dir + " from (" + cp.x + "," + cp.y + ") at " + cp.gameClock);
			}
			setTimeout(makeAction, interval, subjectId, moveSequence, index + 1);
		} else {
			console.log("Player haven't finish last action!");
			setTimeout(makeAction, deafaultDelay, subjectId, moveSequence, index);
		}
	}
}




