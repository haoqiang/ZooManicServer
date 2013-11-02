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

	this.isMoving = false;
	this.speed = 15;
	this.cellSpeed = this.speed / Zoo.CELL_WIDTH / Zoo.FRAME_RATE; // cell distance per frame
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

	this.moveOneStep = function (direction) {
		if (isMoving == false)
			return;

		var oldPosX = this.x;
		var oldPosY = this.y;

		switch (direction) {
			case "UP":
				this.y += this.cellSpeed;
				if (this.y >= Math.ceil(oldPosY))		// moved to the next cell
					isMoving = false;
				break;

			case "DOWN":
				this.y -= this.cellSpeed;
				if (this.y >= Math.floor(oldPosY))		// moved to the next cell
					isMoving = false;
				break;

			case "LEFT":
				this.x -= this.cellSpeed;
				if (this.x >= Math.floor(oldPosX))		// moved to the next cell
					isMoving = false;
				break;

			case "RIGHT":
				this.x += this.cellSpeed;
				if (this.x >= Math.ceil(oldPosX))		// moved to the next cell
					isMoving = false;
				break;
			
			default: 
				console.log("Unhanled movement");
		}
	}
}

global.Player = Player;