"use strict";

function Bomb(type, playerId, xPos, yPos, range) {

	/* Public variables */
	this.type;
	this.range;
	this.playerId;		// which player own this bomb?
	this.isShakable;	// for detonation
	this.timer;			// timer in ms
	this.x;
	this.y;

	/* Constructor */
	var that = this;
	this.type = type;
	this.x = xPos;
	this.y = yPos;
	this.playerId = playerId;
	this.range = 3 || range;
	this.isShakable = false;
	this.timer = new Date().getTime();


	this.isExploded = function () {
		var now = new Date().getTime();

		if (now - this.timer >= 3000)
			return true; else
			return false;
	}

	// the following snippet defines an appropriate high resolution 
	// getTimestamp function depends on platform.
	if (typeof window === "undefined") {
		console.log("using process.hrtime()");
		var getTimestamp = function () {
			var t = process.hrtime();
			return t[0] * 1e3 + t[1] * 1.0 / 1e6
		}
	} else if (window.performance !== undefined) {
		if (window.performance.now) {
			console.log("using window.performence.now()");
			var getTimestamp = function () { return window.performance.now(); };
		} else if (window.performance.webkitNow) {
			console.log("using window.performence.webkitNow()");
			var getTimestamp = function () { return window.performance.webkitNow(); };
		}
	} else {
		console.log("using Date.now();");
		var getTimestamp = function () { return new Date().now(); };
	}
}

/* For nodejs require */
global.Bomb = Bomb;