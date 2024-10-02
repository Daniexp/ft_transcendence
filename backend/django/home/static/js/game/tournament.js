let players = [];
let matchesQueue = [];
let winner = "No one";

function showMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = 'message';
    messageContainer.appendChild(messageDiv);
}

const handlePlayerInput = (event) => {
    const playerNameInput = document.getElementById('playerName');
    if (event.key === 'Enter') {
        addPlayer();
    }
};

function showTournamentInput() {
    hideShowGameSelect(".gameSelectionButtons", "hide");
    const pongButton = document.getElementById('PongButton');

    pongButton.addEventListener("click", endTournament); // Agrega el evento

    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('displayNone');
    tournamentContainer.classList.add('d-flex');

    const playerNameInput = document.getElementById('playerName');
    playerNameInput.value = ""; 

    playerNameInput.addEventListener('keydown', handlePlayerInput);
}

function startTournament() {
    if (players.length < 2) {
        showMessage("Se necesitan al menos dos jugadores para iniciar el torneo.");
        return;
    }

    const playerListDiv = document.getElementById('playerList');
    while (playerListDiv.firstChild) {
        playerListDiv.removeChild(playerListDiv.firstChild);
    }
    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('d-flex');
    tournamentContainer.classList.add('displayNone');

    showMessage("Iniciando el torneo con jugadores: " + players.join(", "));
    setupMatches();
    playNextMatch();
}

function endTournament() {
    players = [];
    matchesQueue = [];

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

    hideShowGameSelect(".gameSelectionButtons", "show");
    showMessage("Finalizando torneo...");
}

function setupMatches() {
    matchesQueue = [];
    for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
            matchesQueue.push([players[i], players[i + 1]]);
        } else {
            matchesQueue.push([players[i], null]);
        }
    }
    showMessage("Partidos a jugar: " + matchesQueue.map(match => match.join(" vs ")).join(", "));
}

async function playNextMatch() {
    if (matchesQueue.length === 0) {
        showMessage("The winner is: " + winner);
        return;
    }

    let match = matchesQueue.shift();
    let player1 = match[0];
    let player2 = match[1];

    showMessage(`Iniciando partida entre ${player1} y ${player2}.`);

    try {
        startGame("tournament"); 
        await waitForGameToEnd();

        if (player2) {
            players = players.filter(player => player !== player2); 
        }
        if (winner !== 'No one') {
            if (winner == "left_player")
                winner = player1;
            else
                winner = player2
            showMessage(`${winner} gana esta ronda!`);
            players.push(winner);
            playNextMatch();
        }
    } catch (error) {
        console.error("Error al jugar el partido:", error);
    }
}

async function waitForGameToEnd() {
    return new Promise((resolve) => {
        const checkGameRunning = setInterval(() => {
            if (!gameRunning) { 
                clearInterval(checkGameRunning);
                showMessage("El juego ha terminado.");
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
        showMessage("No se puede agregar un nombre vacío.");
        return;
    }

    if (players.includes(playerName)) {
        showMessage("El jugador ya está registrado.");
        return;
    }

    players.push(playerName);
    playerNameInput.value = "";
    updatePlayerList();
}
