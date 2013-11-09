"use strict";

function Cell(xPos, yPos, type, item) {
	/* Public variables */
	this.x;
	this.y;
	this.type;		// empty - 0, box - 1, rock - 2
	this.item;		// no item - 0, 1 - bomb range, 2 - haste, 3 - invunerable, 4 - more bombs, 5 - shakable
	this.hasBomb;	// if the cell is exploding by a bomb

	/* Constructor */
	this.x = xPos;
	this.y = yPos;
	this.type = type;
	this.hasBomb = false;
	this.item = item;
}

/* For nodejs requirement */
global.Cell = Cell;