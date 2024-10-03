let players = [];
let matchesQueue = [];
let winner = "No one";

function showMessage(message) {

    removeMessage();

    const messageContainer = document.getElementById('gameContainer');
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = 'message';
    messageContainer.appendChild(messageDiv);
}

function removeMessage() {
    const messageContainer = document.getElementById('gameContainer');
    
    const existingMessage = messageContainer.querySelector('.message');
    if (existingMessage) {
        messageContainer.removeChild(existingMessage);
    }
}

const handlePlayerInput = (event) => {
    const playerNameInput = document.getElementById('playerName');
    if (event.key === 'Enter') {
        addPlayer();
    }
};

function showTournamentInput() {
    players = [];
    matchesQueue = [];

    hideShowGameSelect('.endButtons', 'hide');
    document.getElementById("gameScoreBalls").classList.add('displayNone');
    document.getElementById("gameScoreBalls").classList.remove('flexStyle');
    hideShowGameSelect('.gamePong', 'hide');
    hideShowGameSelect(".gameSelectionButtons", "hide");
    const pongButton = document.getElementById('PongButton');

    pongButton.addEventListener("click", endTournament);

    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('displayNone');
    tournamentContainer.classList.add('d-flex');

    const playerNameInput = document.getElementById('playerName');
    playerNameInput.value = ""; 

    playerNameInput.addEventListener('keydown', handlePlayerInput);
}

function startTournament() {
    if (players.length < 2) {
        alert("Se necesitan al menos dos jugadores para iniciar el torneo.");
        return;
    }

    const playerListDiv = document.getElementById('playerList');
    while (playerListDiv.firstChild) {
        playerListDiv.removeChild(playerListDiv.firstChild);
    }
    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('d-flex');
    tournamentContainer.classList.add('displayNone');

    playNextMatch();
}

function endTournament() {

    if (window.gameSocket && window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.close();
        window.gameSocket = undefined;
    }

    if (window.secondWeb && window.secondWeb.readyState === WebSocket.OPEN) {
        window.secondWeb.close();
        window.secondWeb = undefined;
    }

    resetGame();

    const playerNameInput = document.getElementById('playerName');
    playerNameInput.removeEventListener('keydown', handlePlayerInput);

    const playerListDiv = document.getElementById('playerList');
    while (playerListDiv.firstChild) {
        playerListDiv.removeChild(playerListDiv.firstChild);
    }

    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('d-flex');
    tournamentContainer.classList.add('displayNone');
    document.getElementById("distion").classList.remove('d-flex');
    document.getElementById("distion").classList.add('displayNone');

    hideShowGameSelect(".gameSelectionButtons", "show");
}

function setupMatches() {
    matchesQueue = [];

    if (players.length > 1) {
        for (let i = 0; i < players.length; i += 2) {
            if (i + 1 < players.length) {
                matchesQueue.push([players[i], players[i + 1]]);
            } else {
                matchesQueue.push([players[i], null]);
            }
        }
    }
}


let player1
let player2

async function startTournamentGame(){
    document.getElementById("distion").classList.remove('d-flex');
    document.getElementById("distion").classList.add('displayNone');

    try {
        startGame("tournament"); 
        await waitForGameToEnd();
        console.log(winner)
        if (winner !== 'No one') {
            if (winner == "left_player"){
                winner = player1;
                players = players.filter(player => player !== player2); 
            }
            else{
                winner = player2
                players = players.filter(player => player !== player1); 
            }
            players.push(winner);
            playNextMatch();
        }
    } catch (error) {
        console.error("Error al jugar el partido:", error);
    }
}

async function playNextMatch() {
    setupMatches();
    let match = matchesQueue.shift();
    
    if (match.length == 1) {
        showMessage(`Tournament winner ${players[0]}!`);
        return;
    }
    player1 = match[0];
    player2 = match[1];

    if (player2 == null) {
        players.push(player1);
        return playNextMatch(); 
    }

    showMessage(`${player1} VS ${player2}.`);

    document.getElementById("distion").classList.remove('displayNone');
    document.getElementById("distion").classList.add('d-flex');
    document.getElementById("gameScoreBalls").classList.remove('displayNone');
    document.getElementById("gameScoreBalls").classList.add('flexStyle');
    hideShowGameSelect('.gamePong', 'show');
    document.getElementById('countdown').style.display = 'none';
    document.querySelectorAll('.endButtons').forEach(button => button.style.display = "none");
    resetRoundCircles()
}

async function waitForGameToEnd() {
    return new Promise((resolve) => {
        const checkGameRunning = setInterval(() => {
            if (!gameRunning) { 
                clearInterval(checkGameRunning);
                resolve();
            }
        }, 100);
    });
}

function updatePlayerList() {
    const playerListDiv = document.getElementById('playerList');
    while (playerListDiv.firstChild) {
        playerListDiv.removeChild(playerListDiv.firstChild);
    }

    players.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.textContent = player + ".";
        playerDiv.className = 'player-name';
        playerListDiv.appendChild(playerDiv);
    });
}

function addPlayer() {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();

    if (playerName === "") {
        alert("No se puede agregar un nombre vacío.");
        return;
    }

    if (players.includes(playerName)) {
        alert("El jugador ya está registrado.");
        return;
    }

    players.push(playerName);
    playerNameInput.value = "";
    updatePlayerList();
}
