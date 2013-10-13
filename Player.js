"use strict";

function Player (sid, pid, xPos, yPos) {
	/* Public variables */
	this.sid;
	this.pid;
	this.xPos;
	this.yPos;

	this.avatarId;

	this.isAlive;
	this.speed;
	this.haste;
	this.invulnerable;
	this.disguise;
	this.bombLeft;

	/* Constructor */
	this.sid = sid;
	this.pid = pid;
	this.xPos = xPos;
	this.yPos = yPos;

	this.isAlive = true;
	this.speed = 5;			// default player speed
	this.haste = 0;
	this.invulnerable = 0;
	this.disguise = 0;
	this.bombLeft = 3;

	this.avatarId = 0;

}

global.Player = Player;