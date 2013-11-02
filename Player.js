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

	this.isMoving = false;
	this.direction;

	this.speed = 15;
	this.cellSpeed = this.speed / Zoo.CELL_WIDTH / Zoo.FRAME_RATE; // cell distance per frame
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

	this.moveOneStep = function () {
		if (isMoving == false)
			return;

		var oldPosX = this.x;
		var oldPosY = this.y;

		switch (this.direction) {
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