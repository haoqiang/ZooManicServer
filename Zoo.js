var Zoo = {
	TREE_PERCENTAGE: 5,	// percentage of trees in the map
	ITEM_PERCENTAGE: 5,	// percentage of items over the tree
	ZOO_WIDTH      : 16,			// number of horizontal cells
	ZOO_HEIGHT     : 11,		// number of vertical cells
	CELL_WIDTH     : 8.0,		// width of a cell in px
	CELL_HEIGHT    : 8.0,		// height of a cell in px
	FRAME_RATE     : 25,		// frame rate of the game
	PORT           : 5000,
	SERVER_IP      : '54.225.24.113',
	//SERVER_NAME : "localhost"
	SERVER_NAME    : "ec2-54-225-24-113.compute-1.amazonaws.com"
}

/* For nodejs requirement */
global.Zoo = Zoo;