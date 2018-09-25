"use strict";
const PROD_URL = "";
const STAGE_URL = "66.242.90.163:8171";
const DEV_URL = "localhost:8817";
const DEV_ROREN_URL = "localhost:8171";
const URL = DEV_URL;

var ws = null;

function findBattle() {
	var val = $("#playerNameMatchMakingInput").val();
	if (val) {
		connectByPlayerName(val);
	} else {
		alert("You must enter an opponent's display name.")
	}
}

// find the player you'd like to play with, and get their arenaID, or find no player and get your own (and enter matchmaking)
function connectByPlayerName(name) {
	var playerId = truncateId("#playerId");
	console.log(playerId);
	$.ajax({method: "GET", url: "http://"+ URL +"/api/player/arena/ " + playerId + "/" + name}).done(function(result) {
		console.log(result);
		var arenaId = result;
		connectByArenaId(arenaId);
	});
}

// simply connect to one "arena", aka one websocket using ArenaID
function connectByArenaId(id) {
	ws = new WebSocket('ws://'+ URL +'/arena/' + id);
    $("#arenaId").html("");
	$("#arenaId").append(id);
	console.log("Connected to Friend!");
	console.log(ws);
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
	handleUserInfo(disp, aurl);
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
	console.log(result);
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
	console.log(msg);
	ws.send(JSON.stringify(msg));
}


// ------ HANDLE MESSAGES
// this method gets called once WS is created to initiate the message routing logic
function handleMessage() {
	ws.onmessage = function(data){
		console.log(data);
		var msg = JSON.parse(data.data);
		var mtp = msg.type;
		if (mtp === "INIT") {
			handleInit(msg);
		} else if (mtp === "CCHECK") {
			handleCostCheck(msg);
		} else if (mtp === "TCHECK") {
			handleTargetCheck(msg);
		} else if (mtp === "END") {
			handleTurnEnd(msg);
		}
	}
}

function handleInit(msg) {
	console.log(msg);

	if (msg.battle.playerIdOne === Number(document.getElementById("playerId").innerHTML)){
		handlePortraits(msg.battle.playerOneTeam, msg.battle.playerTwoTeam);
		initEnergy(formatEnergy(msg.battle.playerOneEnergy));
		handleEnemyInfo(msg.playerTwo);
	} else {
		handlePortraits(msg.battle.playerTwoTeam, msg.battle.playerOneTeam);
		initEnergy(formatEnergy(msg.battle.playerTwoEnergy));
		handleEnemyInfo(msg.playerOne);
	}
	// HOOO OOOOOOO OOOO BOYYY
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
	const charIds = [];
	const backgrounds = new Map([
	[0, "https://i.imgur.com/qh2cjpd.jpg"], 
	[1, "https://i.imgur.com/yvQeY2q.png"],
	[2, "https://i.imgur.com/YCBrPWg.png"],
	[3, "https://i.imgur.com/uPWgaVl.jpg"],
	[4, "https://i.imgur.com/y2pJyrY.jpg"]
	]);
	for (let i = 0; i < allyFrames.length; i++){
		const allyPortrait = document.createElement("img");
		const enemyPortrait = document.createElement("img");
		allyPortrait.setAttribute("src", backgrounds.get(allies[i].characterId));
		allyPortrait.style.maxHeight = "100%";
		allyPortrait.style.maxWidth = "100%";
		allyFrames[i].removeChild(allyFrames[i].childNodes[1]);
		enemyPortrait.setAttribute("src", backgrounds.get(enemies[i].characterId));
		enemyPortrait.style.maxHeight = "100%";
		enemyPortrait.style.maxWidth = "100%";
		allyFrames[i].appendChild(allyPortrait);
		enemyFrames[i].appendChild(enemyPortrait);
		charIds.push(allies[i].characterId);
	}
	handleAbilities(...charIds);
}

const handleAbilities = (...allies) => {
	const abilityFrames = document.getElementsByClassName("ally-ability");
	const abilityImages = new Map([
		[0, ["./resources/img/alex-ability-1.png", "./resources/img/alex-ability-2.png", 
			"./resources/img/alex-ability-3.png", "./resources/img/alex-ability-4.png"]],
		[1, ["./resources/img/fainne-ability-1.png", "./resources/img/fainne-ability-2.png", 
		"./resources/img/fainne-ability-3.png", "./resources/img/fainne-ability-4.png"]],
		[2, ["./resources/img/geddy-ability-1.png", "./resources/img/geddy-ability-2.png", 
		"./resources/img/geddy-ability-3.png", "./resources/img/geddy-ability-4.png"]],
		[3, ["./resources/img/holly-ability-1.png", "./resources/img/holly-ability-2.png", 
		"./resources/img/holly-ability-3.png", "./resources/img/holly-ability-4.png"]],
		[4, ["./resources/img/shinzo-ability-1.png", "./resources/img/shinzo-ability-2.png", 
		"./resources/img/shinzo-ability-3.png", "./resources/img/shinzo-ability-4.png"]]	
	]);
	const abilityArray = [...abilityImages.get(allies[0]), ...abilityImages.get(allies[1]), ...abilityImages.get(allies[2])];
	for (let i = 0; i < abilityFrames.length; i++){
		const ability = document.createElement("img");
		ability.src = abilityArray[i];
		ability.style.width = "100%";
		ability.style.height = "100%";
		abilityFrames[i].appendChild(ability);
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
				str.textContent = preStr - 1;
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
				str.textContent = preStr - 1;
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
				str.textContent = preStr - 1;
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
				str.textContent = preStr - 1;
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
			
			let str = document.getElementById("strengthTotal");
			let strSpd = document.getElementById("strengthSpend");

			const preStr = parseInt(str.textContent);
			const preStrSpd = parseInt(strSpd.textContent);

			if (preStrSpd === 0) {
				alert ("You didn't spend any!");
			} else {
				strSpd.textContent = preStrSpd - 1;
	
				const energyTotal = {
					STRENGTH: 1,
					DEXTERITY: 0,
					ARCANA: 0,
					DIVINITY: 0
				};
	
				handleEnergy(energyTotal);
			}
		}

		deMinus.onclick = function() {
			
			let str = document.getElementById("dexterityTotal");
			let strSpd = document.getElementById("dexteritySpend");

			const preStr = parseInt(str.textContent);
			const preStrSpd = parseInt(strSpd.textContent);

			if (preStrSpd === 0) {
				alert ("You didn't spend any!");
			} else {
				strSpd.textContent = preStrSpd - 1;
	
				const energyTotal = {
					STRENGTH: 0,
					DEXTERITY: 1,
					ARCANA: 0,
					DIVINITY: 0
				};
	
				handleEnergy(energyTotal);
			}
		}

		arMinus.onclick = function() {
			
			let str = document.getElementById("arcanaTotal");
			let strSpd = document.getElementById("arcanaSpend");

			const preStr = parseInt(str.textContent);
			const preStrSpd = parseInt(strSpd.textContent);

			if (preStrSpd === 0) {
				alert ("You didn't spend any!");
			} else {
				strSpd.textContent = preStrSpd - 1;
	
				const energyTotal = {
					STRENGTH: 0,
					DEXTERITY: 0,
					ARCANA: 1,
					DIVINITY: 0
				};
	
				handleEnergy(energyTotal);
			}
		}

		diMinus.onclick = function() {
			
			let str = document.getElementById("divinityTotal");
			let strSpd = document.getElementById("divinitySpend");

			const preStr = parseInt(str.textContent);
			const preStrSpd = parseInt(strSpd.textContent);

			if (preStrSpd === 0) {
				alert ("You didn't spend any!");
			} else {
				strSpd.textContent = preStrSpd - 1;
	
				const energyTotal = {
					STRENGTH: 0,
					DEXTERITY: 0,
					ARCANA: 0,
					DIVINITY: 1
				};
	
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

		const strSpendSpan = document.createElement("span");
		strSpendSpan.className = "spent";
		strSpendSpan.textContent = 0;
		strSpendSpan.style.marginRight = "10px";
		strengthSpend.appendChild(strSpendSpan);

		const dexSpendSpan = document.createElement("span");
		dexSpendSpan.className = "spent";
		dexSpendSpan.textContent = 0;
		dexSpendSpan.style.marginRight = "10px";
		dexteritySpend.appendChild(dexSpendSpan);

		const arcSpendSpan = document.createElement("span");
		arcSpendSpan.className = "spent";
		arcSpendSpan.textContent = 0;
		arcSpendSpan.style.marginRight = "10px";
		arcanaSpend.appendChild(arcSpendSpan);

		const divSpendSpan = document.createElement("span");
		divSpendSpan.className = "spent";
		divSpendSpan.textContent = 0;
		divSpendSpan.style.marginRight = "10px";
		divinitySpend.appendChild(divSpendSpan);

		energySpend.appendChild(strengthSpend);
		energySpend.appendChild(dexteritySpend);
		energySpend.appendChild(arcanaSpend);
		energySpend.appendChild(divinitySpend);

		// add trade and end turn buttons

		const tradeButton = document.createElement("button");
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

		tradeButton.onclick = function() {
			//send trade message (validate)
			const spents = document.getElementsByClassName("spents");

			console.log(spents);

			let str = spents[0].textContent;
			let dex = spents[1].textContent;
			let arc = spents[2].textContent;
			let div = spents[3].textContent;

			let tot = str + dex + arc + div;

			let choseStr = document.getElementById("tradeType").value === "STRENGTH";
			let choseDex = document.getElementById("tradeType").value === "DEXTERITY";
			let choseArc = document.getElementById("tradeType").value === "ARCANA";
			let choseDiv = document.getElementById("tradeType").value === "DIVINITY";

			const energyMap = {
				STRENGTH: choseStr ? 1 : 0,
				DEXTERITY: choseDex ? 1 : 0,
				ARCANA: choseArc ? 1 : 0,
				DIVINITY: choseDiv ? 1 : 0
			}

			if (tot > 5) {
				alert ("Spent too many!  Select 5 Energy to trade in.")
			} else if (tot < 5) {
				alert ("Didn't spent enough!  Select 5 Energy to trade in.")
			} else {
				let energySpendSpans = document.getElementsByClassName("spent");

				for (let i = 0; i < energySpendSpans.length; i++){
					energySpendSpans[i].textContent = 0;
				}
				handleEnergy(energyMap);
			}
		}

		finishButton.onclick = function() {

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

const formatAndHandleEnergy = (playerEnergy) => {
	handleEnergy(formatEnergy(playerEnergy));
}

const handleEnergy = (energyMap) => {

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

	sendCostCheck();
}

const removeEnergy = (spentEnergy) => {

	for (let key in spentEnergy){
		let energyDivs = document.getElementById(key.toLowerCase());
		let numToRemove = spentEnergy[key];
		for (numToRemove; numToRemove > 0; numToRemove--) {
			let bubbles = document.getElementsByClassName(key.toLowerCase() + "Bubble");
			let lastBubble = bubbles[bubbles.length - 1];
			energyDivs.removeChild(lastBubble);
		}
	}
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

function handleCostCheck(msg) {
	console.log(msg);
	// recieve message from backend, and disable abilities that we do not have enough energy for
}

function handleTargetCheck(msg) {
	console.log(msg);
	// recieve message from backend, and highlight appropriate available targets
}

function handleTurnEnd(msg) {
	console.log(msg);
	// recieve message from backend, and then pass turn control and show applied effects/damage from last turn
}

// ------ SEND MESSAGES


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

function sendTargetCheck(characterPosition, abilityPosition){
	ws.send(
		JSON.stringify({
			type: "TARGET_CHECK",
			playerId: truncateId("#playerId"),
			character: characterPosition,
			ability: abilityPosition
		})
	)
}

function sendTurnEnd() {
	const payload = {
		type: "TURN_END",
		playerId: truncateId("#playerId")
		// move1: $("#move1").val(),
		// move2: $("#move2").val(),
		// move3: $("#move3").val(),
		// target1: $("#target1").val(),
		// target2: $("#target2").val(),
		// target3: $("#target3").val()
	}
	console.log(payload);
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
    
    $("#chars option").click(function() {
        if ($("#chars option:selected").length > 3) {
            $(this).removeAttr("selected");
            alert('You can select up to 3 characters only');
        }
    });
});