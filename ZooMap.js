"use strict";

function ZooMap () {
	/* Public variables */
	this.cells;

	/* Contructor */
	this.cells = Array(Zoo.ZOO_WIDTH);

	/* Create a 2-dimensional array */
	for (var i = 0; i < Zoo.ZOO_WIDTH; i++) {
		this.cells[i] = Array(Zoo.ZOO_HEIGHT);
	}

	/*
	 * private method: randomType()
	 *
	 * take in the coordinates x, y and return the type of the cell at that coordinate
	 */
	var randomType = function (x, y) {
		/* Player's postions and adjacent cells must be empty */
		if ( (x == 0 && y == 0) || (x == 1 && y == 0) || (x == 0 && y == 1) ) // player at top left
			return 0;

		if ( (x == (Zoo.ZOO_WIDTH - 1) && y == 0) || (x == (Zoo.ZOO_WIDTH - 2) && y == 0) 
			|| (x == (Zoo.ZOO_WIDTH - 1) && y == 1) ) // player at top right
			return 0;

		if ( (x == 0 && y == (Zoo.ZOO_HEIGHT - 1)) || (x == 1 && y == (Zoo.ZOO_HEIGHT - 1)) 
			|| (x == 0 && y == (Zoo.ZOO_HEIGHT - 2)) ) // player at bottom left
			return 0;		

		if ( (x == (Zoo.ZOO_WIDTH - 1) && y == (Zoo.ZOO_HEIGHT - 1)) 
			|| (x == (Zoo.ZOO_WIDTH - 2) && y == (Zoo.ZOO_HEIGHT - 1)) 
			|| (x == (Zoo.ZOO_WIDTH - 1) && y == (Zoo.ZOO_HEIGHT - 2)) ) // player at bottom right
			return 0;
		/*** end checking player position ***/

		/* The cells with x and y are both odds are rocks */
		if (x % 2 && y % 2)
			return 2;

		/* Randomize the rest of the cell to be either empty or tree */
		if (Math.random() * 100 > Zoo.TREE_PERCENTAGE)
			return 0;	// an empty cell
		else
			return 1;
	}

	/*
	 * private method: randomItem()
	 *
	 * randomize the item
	 */
	var randomItem = function () {
		if (Math.random() * 100 > Zoo.ITEM_PERCENTAGE)
			return 0;									// no item
		else
			return Math.floor(Math.random() * 5 + 1);	// random item from 1 - 5
	}

	/* Initialize the cells */
	for (var x = 0; x < Zoo.ZOO_WIDTH; x++) {
		for (var y = 0; y < Zoo.ZOO_HEIGHT; y++) {
			this.cells[x][y] = new Cell(x, y, randomType(x, y), 0);	// initialize the cell with no item first
		}
	}

	/* Initialize the items */
	for (var x = 0; x < Zoo.ZOO_WIDTH; x++) {
		for (var y = 0; y < Zoo.ZOO_HEIGHT; y++) {
			if (this.cells[x][y].type == 1)				// if this cell is a tree
				this.cells[x][y].item = randomItem();	// reinitialize the items in this cell
		}
	}
}

/* For nodejs requirement */
global.ZooMap = ZooMap;