"use strict";

function Bomb(type, playerId) {

	/* Public variables */
	this.type;
	this.range;			
	this.playerId;		// which player own this bomb?
	this.isShakable;	// for detonation
	this.timer;			// timer in ms

	/* Constructor */
	var that = this;
	this.type = type;
	this.playerId = playerId;
	this.range = 3;
	this.isShakable = false;
	this.timer = 3000;

}

/* For nodejs require */
global.Bomb = Bomb;