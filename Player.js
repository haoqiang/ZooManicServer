"use strict";

function Player(id, socket) {


	//
	//	Constructor
	//
	this.id = id;
	this.name = "new player";
	this.avatarId = -1;
	this.socket = socket;
	this.sessionId;



	//
	//	Init when game start
	//
	this.x;
	this.y;

	this.isAlive = true;
	this.speed = 5;			// default player speed
	this.haste = 0;
	this.invulnerable = 0;
	this.disguise = 0;
	this.bombLeft = 3;


	this.getState = function () {
		return {
			id      : this.id,
			name    : this.name,
			avatarId: this.avatarId
		}
	}
}

global.Player = Player;