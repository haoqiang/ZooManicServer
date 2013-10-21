"use strict";

function Player(id, socket) {


	//
	//	Constructor
	//
	this.id = id;
	this.name = "unset";
	this.socket = socket;
	this.sessionId;



	//
	//	Init when game start
	//
//	this.xPos = xPos;
//	this.yPos = yPos;

	this.isAlive = true;
	this.speed = 5;			// default player speed
	this.haste = 0;
	this.invulnerable = 0;
	this.disguise = 0;
	this.bombLeft = 3;

	this.avatarId = 0;

	this.getState = function () {
		return {
			id      : this.id,
			name    : this.name,
			avatarId: this.avatarId
		}
	}
}

global.Player = Player;