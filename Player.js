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

	this.speed = 30;
	this.cellSpeed = this.speed / Zoo.CELL_WIDTH / Zoo.FRAME_RATE; // cell distance per frame
	this.bombLeft = 3;
	this.isAlive = true;
	this.bombRange = 3;
	this.items = [0, 0, 0, 0, 0, 0];
	
	this.invunerable = 0;
	this.invunerable_timestamp;

	this.moreBomb = 0;
	this.moreBomb_timestamp;

	this.moreRange = 0;
	this.moreRange_timestamp;

	this.haste = 0;
	this.haste_timestamp;

	this.shakable = 0;
	this.shakable_timestamp;

	this.kill = 0;

	this.checkInvunerable = function () {
		if (!this.invunerable)
			return 0;

		var now = new Date().getTime();
		if (now - this.invunerable_timestamp >= 5000) {
			this.invunerable = 0;
			this.items[3] = 0
			return false; 
		}
		else 
			return true;
	}

	this.checkHaste = function () {
		if (!this.haste)
			return 0;

		var now = new Date().getTime();
		if (now - this.haste_timestamp >= 10000) {
			this.haste = 0;
			this.speed = 30;
			this.items[2] = 0;
			return false; 
		}
		else 
			return true;
	}

	this.checkMoreBomb = function () {
		if (!this.moreBomb)
			return 0;

		var now = new Date().getTime();
		if (now - this.moreBomb_timestamp >= 10000) {
			this.moreBomb = 0;
			this.bombLeft -= 3;
			this.items[4] = 0;
			return false; 
		}
		else 
			return true;
	}

	this.checkMoreRange = function () {
		if (!this.moreRange)
			return 0;

		var now = new Date().getTime();
		if (now - this.moreRange_timestamp >= 10000) {
			this.moreRange = 0;
			this.bombRange = 3;
			this.items[1] = 0;
			return false; 
		}
		else 
			return true;
	}

	this.checkShakable = function () {
		if (!this.shakable)
			return 0;

		var now = new Date().getTime();
		if (now - this.shakable_timestamp >= 10000) {
			this.shakable = 0;
			this.items[5] = 0;
			return false; 
		}
		else 
			return true;
	}




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