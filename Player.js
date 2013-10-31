"use strict";

function Player(id, name, socket) {

	//
	//	Constructor
	//
	this.id = id;
	this.name = name;
	this.socket = socket;

	this.sessionId; // May change along playing

	//
	//	Updated before game start
	//
	this.avatarId = -1;

	//
	//	Init when game start
	//
	this.x;
	this.y;

	this.speed = 15;
	this.bombLeft = 3;
	this.isAlive = true;
	this.items = [0, 0, 0, 0, 0];

	this.getState = function () {
		return {
			id      : this.id,
			x		: this.x,
			y		: this.y,
			name    : this.name,
			avatarId: this.avatarId
		}
	}
}

global.Player = Player;