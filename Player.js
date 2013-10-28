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
	this.items;



	//
	//	Init when game start
	//
	this.x;
	this.y;

	this.isAlive = true;
	this.speed = 15;			// default player speed
	this.items = [0, 0, 0, 0, 0];
	this.bombLeft = 3;


	this.getState = function () {
		return {
			id      : this.id,
			name    : this.name,
			x		: this.x,
			y		: this.y,
			avatarId: this.avatarId
		}
	}
}

global.Player = Player;