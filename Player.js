"use strict";

function Player(id, name, socket) {

	//
	//	Constructor
	//
	this.id = id;
	this.name = name;
	this.delay;
	this.socket = socket; // May change along playing

	//
	//	Updated before game start,
	//  When player first joi
	//
	this.sessionId;
	this.avatarId = -1;

	//
	//	Init when game start
	//
	this.x;
	this.y;
	this.direction;
	this.speed = 15;
	this.bombLeft = 3;
	this.isAlive = false;
	this.items = [0, 0, 0, 0, 0];


	//
	//	Init when send out update
	//
	this.getState = function () {
		return {
			id        : this.id,
			name      : this.name,
			delay     : this.delay,
			isAlive   : this.isAlive,
			avatarId  : this.avatarId,
			sessionId : this.sessionId
		}
	}

	this.getPosition = function(){
		return{
			id : this.id,
			x: this.x,
			y: this.y,
			direction: this.direction
		}
	}
}

global.Player = Player;