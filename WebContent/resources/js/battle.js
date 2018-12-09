"use strict";
const PROD_URL = "";
const STAGE_URL = "66.242.90.163:8171";
const DEV_URL = "localhost:8817";
const DEV_ROREN_URL = "localhost:8171";
const URL = DEV_URL;

let battleCharacters;
let isPlayerOne;

var ws = null;

function addCharacterOptions(characters) {
	let selectBoxes = document.getElementsByClassName("chars");
	for (let i = 0; i < characters.length; i++){
		let character = characters[i];
		for (let j = 0; j < 3; j++) {
			const opt = document.createElement("option");
			opt.text = character.name;
			opt.value = character.id;
			selectBoxes[j].options.add(opt);
			if (i === 1 && j == 1) {
				selectBoxes[j].selectedIndex = 1;
			} else if (i === 2 && j == 2) {
				selectBoxes[j].selectedIndex = 2;
			} 
		}
	}
}

function findBattle() {
	var val = $("#playerNameMatchMakingInput").val();
	if (val) {
		connectByPlayerName(val);
		let findButton = document.getElementById("findBattle");
		findButton.disabled = true;
	} else {
		alert("You must enter an opponent's display name.")
	}
}

// find the player you'd like to play with, and get their arenaID, or find no player and get your own (and enter matchmaking)
function connectByPlayerName(name) {
	var playerId = truncateId("#playerId");
	$.ajax({method: "GET", url: "http://"+ URL +"/api/player/arena/ " + playerId + "/" + name}).done(function(result) {
		var arenaId = result;
		connectByArenaId(arenaId);
	});
}

// simply connect to one "arena", aka one websocket using ArenaID
function connectByArenaId(id) {
	ws = new WebSocket('ws://'+ URL +'/arena/' + id);
    $("#arenaId").html("");
	$("#arenaId").append(id);
	handleMessage();
	setTimeout(sendMatchMakingMessage, 1000);
}

// close and null out web socket
function disconnect() {
    ws.close();
    ws = null;
    console.log("Disconnected");
}

// Login OR Create User if does not exist.
// TODO: make this a real login
function sendConnectRequest() {
	var disp = $("#displayNameInput").val().toString() || "NPC";
	var aurl = $("#avatarUrlInput").val().toString() || "https://i.imgur.com/sdOs51i.jpg";
	var req = {
			"displayName": disp,
			"avatarUrl": aurl
	};
	$.ajax({method: "POST", url: "http://"+ URL +"/api/player/", data: req}).done(function(result) {
		afterLogin(result);
	});
}

const handleUserInfo = (name, avatar) => {
	const infoDiv = document.getElementsByClassName("playerBasicInfo")[0];
	for (let i = 0; i < infoDiv.children.length; i++){
		infoDiv.children[i].style.position = "absolute";
		infoDiv.children[i].style.right = "5000px";
	}
	const username = document.createElement("h2");
	username.textContent = name;
	const avatarFrame = document.createElement("img");
	avatarFrame.style.height = "5rem";
	avatarFrame.style.width = "5rem";
	avatarFrame.style.marginRight = "10px";
	avatarFrame.src = avatar;
	infoDiv.style.display = "flex";
	infoDiv.style.alignItems = "center";
	infoDiv.appendChild(avatarFrame);
	infoDiv.appendChild(username);
}

// display playerID (probably not needed, but if we lose it we gotta store playerID as a global variable)
function afterLogin(result) {
    $("#playerId").html("");
	$("#playerId").append(result.id);
	handleUserInfo(result.displayName, result.avatarUrl);
	
	const battleDiv = document.getElementsByClassName("playerBattleInfo")[0];
	
	battleDiv.style.visibility = "visible";
}

// (this is a send message but it made more sense to put it above)
function sendMatchMakingMessage() {
	const chars = Array.from(document.getElementsByClassName("chars"), (x) => x.value); // Indiv. character select.
	var playerId = truncateId("#playerId");
	var arenaId = truncateId("#arenaId");
	console.log("PlayerID: " + playerId);
	console.log("Chars: " + chars);
	console.log("ArenaID: " + arenaId);
	var msg = {
		type: "MATCH_MAKING",
		char1: chars[0],
		char2: chars[1],
		char3: chars[2],
		playerId: playerId,
		arenaId: arenaId,
		opponentName: $("#playerNameMatchMakingInput").val().toString()
	};
	ws.send(JSON.stringify(msg));
}


// ------ HANDLE MESSAGES
// this method gets called once WS is created to initiate the message routing logic
function handleMessage() {
	ws.onmessage = function(response){
		var msg = JSON.parse(response.data);
		var mtp = msg.type;
		console.log(msg);
		if (mtp === "INIT") {
			handleInit(msg);
		} else if (mtp === "CCHECK") {
			handleCostCheck(msg);
		} else if (mtp === "TCHECK") {
			handleTargetCheck(msg);
		} else if (mtp === "ETRADE") {
			handleEnergyTrade(msg);
		} else if (mtp === "END") {
			handleTurnEnd(msg);
		} else {
			if (msg !== "WAITING FOR OPPONENTS"){
				console.log("UNRECOGNIZED");
			}
		}
	}
}



function handleInit(msg) {
	
	battleCharacters = msg.characters;
	isPlayerOne = msg.battle.playerIdOne === Number(document.getElementById("playerId").innerHTML);

	if (msg.battle.playerIdOne === Number(document.getElementById("playerId").innerHTML)){
		
		handlePortraits(msg.characters.slice(0, 3), msg.characters.slice(3, 6));
		initEnergy(formatEnergy(msg.battle.playerOneEnergy));
		handleEnemyInfo(msg.playerTwo);
	} else {
		handlePortraits(msg.characters.slice(3, 6), msg.characters.slice(0, 3));
		initEnergy(formatEnergy(msg.battle.playerTwoEnergy));
		handleEnemyInfo(msg.playerOne);
	}
	// HOOO OOOOOOO OOOO BOYYY
	initTheRest(msg);
}

function initTheRest(msg){
	const finishButton = document.getElementById("finishButton");
	const tradeButton = document.getElementById("tradeButton");
	// figures out which finishButton to disable first the rest is handled elsewhere (hence the INIT)
	// if you're player one and you have more than one energy, you go second so disable them
	if (truncateId("#playerId") == msg.battle.playerIdOne && msg.battle.playerOneEnergy.length > 1) {
		finishButton.disabled = true;
		tradeButton.disabled = true;
		hideAbilities();
	}
	if (truncateId("#playerId") == msg.battle.playerIdTwo && msg.battle.playerTwoEnergy.length > 1) {
		finishButton.disabled = true;
		tradeButton.disabled = true;
		hideAbilities();
	}
	// show moveDiv
	const moveDiv = document.getElementById("moveDiv");
	moveDiv.style.visibility = "visible";
	
	// init the chat	
}

const handleEnemyInfo = (opponent) => {
	const infoDiv = document.getElementById("enemyInfo");
	const username = document.createElement("h2");
	username.textContent = opponent.displayName;
	const avatarFrame = document.createElement("img");
	avatarFrame.style.height = "5rem";
	avatarFrame.style.width = "5rem";
	avatarFrame.style.marginRight = "10px";
	avatarFrame.src = opponent.avatarUrl;
	infoDiv.style.display = "flex";
	infoDiv.style.alignItems = "center";
	infoDiv.appendChild(avatarFrame);
	infoDiv.appendChild(username);
}

const handlePortraits = (allies, enemies) => {
	const allyFrames = document.getElementsByClassName("ally");
	const enemyFrames = document.getElementsByClassName("enemy");

	console.log(allies);
	console.log(enemies);

	for (let i = 0; i < 3; i++){
		const allyPortrait = document.createElement("img");
		const enemyPortrait = document.createElement("img");
		allyPortrait.setAttribute("src", allies[i].avatarUrl);
		allyPortrait.style.maxHeight = "100%";
		allyPortrait.style.maxWidth = "100%";
		allyFrames[i].removeChild(allyFrames[i].childNodes[1]);
		enemyPortrait.setAttribute("src", enemies[i].avatarUrl);
		enemyPortrait.style.maxHeight = "100%";
		enemyPortrait.style.maxWidth = "100%";
		
		const allyButton = document.createElement("button");
		const enemyButton = document.createElement("button");
		allyButton.id = "allyButton" + (i + 1);
		enemyButton.id = "enemyButton" + (i + 1);
		allyButton.disabled = true;
		enemyButton.disabled = true;
		allyButton.style.width = "100%";
		enemyButton.style.width = "100%";
		
		allyButton.appendChild(allyPortrait);
		enemyButton.appendChild(enemyPortrait);
		
		allyFrames[i].appendChild(allyButton);
		enemyFrames[i].appendChild(enemyButton);
	}
	handleAbilities(allies);
}

function addMove(abSlot, charPos) {
	const moveDiv = document.getElementById("moveDiv");
	
	if (!isPlayerOne) {
		charPos += 3;
	}
	
	console.log(battleCharacters);
	
	let ability = battleCharacters[charPos]["slot" + abSlot];
	console.log(ability);
	
	// put abiility picture in moves bar
	
	// maybe just store a simple array globally to hold this stuff
	
	// enable X button to cancel ability selection and clear highlighted targets
}

function enableMoveButtons() {
	const left = document.getElementById("moveLeft");
	const right = document.getElementById("moveRight");
	const cancel = document.getElementById("moveCancel");
	
	
	// fetch number of moves in pipeline = num
	let num = -1;
	
	if (num > 1) {
		left.disabled = "false";
		right.disabled = "false";
	}
	
	if (num > 0) {
		cancel.disabled = "false";
	}
}

function moveLeft() {
	// get highlighted move and reorder the array or something
}

function moveRight() {
	// see above
}

function moveCancel() {
	// pop the last ability off the moves order (or the highlighted one???) (last one by default)
}

const handleAbilities = (allies) => {

	// set up abilities here for display and use

	// make these abilities buttons which onclick send a target check, and onhover show descriptions
	// disable the buttons pending the results of a cost check

	const abilityFrames = document.getElementsByClassName("ally-ability");
	let count = 0;
	// count = ability frame number, j = ally number, i = ability number
	for (let j = 0; j < 3; j++) {
		for (let i = 0; i < 4; i++) {
			const button = document.createElement("button");
			const ability = document.createElement("img");
			const ab = allies[j]["slot" + (i + 1)];
			const a = ab ? ab["abilityUrl"] : "https://emojipedia-us.s3.amazonaws.com/thumbs/120/emoji-one/104/dagger-knife_1f5e1.png";
			ability.src =  a;
			ability.style.width = "100%";
			ability.style.height = "100%";
			button.style.width = "100%";
			button.style.height = "100%";
			button.appendChild(ability);
			
			button.onclick = function() {
				// TARGET CHECK HERE I GUESS
				let abPos = (j * 4) + (i + 1);
				
				// check to enable < > and X buttons
				enableMoveButtons();
				
				addMove(i+1, j);
				
				sendTargetCheck(abPos);
				
				// more here for move logic ?? store move clicked as a variable somewhere
				// MAKE ENEMY OR ALLY PORTRAITS CLICKABLE
			};
			// SHOW DESCRIPTION ON HOVER
			button.onmouseenter = function() {
				const descDiv = document.getElementById("ally-ability-menu-" + j);
				descDiv.hidden = false;
				const span = document.createElement("span");
				span.id = "descSpan" + j;
				span.textContent = ab ? ab.description : "No Description Found";
				const cost = ab ? ab.cost : [];
				
				for (let i = 0; i < cost.length; i++){
					
					const energyBubble = document.createElement("div");
					energyBubble.style.height = "10px";
					energyBubble.style.width = "10px";
					energyBubble.style.border = "1px solid black";
					energyBubble.style.margin = "5px";
					energyBubble.style.float = "left";
					let str = cost[i] + "";
					energyBubble.className = "descCost" + j;
					if (str === "STRENGTH") {
						energyBubble.style.backgroundColor = "red"
					} else if (str === "DEXTERITY") {
						energyBubble.style.backgroundColor = "green"
					} else if (str === "ARCANA") {
						energyBubble.style.backgroundColor = "blue"
					} else if (str === "DIVINITY") {
						energyBubble.style.backgroundColor = "white";
					} else if (str === "RANDOM") {
						energyBubble.style.backgroundColor = "black";
					}
					descDiv.appendChild(energyBubble);
				}
				if (cost.length === 0) {
					let free = document.createElement("span");
					free.textContent = "Free";
					descDiv.appendChild(free);
				}
				
				let cd = document.createElement("span");
				cd.textContent = "Cooldown: " + ab.cooldown;
				cd.style.float = "right";
				descDiv.appendChild(cd);
				
				descDiv.appendChild(document.createElement("hr"));
				descDiv.appendChild(span);
			};
			// HIDE DESCRIPTION ON LEAVE
			button.onmouseleave = function() {
				const descDiv = document.getElementById("ally-ability-menu-" + j);
				while (descDiv.firstChild) {
				    descDiv.removeChild(descDiv.firstChild);
				}
				descDiv.hidden = true;
			};
			
			abilityFrames[count].appendChild(button);
			count++
		}
	}
}

const initEnergy = (playerEnergy) => {
		// adding energy
		const battleLogin = document.getElementsByClassName("playerBattleInfo")[0];
		const energy = document.getElementById("energy");
		const strengthDiv = document.createElement("div");
		const dexterityDiv = document.createElement("div");
		const arcanaDiv = document.createElement("div");
		const divinityDiv = document.createElement("div");
		strengthDiv.id = "strength";
		dexterityDiv.id = "dexterity";
		arcanaDiv.id = "arcana";
		divinityDiv.id = "divinity";
		strengthDiv.style.alignItems = "right";
		dexterityDiv.style.alignItems = "right";
		arcanaDiv.style.alignItems = "right";
		divinityDiv.style.alignItems = "right";
	
		for (let i = 0; i < battleLogin.children.length; i++){
			battleLogin.children[i].style.display = "none";
		}
		energy.style.flexDirection = "column";
	
		const strName = document.createElement("span");
		strName.textContent = "STRENGTH";
		strName.style.marginRight = "10px";
		strengthDiv.appendChild(strName);

		const dexName = document.createElement("span");
		dexName.textContent = "DEXTERITY";
		dexName.style.marginRight = "10px";
		dexterityDiv.appendChild(dexName);

		const arcName = document.createElement("span");
		arcName.textContent = "ARCANA";
		arcName.style.marginRight = "10px";
		arcanaDiv.appendChild(arcName);

		const divName = document.createElement("span");
		divName.textContent = "DIVINITY";
		divName.style.marginRight = "10px";
		divinityDiv.appendChild(divName);

		energy.appendChild(strengthDiv);
		energy.appendChild(dexterityDiv);
		energy.appendChild(arcanaDiv);
		energy.appendChild(divinityDiv);


		// adding totals
	
		const energyTotals = document.getElementById("energyTotals");
		const strengthTotal = document.createElement("div");
		const dexterityTotal = document.createElement("div");
		const arcanaTotal = document.createElement("div");
		const divinityTotal = document.createElement("div");
		strengthTotal.id = "strengthTotal";
		dexterityTotal.id = "dexterityTotal";
		arcanaTotal.id = "arcanaTotal";
		divinityTotal.id = "divinityTotal";
		strengthTotal.className = "totals";
		dexterityTotal.className = "totals";
		arcanaTotal.className = "totals";
		divinityTotal.className = "totals";
	
		energyTotals.style.flexDirection = "column";

		strengthTotal.textContent = 0;
		dexterityTotal.textContent = 0;
		arcanaTotal.textContent = 0;
		divinityTotal.textContent = 0;

		energyTotals.appendChild(strengthTotal);
		energyTotals.appendChild(dexterityTotal);
		energyTotals.appendChild(arcanaTotal);
		energyTotals.appendChild(divinityTotal);


		// adding trade buttons

		const energyTrade = document.getElementById("energyTrade");
		const strengthTrade = document.createElement("div");
		const dexterityTrade = document.createElement("div");
		const arcanaTrade = document.createElement("div");
		const divinityTrade = document.createElement("div");
		strengthTrade.id = "strengthTrade";
		dexterityTrade.id = "dexterityTrade";
		arcanaTrade.id = "arcanaTrade";
		divinityTrade.id = "divinityTrade";
	
		energyTrade.style.flexDirection = "column";

		// BUTTONS 

		const stPlus = document.createElement("button");
		const stMinus = document.createElement("button");
		const dePlus = document.createElement("button");
		const deMinus = document.createElement("button");
		const arPlus = document.createElement("button");
		const arMinus = document.createElement("button");
		const diPlus = document.createElement("button");
		const diMinus = document.createElement("button");

		stPlus.textContent = "+";
		dePlus.textContent = "+";
		arPlus.textContent = "+";
		diPlus.textContent = "+";
		stMinus.textContent = "-";
		deMinus.textContent = "-";
		arMinus.textContent = "-";
		diMinus.textContent = "-";

		stPlus.onclick = function() {
			
			let str = document.getElementById("strengthTotal");
			let strSpd = document.getElementById("strengthSpend");

			const preStr = parseInt(str.textContent);
			const preStrSpd = parseInt(strSpd.textContent);

			if (preStr === 0) {
				alert ("None to spend!");
			} else {
				strSpd.textContent = preStrSpd + 1;
	
				const energyTotal = {
					STRENGTH: 1,
					DEXTERITY: 0,
					ARCANA: 0,
					DIVINITY: 0
				};
	
				removeEnergy(energyTotal);
			}
		}

		dePlus.onclick = function() {
			
			let str = document.getElementById("dexterityTotal");
			let strSpd = document.getElementById("dexteritySpend");

			const preStr = parseInt(str.textContent);
			const preStrSpd = parseInt(strSpd.textContent);

			if (preStr === 0) {
				alert ("None to spend!");
			} else {
				strSpd.textContent = preStrSpd + 1;
	
				const energyTotal = {
					STRENGTH: 0,
					DEXTERITY: 1,
					ARCANA: 0,
					DIVINITY: 0
				};
	
				removeEnergy(energyTotal);
			}
		}

		arPlus.onclick = function() {
			
			let str = document.getElementById("arcanaTotal");
			let strSpd = document.getElementById("arcanaSpend");

			const preStr = parseInt(str.textContent);
			const preStrSpd = parseInt(strSpd.textContent);

			if (preStr === 0) {
				alert ("None to spend!");
			} else {
				strSpd.textContent = preStrSpd + 1;
	
				const energyTotal = {
					STRENGTH: 0,
					DEXTERITY: 0,
					ARCANA: 1,
					DIVINITY: 0
				};
	
				removeEnergy(energyTotal);
			}
		}

		diPlus.onclick = function() {
			
			let str = document.getElementById("divinityTotal");
			let strSpd = document.getElementById("divinitySpend");

			const preStr = parseInt(str.textContent);
			const preStrSpd = parseInt(strSpd.textContent);

			if (preStr === 0) {
				alert ("None to spend!");
			} else {
				strSpd.textContent = preStrSpd + 1;
	
				const energyTotal = {
					STRENGTH: 0,
					DEXTERITY: 0,
					ARCANA: 0,
					DIVINITY: 1
				};
	
				removeEnergy(energyTotal);
			}
		}

		stMinus.onclick = function() {
			
			let strSpd = document.getElementById("strengthSpend");

			const preStrSpd = parseInt(strSpd.textContent);

			if (preStrSpd === 0) {
				alert ("You didn't spend any!");
			} else {
				strSpd.textContent = preStrSpd - 1;


				let strT = parseInt(document.getElementById("strengthTotal").textContent);
				let dexT = parseInt(document.getElementById("dexterityTotal").textContent);
				let arcT = parseInt(document.getElementById("arcanaTotal").textContent);
				let divT = parseInt(document.getElementById("divinityTotal").textContent);
	
				const energyTotal = {
					STRENGTH: 1 + strT,
					DEXTERITY: dexT,
					ARCANA: arcT,
					DIVINITY: divT
				}
	
				handleEnergy(energyTotal);
			}
		}

		deMinus.onclick = function() {
	
			let strSpd = document.getElementById("dexteritySpend");

			const preStrSpd = parseInt(strSpd.textContent);

			if (preStrSpd === 0) {
				alert ("You didn't spend any!");
			} else {
				strSpd.textContent = preStrSpd - 1;

				let strT = parseInt(document.getElementById("strengthTotal").textContent);
				let dexT = parseInt(document.getElementById("dexterityTotal").textContent);
				let arcT = parseInt(document.getElementById("arcanaTotal").textContent);
				let divT = parseInt(document.getElementById("divinityTotal").textContent);
	
				const energyTotal = {
					STRENGTH: strT,
					DEXTERITY: 1 + dexT,
					ARCANA: arcT,
					DIVINITY: divT
				}
	
				handleEnergy(energyTotal);
			}
		}

		arMinus.onclick = function() {
			
			let strSpd = document.getElementById("arcanaSpend");

			const preStrSpd = parseInt(strSpd.textContent);

			if (preStrSpd === 0) {
				alert ("You didn't spend any!");
			} else {
				strSpd.textContent = preStrSpd - 1;
	

				let strT = parseInt(document.getElementById("strengthTotal").textContent);
				let dexT = parseInt(document.getElementById("dexterityTotal").textContent);
				let arcT = parseInt(document.getElementById("arcanaTotal").textContent);
				let divT = parseInt(document.getElementById("divinityTotal").textContent);
	
				const energyTotal = {
					STRENGTH: strT,
					DEXTERITY: dexT,
					ARCANA: 1 + arcT,
					DIVINITY: divT
				}
	
				handleEnergy(energyTotal);
			}
		}

		diMinus.onclick = function() {
			
			let strSpd = document.getElementById("divinitySpend");

			const preStrSpd = parseInt(strSpd.textContent);

			if (preStrSpd === 0) {
				alert ("You didn't spend any!");
			} else {
				strSpd.textContent = preStrSpd - 1;
	

				let strT = parseInt(document.getElementById("strengthTotal").textContent);
				let dexT = parseInt(document.getElementById("dexterityTotal").textContent);
				let arcT = parseInt(document.getElementById("arcanaTotal").textContent);
				let divT = parseInt(document.getElementById("divinityTotal").textContent);
	
				const energyTotal = {
					STRENGTH: strT,
					DEXTERITY: dexT,
					ARCANA: arcT,
					DIVINITY: 1 + divT
				}
	
				handleEnergy(energyTotal);
			}
		}

		stPlus.style.height = "20px";
		stPlus.style.width = "20px";
		stPlus.style.border = "1px solid black";
		stPlus.style.marginRight = "5px";
		stPlus.style.marginBottom = "5px";
		stPlus.style.backgroundColor = "gray";

		dePlus.style.height = "20px";
		dePlus.style.width = "20px";
		dePlus.style.border = "1px solid black";
		dePlus.style.marginRight = "5px";
		dePlus.style.marginBottom = "5px";
		dePlus.style.backgroundColor = "gray";

		arPlus.style.height = "20px";
		arPlus.style.width = "20px";
		arPlus.style.border = "1px solid black";
		arPlus.style.marginRight = "5px";
		arPlus.style.marginBottom = "5px";
		arPlus.style.backgroundColor = "gray";

		diPlus.style.height = "20px";
		diPlus.style.width = "20px";
		diPlus.style.border = "1px solid black";
		diPlus.style.marginRight = "5px";
		diPlus.style.marginBottom = "5px";
		diPlus.style.backgroundColor = "gray";

		stMinus.style.height = "20px";
		stMinus.style.width = "20px";
		stMinus.style.border = "1px solid black";
		stMinus.style.marginRight = "5px";
		stMinus.style.marginBottom = "5px";
		stMinus.style.backgroundColor = "gray";

		deMinus.style.height = "20px";
		deMinus.style.width = "20px";
		deMinus.style.border = "1px solid black";
		deMinus.style.marginRight = "5px";
		deMinus.style.marginBottom = "5px";
		deMinus.style.backgroundColor = "gray";

		arMinus.style.height = "20px";
		arMinus.style.width = "20px";
		arMinus.style.border = "1px solid black";
		arMinus.style.marginRight = "5px";
		arMinus.style.marginBottom = "5px";
		arMinus.style.backgroundColor = "gray";

		diMinus.style.height = "20px";
		diMinus.style.width = "20px";
		diMinus.style.border = "1px solid black";
		diMinus.style.marginRight = "5px";
		diMinus.style.marginBottom = "5px";
		diMinus.style.backgroundColor = "gray";

		strengthTrade.appendChild(stMinus);
		dexterityTrade.appendChild(deMinus);
		arcanaTrade.appendChild(arMinus);
		divinityTrade.appendChild(diMinus);

		strengthTrade.appendChild(stPlus);
		dexterityTrade.appendChild(dePlus);
		arcanaTrade.appendChild(arPlus);
		divinityTrade.appendChild(diPlus);

		energyTrade.style.flexDirection = "column";
		energyTrade.appendChild(strengthTrade);
		energyTrade.appendChild(dexterityTrade);
		energyTrade.appendChild(arcanaTrade);
		energyTrade.appendChild(divinityTrade);

		// BUTTONS

		// adding "spend" column

		const energySpend = document.getElementById("energySpend");
		const strengthSpend = document.createElement("div");
		const dexteritySpend = document.createElement("div");
		const arcanaSpend = document.createElement("div");
		const divinitySpend = document.createElement("div");
		strengthSpend.id = "strengthSpend";
		dexteritySpend.id = "dexteritySpend";
		arcanaSpend.id = "arcanaSpend";
		divinitySpend.id = "divinitySpend";
	
		energySpend.style.flexDirection = "column";

		strengthSpend.textContent = 0;
		dexteritySpend.textContent = 0;
		arcanaSpend.textContent = 0;
		divinitySpend.textContent = 0;

		energySpend.appendChild(strengthSpend);
		energySpend.appendChild(dexteritySpend);
		energySpend.appendChild(arcanaSpend);
		energySpend.appendChild(divinitySpend);

		// add trade and end turn buttons

		const tradeButton = document.createElement("button");
		tradeButton.id = "tradeButton";
		const tradeType = document.createElement("select");
		tradeType.id = "tradeType";
		const finishButton = document.createElement("button");

		const strOpt = document.createElement("option");
		strOpt.textContent = "STRENGTH";
		const dexOpt = document.createElement("option");
		dexOpt.textContent = "DEXTERITY";
		const arcOpt = document.createElement("option");
		arcOpt.textContent = "ARCANA";
		const divOpt = document.createElement("option");
		divOpt.textContent = "DIVINITY";

		tradeButton.textContent = "Trade Energy For...";
		tradeType.appendChild(strOpt);
		tradeType.appendChild(dexOpt);
		tradeType.appendChild(arcOpt);
		tradeType.appendChild(divOpt);
		finishButton.textContent = "Finish Turn";
		finishButton.id = "finishButton";

		tradeButton.onclick = function() {
			//send trade message (validate)
			let strSpd = document.getElementById("strengthSpend");
			let dexSpd = document.getElementById("dexteritySpend");
			let arcSpd = document.getElementById("arcanaSpend");
			let divSpd = document.getElementById("divinitySpend");


			let str = parseInt(strSpd.textContent, 10);
			let dex = parseInt(dexSpd.textContent, 10);
			let arc = parseInt(arcSpd.textContent, 10);
			let div = parseInt(divSpd.textContent, 10);

			let tot = str + dex + arc + div;
			
			let choseType = document.getElementById("tradeType").value;

			let choseStr = document.getElementById("tradeType").value === "STRENGTH";
			let choseDex = document.getElementById("tradeType").value === "DEXTERITY";
			let choseArc = document.getElementById("tradeType").value === "ARCANA";
			let choseDiv = document.getElementById("tradeType").value === "DIVINITY";

			const spentMap = {
				STRENGTH: str,
				DEXTERITY: dex,
				ARCANA: arc,
				DIVINITY: div
			}

			if (tot > 5) {
				alert ("Spent too many!  Select 5 Energy to trade in.")
			} else if (tot < 5) {
				alert ("Didn't spend enough!  Select 5 Energy to trade in.")
			} else {
				// send energy trade message
				console.log(spentMap);
				console.log(choseType);
				sendEnergyTrade(spentMap, choseType);
			}
		}

		finishButton.onclick = function() {
			
			// Check for unspent energy in the spent column
			
			let strSpd = document.getElementById("strengthSpend");
			let dexSpd = document.getElementById("dexteritySpend");
			let arcSpd = document.getElementById("arcanaSpend");
			let divSpd = document.getElementById("divinitySpend");


			let str = parseInt(strSpd.textContent, 10);
			let dex = parseInt(dexSpd.textContent, 10);
			let arc = parseInt(arcSpd.textContent, 10);
			let div = parseInt(divSpd.textContent, 10);

			let tot = str + dex + arc + div;
			
			if (tot > 0) {
				
				
				addEnergy({
					STRENGTH: str,
					DEXTERITY: dex,
					ARCANA: arc,
					DIVINITY: div
				});
				clearSpent();
				alert ("You had extra energy left spent, we put it back for you!");
				// we gotta consider how we're gonna handle paying for randoms... and ordering abilities.
				// clear out any spent energy (this bug is stupid)
			}

			sendTurnEnd();
			//send end turn (validate)
		}

		const actions = document.getElementById("actions");
		const tradeDiv = document.createElement("div");
		const finishDiv = document.createElement("div");

		tradeDiv.appendChild(tradeButton);
		tradeDiv.appendChild(tradeType);

		finishDiv.appendChild(finishButton);

		actions.appendChild(tradeDiv);
		actions.appendChild(finishDiv);
		// handle initial energy

		handleEnergy(playerEnergy);
}

const handleEnergy = (energyMap) => {

	// remove all energy

	let strT = parseInt(document.getElementById("strengthTotal").textContent);
	let dexT = parseInt(document.getElementById("dexterityTotal").textContent);
	let arcT = parseInt(document.getElementById("arcanaTotal").textContent);
	let divT = parseInt(document.getElementById("divinityTotal").textContent);

	const energyTotals = {
		STRENGTH: strT,
		DEXTERITY: dexT,
		ARCANA: arcT,
		DIVINITY: divT
	}

	removeEnergy(energyTotals);
	
	// honor energyMap as being the correct source of energy
	for (let key in energyMap){
		for (let i = 0; i < energyMap[key]; i++){
			const energyBubble = document.createElement("div");
			energyBubble.style.height = "10px";
			energyBubble.style.width = "10px";
			energyBubble.style.border = "1px solid black";
			energyBubble.style.marginRight = "5px";
			energyBubble.className = key.toLowerCase() + "Bubble";
			let substr = key.toLowerCase() + "Total";
			let x = document.getElementById(substr);
			x.textContent = parseInt(x.textContent) + 1;
			if (key === "STRENGTH") {
				energyBubble.style.backgroundColor = "red"
			} else if (key === "DEXTERITY") {
				energyBubble.style.backgroundColor = "green"
			} else if (key === "ARCANA") {
				energyBubble.style.backgroundColor = "blue"
			} else if (key === "DIVINITY") {
				energyBubble.style.backgroundColor = "white";
			}
			document.getElementById(key.toLowerCase()).appendChild(energyBubble);
		}
	}
}

// only used to put energy back individually (rare case)

const addEnergy = (energyMap) => {
	for (let key in energyMap){
		for (let i = 0; i < energyMap[key]; i++){
			const energyBubble = document.createElement("div");
			energyBubble.style.height = "10px";
			energyBubble.style.width = "10px";
			energyBubble.style.border = "1px solid black";
			energyBubble.style.marginRight = "5px";
			energyBubble.className = key.toLowerCase() + "Bubble";
			let substr = key.toLowerCase() + "Total";
			let x = document.getElementById(substr);
			x.textContent = parseInt(x.textContent) + 1;
			if (key === "STRENGTH") {
				energyBubble.style.backgroundColor = "red"
			} else if (key === "DEXTERITY") {
				energyBubble.style.backgroundColor = "green"
			} else if (key === "ARCANA") {
				energyBubble.style.backgroundColor = "blue"
			} else if (key === "DIVINITY") {
				energyBubble.style.backgroundColor = "white";
			}
			document.getElementById(key.toLowerCase()).appendChild(energyBubble);
		}
	}
}

const removeEnergy = (spentEnergy) => {

	for (let key in spentEnergy){
		let energyDivs = document.getElementById(key.toLowerCase());
		let numToRemove = spentEnergy[key];
		for (numToRemove; numToRemove > 0; numToRemove--) {
			let str = document.getElementById(key.toLowerCase() + "Total");
			const preStr = parseInt(str.textContent);
			str.textContent = preStr - 1;
			
			let bubbles = document.getElementsByClassName(key.toLowerCase() + "Bubble");
			let lastBubble = bubbles[bubbles.length - 1];
			energyDivs.removeChild(lastBubble);
		}
	}
}

// TODO this is needed for the inital energy map because i'm dumb?  look into fixing this nonsense later
const handleAndFormatEnergy = (playerEnergy) => {
	handleEnergy(formatEnergy(playerEnergy));
}

function formatEnergy(energy) {
	const energyTotal = {
		STRENGTH: 0,
		DEXTERITY: 0,
		ARCANA: 0,
		DIVINITY: 0
	};

	for (let entry of energy){
		energyTotal[entry]++;
	}
	return energyTotal;
}

function clearSpent() {
	let strSpd = document.getElementById("strengthSpend");
	let dexSpd = document.getElementById("dexteritySpend");
	let arcSpd = document.getElementById("arcanaSpend");
	let divSpd = document.getElementById("divinitySpend");
	strSpd.textContent = 0;
	dexSpd.textContent = 0;
	arcSpd.textContent = 0;
	divSpd.textContent = 0;
}

function handleEnergyTrade(msg) {
	clearSpent();
	if (msg.battle.playerIdOne === msg.playerId){
		handleAndFormatEnergy(msg.battle.playerOneEnergy);
	} else {
		handleAndFormatEnergy(msg.battle.playerTwoEnergy);
	}
}


function handleCostCheck(msg) {
	console.log("GOT COST CHECK MESSAGE");
	// recieve message from backend, and disable abilities that we do not have enough energy for
}

function handleTargetCheck(msg) {
	console.log("GOT TARGET CHECK MESSAGE");
	let battle = msg.battle;
	const button1 = document.getElementById("enemyButton1");
	const button2 = document.getElementById("enemyButton2");
	const button3 = document.getElementById("enemyButton3");
	const button4 = document.getElementById("allyButton1");
	const button5 = document.getElementById("allyButton2");
	const button6 = document.getElementById("allyButton3");
	let team1 = battle.playerOneTeam;
	let team2 = battle.playerTwoTeam;
	
	let isPlayerOne = truncateId("#playerId") == msg.battle.playerIdOne;
	
	if (isPlayerOne) {
		team1.forEach(x => {
			if (x.highlighted) {
				const button = document.getElementById("allyButton" + (x.position + 1));
				// MAKE BUTTON HIGHLIGHTED
			}
		})
	}
	
	// recieve message from backend, and highlight appropriate available targets
}

function handleTurnEnd(msg) {
	const finishButton = document.getElementById("finishButton");
	const tradeButton = document.getElementById("tradeButton");
	if(msg.playerId != truncateId("#playerId")){
		console.log("Recieved turn end!");
		finishButton.disabled = false;
		tradeButton.disabled = false;

		//  TIMER 
		showAbilities();
		// logic here to show my abilities again
		// and perform cost check
		
		if (truncateId("#playerId") == msg.battle.playerIdOne) {
			handleAndFormatEnergy(msg.battle.playerOneEnergy);
		} else {
			handleAndFormatEnergy(msg.battle.playerTwoEnergy);
		}
	} else {
		console.log("Ended Turn");
		finishButton.disabled = true;
		tradeButton.disabled = true;

		// TIMER
		hideAbilities();
		// logic here to hide abilities (this logic could be used on init too)
	}
	// recieve message from backend, and then pass turn control and show applied effects/damage from last turn
}

function hideAbilities() {
	const abs = document.getElementsByClassName("ally-ability-menu");
	abs[0].style.visibility = "hidden";
	abs[1].style.visibility = "hidden";
	abs[2].style.visibility = "hidden";
}

function showAbilities() {
	const abs = document.getElementsByClassName("ally-ability-menu");
	abs[0].style.visibility = "visible";
	abs[1].style.visibility = "visible";
	abs[2].style.visibility = "visible";
}

// ------ SEND MESSAGES

// TODO
// gotta do this any time they assign one target/ability too!
function sendCostCheck() {
	ws.send(
		JSON.stringify({
			type: "COST_CHECK",
			playerId: truncateId("#playerId"),
			STRENGTH: document.getElementById("strengthTotal").textContent,
			DEXTERITY: document.getElementById("dexterityTotal").textContent,
			ARCANA: document.getElementById("arcanaTotal").textContent,
			DIVINITY: document.getElementById("divinityTotal").textContent
		})
	)
}

// TODO
// just gotta do this when they click an active ability
function sendTargetCheck(abilityPosition){
	ws.send(
		JSON.stringify({
			type: "TARGET_CHECK",
			playerId: truncateId("#playerId"),
			ability: abilityPosition
		})
	)
}

function sendEnergyTrade(map, type){
	ws.send(
		JSON.stringify({
			type: "ENERGY_TRADE",
			playerId: truncateId("#playerId"),
			spent: map,
			chosen: type
		})
	)
}

function sendTurnEnd() {
	const payload = {
		type: "TURN_END",
		playerId: truncateId("#playerId")
		// TODO structure a real pojo for how this flow will work (ability order matters... old abilities could be sent too.. list of ablity:target pairs?)
		// move1: $("#move1").val(),
		// move2: $("#move2").val(),
		// move3: $("#move3").val(),
		// target1: $("#target1").val(),
		// target2: $("#target2").val(),
		// target3: $("#target3").val()
	}
    ws.send(
		JSON.stringify(payload)
    );
}


// ------- OTHER

function truncateId(str) {
	return $(str).text().substring($(str).text().length - 8, $(str).text().length);
}

// ------ EVENT LISTENERS

const handleEventListeners = {
	preventMultipleSelection: (() => {
		const selectors = Array.from(document.getElementsByClassName("chars")); // Create array of character select elements.
		selectors.forEach((x, y) => {
			x.addEventListener("change", () => {  // Add event listener to each element using forEach.
				const currentChars = selectors.map(x => x.value);  // Create array of currently selected character values.
				for (let i = 0; i < selectors.length; i++){ // Iterate through char select elements to change currently selected to disabled.
				const characterOptions = selectors[i].children;
					if (i !== y){ // Only perform these changes on elements that did not trigger the event listener with change.
						Array.from(characterOptions, (x) => { 
							if (!currentChars.some(z => z === x.value)) // Remove disabled attribute if character is not currently selected by other element.
								x.removeAttribute("disabled");
						});
						const currentSelection = characterOptions[x.value]; 
						currentSelection.disabled = "true"; // Add disabled attribute for character option change that triggered event listener.
					}
				}
			});
		});
	})()
}

$(document).ready(function(){
    if (ws != null) {
    	disconnect();
    }
    
    
	$.ajax({method: "GET", url: "http://"+ URL +"/api/character/"}).done(function(characters) {
		addCharacterOptions(characters);
	});
    
});