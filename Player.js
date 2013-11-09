"use strict";

function Player(id, name, socket, type) {

	//
	//	Constructor
	//
	this.id = id;
	this.name = name;
	this.type = type;
	this.delay;
	this.lastPing;
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
	this.spawnX;
	this.spawnY;

	this.isMoving = false;
	this.direction;

	this.speed = 15;
	this.cellSpeed = this.speed / Zoo.CELL_WIDTH / Zoo.FRAME_RATE; // cell distance per frame
	this.bombLeft = 3;
	this.isAlive = true;
	this.bombRange = 3;
	this.items = [0, 0, 0, 0, 0];


	//
	//	Init when send out update
	//
	this.getState = function () {
		return {
			id       : this.id,
			name     : this.name,
			delay    : this.delay,
			isAlive  : this.isAlive,
			avatarId : this.avatarId,
			spawnX   : this.spawnX,
			spawnY   : this.spawnY,
			sessionId: this.sessionId
		}
	}

	this.getPosition = function () {
		return{
			id       : this.id,
			x        : this.x,
			y        : this.y,
			direction: this.direction
		}
	}

	this.moveOneStep = function () {
		if (this.isMoving == false)
			return;

		var oldPosX = this.x;
		var oldPosY = this.y;

		switch (this.direction) {
			case "UP":
				this.y += this.cellSpeed;
				if (this.y >= Math.floor(oldPosY + 1)) {		// moved to the next cell
					this.isMoving = false;
					this.y = Math.round(this.y);
				}
				break;

			case "DOWN":
				this.y -= this.cellSpeed;
				if (this.y <= Math.ceil(oldPosY - 1)) {	// moved to the next cell
					this.isMoving = false;
					this.y = Math.round(this.y);
				}
				break;

			case "LEFT":
				this.x -= this.cellSpeed;
				if (this.x <= Math.ceil(oldPosX - 1)) {	// moved to the next cell
					this.isMoving = false;
					this.x = Math.round(this.x);
				}
				break;

			case "RIGHT":
				this.x += this.cellSpeed;
				if (this.x >= Math.floor(oldPosX + 1)) {		// moved to the next cell
					this.isMoving = false;
					this.x = Math.round(this.x);
				}
				break;

			default:
				console.log("Unhanled movement");
		}
	}
}

global.Player = Player;