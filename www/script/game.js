var model = {
	boardSize: 	 10, //both player and computer maps are 10x10
	shipTypes:   [5,4,3,3,2,1], //all ships with their sizes
	enemyShips:  [], //enemy ships on the map (Ship objects)
	playerShips: [], // player ships on the map (Ship objects)
	enemyBoard:  [[]], // matrix with enemy map states (hit, missed, ship)
	playerBoard: [[]] // matrix with player map states (hit, missed, ship, empty)
}

function Ship(size,player){
	this.size = size;
	this.locations = new Array(size);
	this.hits = new Array(size);
	this.sunk = false;
	this.player = player;
}

var view = {
	drawBoard: function(boardId){
		var board = document.getElementById(boardId); //container
		var table = document.createElement("table"); //table
		var placer = controller.shipPlacer();

		for (var i = 0; i < model.boardSize; i++) {
			var row = document.createElement("tr"); //table row
			row.setAttribute("class","boardRow");
			

			for (var j = 0; j < model.boardSize; j++) {
				var field = document.createElement("td");

				if(boardId == "enemyBoard"){//only enemy board is able to get hit
					field.setAttribute("class","boardField");
					field.setAttribute("id","e" + i + "" + j);
					field.onclick = controller.takeShot;
					field.innerHTML = i + "" + j;//test
				}else{
					field.setAttribute("class","empty"); //fields available for player's ships
					field.setAttribute("id", "p" + i + "" + j);
					field.innerHTML = i + "" + j;//test
					field.onclick = placer;
				}
				row.appendChild(field);
			}
			table.appendChild(row);
		}
		board.appendChild(table);
	},

	initBoards: function(board){ //set all fields on both maps to empty
		for(var row = 0; row < model.boardSize; row++){
			model.playerBoard[row] = (new Array(model.boardSize));
			model.enemyBoard[row] = (new Array(model.boardSize));
			for(var col = 0; col < model.boardSize; col++){
				model.playerBoard[row][col]="empty";
				model.enemyBoard[row][col]="empty";
			}
		}
	},

	redrawField: function(boardTag,location){
		var field = document.getElementById(boardTag+location);
		if(boardTag == "p"){
			field.setAttribute("class", model.playerBoard[location.charAt(0)][location.charAt(1)]);

		}else if(boardTag == "e"){
			field.setAttribute("class", model.enemyBoard[location.charAt(0)][location.charAt(1)]);
		}
		
	},

	updateShipsCounter: function(fieldsLeft, shipSize){ //displays ships fields left to set on players map
		var field = document.getElementById("shipCounter");
		if(fieldsLeft == 0 && shipSize == 0){
			field.innerHTML = "All ships are set";
		}else{
			field.innerHTML="Ship parts to place: " + fieldsLeft + "/" + shipSize;
		}
	}
}

var controller = {
	shotsFired: 0,
	enemyShots: [],

	takeShot: function(e,playerField){
		var location;
		var index;
		var ship;
		var hit = false;
		var ships;
		var board;

		if(playerField == undefined){
			controller.shotsFired++;
			e.target.onclick = null;
			ships = model.enemyShips;
			board = model.enemyBoard;
			location = e.target.id.substring(1);
			controller.enemyShot();
		}else{
			ships = model.playerShips;
			board = model.playerBoard;
			location = playerField;
		}

		for(var i = 0; i < ships.length; i++){
			ship = ships[i];

			index = ship.locations.indexOf(location);
			if(index >= 0){
				hit = true;
				ship.hits[index] = true;
				board[location.charAt(0)][location.charAt(1)] = "hit";
				controller.checkSunk(ship);
				break;
			}
		}

		if(!hit){
			board[location.charAt(0)][location.charAt(1)] = "miss";	
		}
		view.redrawField("e",location);
		view.redrawField("p",location);
	},

	enemyShot: function(){
		var row;
		var col;
		var loc;

		do{
			loc = controller.randomLocation();

		}while(controller.enemyShots.indexOf(loc) >= 0);
		
		controller.enemyShots.push(loc);
		controller.takeShot(null,loc);
	},
	
	randomLocation:function(){
		var row = Math.floor(Math.random() * (model.boardSize));
		var col = Math.floor(Math.random() * (model.boardSize));
		return row+""+col;
	},

	checkSunk: function(ship){
		var sunk = true;
		for(var i = 0; i < ship.size; i++){
			if(ship.hits[i] !== true){
				sunk = false;
				break;
			}
		}

		if(sunk){
			ship.sunk = true;
			if(ship.player == "p"){
				alert("Przeciwnik zatopił Twój statek");
			}else{
				alert("Trafiony zatopiony!");
			}

			controller.checkWinCondition();
		}


	},

	checkWinCondition: function(){
		var playerWin = true;
		var enemyWin = true;
		for(var i = 0; i < model.enemyShips.length; i++){
			if(!model.enemyShips[i].sunk){
				playerWin = false;
			}
			if(!model.playerShips[i].sunk){
				enemyWin = false;
			}
		}

		if(playerWin){
			alert("Wygrana! Liczba strzałów: " + controller.shotsFired);
		}else if(enemyWin){
			alert("Przegrałeś, przeciwnik zatopił wszystkie Twoje statki");
		}
	},

	generateEnemyShips: function(){
		var size;
		var ship;
		var direction;
		var row;
		var col;
		var loc;

		for(var i = 0; i < model.shipTypes.length; i++){
			size = model.shipTypes[i];
			ship = new Ship(size);
			direction = Math.floor(Math.random() * 2);


			do{
				loc = controller.randomLocation();

			}while(!controller.locationAvailable(loc,ship.size,direction,"e"))
				
			row = Number(loc.charAt(0));
			col = Number(loc.charAt(1));
			
			for(var j = 0; j < ship.size; j++){
				if(direction === 0){
					ship.locations[j] = (row + "" +(col +j));
					model.enemyBoard[row][col +j] = "enemyShip";
				}else{
					ship.locations[j] = ((row + j) + "" + col);
					model.enemyBoard[row + j][col] = "enemyShip";
				}
			}
			model.enemyShips.push(ship);
		}
	},
	
	shipPlacer: function(){ //creates function for empty field.onclick - place ship fields
		var size = model.shipTypes[model.playerShips.length]; //playerShips grows in size with each ship put on map
		if(size == undefined){
			view.updateShipsCounter(0,0);
			controller.allowGameStart();
			return null;
		}
		var ship = new Ship(size,"p");
		var fieldsPlaced = 0;
		var direction;
		
		view.updateShipsCounter(ship.size - fieldsPlaced, ship.size);

		var placer = function(e){
			
			if(model.playerShips.length == model.shipTypes.length){// all ships are put on the map
				return null;
			}
			
			var loc = e.target.id.substring(1); //charAt(0) is tag, 'p' for player, 'e' for computer
			
			if(ship.locations[0] == undefined){ 
				direction = -1; // first field, can be set almost everywhere

			}else if(ship.locations[1] == undefined){ //first field is put on map, now choose vetical or horizontal direction 
				var firstField = ship.locations[0];
				if(firstField.charAt(0) == loc.charAt(0)){ //common row, direction horizontal
					if(controller.locationAdjacent(loc,firstField,0)){ 
						direction = 0;
					}else{
						return;
					}
				}
				else if(firstField.charAt(1) == loc.charAt(1)){ //common col, direction verticals
					if(controller.locationAdjacent(loc,firstField,1)){ 
						direction = 1;
					}
					else{
						return;
					}
				}else{
					return;
				}
			}else{// first two fields are put on map, so direction is already known, every next field must be in the same direction
				var prevShip = ship.locations[fieldsPlaced-1];
				if(!controller.locationAdjacent(loc,prevShip,direction)){
					return;
				}
			}
			
			if(controller.locationAvailable(loc,size,direction,"p")){// place ship field on map if possible
				ship.locations[fieldsPlaced] = loc;
				model.playerBoard[loc.charAt(0)][loc.charAt(1)] = "ship";
				fieldsPlaced++;
				size--;
				e.target.onclick = null;

				view.redrawField("p",loc);
				view.updateShipsCounter(ship.size - fieldsPlaced, ship.size);
			}
			
			if(fieldsPlaced == ship.size){ //if all parts of this ship are put on map, generate next ship to place on map
				model.playerShips.push(ship);
				var emptyFields = document.getElementsByClassName("empty");
				var newPlacer = controller.shipPlacer();
				for(var i = 0; i < emptyFields.length; i++){
					emptyFields[i].onclick = newPlacer;
				}
			}
		}
		
		return placer;
	},

	locationAdjacent: function(location,relativeField,direction){
		var pos;
		if(direction == 0){
			pos = 1;
		}else{
			pos = 0;
		}
		return (relativeField.charAt(direction) == location.charAt(direction) //have to be in the same row or col
				&& (Number(location.charAt(pos)) - Number(relativeField.charAt(pos)) == 1)); // havet to be adjacent
	},

	locationAvailable: function(location,fieldsLeft,direction,player){
		var board;

		if(player == "p"){
			board = model.playerBoard;
		} else{
			board = model.enemyBoard;
		}

		var row = Number(location.charAt(0));
		var col = Number(location.charAt(1));

		return this.checkField(row,col,board,fieldsLeft,direction);
	},

	checkField: function(row,col,board,fieldsLeft,direction){
		var result = true;

		if(direction == -1){
			return controller.checkField(row,col,board,fieldsLeft,0) || controller.checkField(row,col,board,fieldsLeft,1);
		}

		if(direction == 0){
			if(col + fieldsLeft <= board.length){
				for(var i = 0; i < fieldsLeft; i++){
					if(board[row][col+i] !== "empty"){
						result = false;
						break;
					}
				}
			}else{
				result = false;
			}

		}else if(direction == 1){
			if(row + fieldsLeft <= board.length){
				for(var i = 0; i < fieldsLeft; i++){
					if(board[row+i][col] !== "empty"){
						result = false;
						break;
					}
				}
			}else{
				result = false;
			}
		}

		return result;
	},

	allowGameStart: function(){
		var startBtn = document.getElementById("startGame_btn");
		startBtn.style.visibility="visible";
		startBtn.onclick = controller.startGame;
	},

	startGame: function(){
		view.drawBoard("enemyBoard");
		controller.generateEnemyShips();
	}
}

function init(){
	view.initBoards();
	view.drawBoard("userBoard");
	view.updateShipsCounter(model.shipTypes[0],model.shipTypes[0]);
}

window.onload = init;
