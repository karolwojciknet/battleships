var model = {
	boardSize: 10,
	shipTypes: [5,4,3,3,2,1],
	enemyShips: [],
	playerShips: [],
}

function Ship(size){
	this.size = size;
	this.locations = new Array(size);
	this.hits = new Array(size);
	this.sunk = false;
}

var view = {
	drawBoard: function(boardId){
		var board = document.getElementById(boardId); //container
		var table = document.createElement("table"); //table
		var shipPlacer = controller.shipPlacer();
		for (var i = 0; i < model.boardSize; i++) {
			var row = document.createElement("tr"); //table row
			row.setAttribute("class","boardRow");
			

			for (var j = 0; j < model.boardSize; j++) {
				var field = document.createElement("td"); //td
				if(boardId == "enemyBoard"){//only enemy board is able to get hit
					field.setAttribute("class","boardField");
					field.setAttribute("id", i + "" + j);
					field.onclick = controller.shot;
				}else{
					field.setAttribute("class","empty");
					field.setAttribute("id", "p" + i + "" + j);
					field.onclick = shipPlacer;
				}
				row.appendChild(field);
			}
			table.appendChild(row);
		}
		board.appendChild(table);
	}
}

var controller = {
	shotsFired: 0,
	playerShipsPlaced: 0,

	markPossibleShipFields: function(){
		var emptyFields = document.getElementsByClassName("empty");

		if(controller.playerShipsPlaced == model.shipTypes.length){
			return;
		}
		var shipPlacer = controller.shipPlacer();
		for(var i = 0; i < emptyFields.length; i++){
			var field = emptyFields[i];
			field.onclick = shipPlacer;
		}
	},

	shipPlacer: function(){
		var ship = new Ship(model.shipTypes[controller.playerShipsPlaced]);
		console.log("tworze placer dla rozmiaru " + ship.size);
		var fieldsLeft = ship.size;

		var placeField = function(e){

			var location = e.target.id;
			// console.log(location);
			if(fieldsLeft > 0){
				if(!controller.placeAvaible(location,ship)){
					return;
				}
				var field = document.getElementById(location);
				field.setAttribute("class","ship");
				ship.locations[ship.locations.length- fieldsLeft] = location;
				fieldsLeft--;
				field.onclick = null;
				console.log("pozostalo do ustawienia pol: " + fieldsLeft);

				if(fieldsLeft == 0){
					model.playerShips.push(ship);
					controller.playerShipsPlaced++;
					controller.markPossibleShipFields();
					console.log("generowanie nowego statku")
				}
			}
		}

		return placeField;
	},

	placeAvaible: function(location, ship){
		console.log("check if avaible: " + location);
		console.log("ships locs: " + ship.locations);

		if(ship.locations[0] == undefined){
			return true;
		}
		var row = location.charAt(1);
		var col = location.charAt(2);

		var avaiableLocs = controller.generateAvaiableLocations(ship);
		console.log("avaiableLocs: " + avaiableLocs);
		if(avaiableLocs.indexOf(location.substring(1)) >= 0){
			return true;
		}

		return false;
	},

	generateAvaiableLocations: function(ship){
		var locations = [];
		var row = ship.locations[0].charAt(1);
		var col = ship.locations[0].charAt(2);

		if(ship.locations[1] == undefined){
			locations.push((Number(row)+1) + "" + col);
			locations.push(row + "" + (Number(col) + 1));
			locations.push((Number(row)-1) + "" + col);
			locations.push(row + "" + (Number(col) - 1));
		}

		return locations;
	},

	shot: function(e){
		controller.shotsFired++;
		var field = e.target;
		field.onclick = null;
		var shotLocation = field.id;
		// console.log(shotLocation);

		for(var i = 0; i < model.enemyShips.length; i++){
			for(var j = 0; j < model.enemyShips[i].locations.length; j++){
				if(shotLocation == model.enemyShips[i].locations[j]){
					model.enemyShips[i].hits[j] = true;
					field.setAttribute("class","hit");
					// console.log("HIT");
					controller.checkSunkCondition(model.enemyShips[i]);
					controller.checkWinCondition();
					return true;
				}
			}
		}

		// console.log("MISS");
		field.setAttribute("class","miss");
		return false;
	},

	checkSunkCondition: function(ship){
		for(var i = 0; i < ship.hits.length; i++){
			if(ship.hits[i] !== true){
				return false;
			}
		}
		alert("Trafiony zatopiony!");
		ship.sunk = true;
		return true;
	},

	checkWinCondition: function(){
		for(var i = 0; i < model.enemyShips.length; i++){
			for(var j = 0; j < model.enemyShips[i].hits.length; j++){
				if(model.enemyShips[i].hits[j] !== true){
					return false;
				}
			}
		}
		alert("wygrana! Liczba strzałów: " + controller.shotsFired);
		return true;
	},

	generateEnemyShips: function(){
		for(var i = 0; i < model.shipTypes.length; i++){
			var ship = new Ship(model.shipTypes[i]);
			ship.locations = this.generateLocations(model.shipTypes[i]);
			model.enemyShips.push(ship);
		}
	},

	generateLocations: function(size){
		var orientation = Math.floor(Math.random() * 2); //vertical or horizontal
		var row, col;
		
		do{
			if(orientation === 1){
				row = Math.floor(Math.random() * (model.boardSize));
				col = Math.floor(Math.random() * (model.boardSize - size));
			}else{
				row = Math.floor(Math.random() * (model.boardSize - size));
				col = Math.floor(Math.random() * (model.boardSize));
			}
		
			var sugestedLocations = [];
			for(var i = 0; i < size; i++){
				if(orientation === 1){
					sugestedLocations.push(row + "" +(col +i));
				}else{
					sugestedLocations.push((row + i) + "" + col);
				}
			}
		}while(this.validLocations(sugestedLocations) == false);

		return sugestedLocations;
	},

	validLocations: function(sugestedLocations){
		if(model.enemyShips.length === 0){
			return true;
		}

		for(var i = 0; i < model.enemyShips.length; i++){
			for( var j = 0; j < model.enemyShips[i].locations.length; j++){
				if(sugestedLocations.indexOf(model.enemyShips[i].locations[j]) >= 0){
					return false;
				}
			}
		}

		return true;
	}
}

function init(){
	controller.markPossibleShipFields();
	view.drawBoard("enemyBoard"); //E is important, its Enemy board indicator
	view.drawBoard("userBoard");
	controller.generateEnemyShips();
}

window.onload = init;
