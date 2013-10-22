"use strict";

function TestClient() {
	// private variables
	var socket;         // socket used to connect to server


	/*
	 * private method: sendToServer(msg)
	 *
	 * The method takes in a JSON structure and send it
	 * to the server, after converting the structure into
	 * a string.
	 */
	this.sendToServer = function (msg) {
		document.getElementById("output").innerHTML += "<hr>outgoing:<br><pre>"+JSON.stringify(msg, null, 4)+"</pre>";
		socket.send(JSON.stringify(msg));

	}

	/*
	 * private method: initNetwork(msg)
	 *
	 * Connects to the server and initialize the various
	 * callbacks.
	 */
	var initNetwork = function () {
		// Attempts to connect to game server
		try {
			console.log("http://" + Zoo.SERVER_NAME + ":" + Zoo.PORT + "/zoo");
			socket = new SockJS("http://" + Zoo.SERVER_NAME + ":" + Zoo.PORT + "/zoo");
			socket.onmessage = function (e) {
				var message = JSON.parse(e.data);


				document.getElementById("output").innerHTML += "<hr>incoming:<br><pre>"+JSON.stringify(message, null, 4)+"</pre>";

				// switch (message.type) {
				// case "message":
				//     appendMessage("serverMsg", message.content);
				//     break;
				// case "update":
				//     ball.x = message.ballX;
				//     ball.y = message.ballY;
				//     myPaddle.x = message.myPaddleX;
				//     myPaddle.y = message.myPaddleY;
				//     opponentPaddle.x = message.opponentPaddleX;
				//     opponentPaddle.y = message.opponentPaddleY;
				//     break;
				// default:
				//     appendMessage("serverMsg", "unhandled message type " + message.type);
				//}
			}
		} catch (e) {
			console.log("Failed to connect");
		}
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
		initNetwork();
	}
}


var test = new TestClient();
test.start();

setTimeout(function(){
	// first set names
	test.sendToServer({type:"setProperty", properties:{name: "a", age: 7}});
	// get game rooms
	test.sendToServer({type:"getSession"});
	// join a room
	test.sendToServer({type:"selectSession", sessionId:"100000"});
	// see the changes
	test.sendToServer({type:"getSession"});

	// try start
	test.sendToServer({type:"start"});
	//test.sendToServer({type:"move"});
	test.sendToServer({type:"plantBomb", x: 0, y: 0});

}, 500);