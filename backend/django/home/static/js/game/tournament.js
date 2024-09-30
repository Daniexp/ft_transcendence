let players = [];
let matchesQueue = [];
let winner = "No one";

function showTournamentInput() {
    hideShowGameSelect(".gameSelectionButtons", "hide");
    document.getElementById('PongButton').addEventListener("click", endTournament);
    const tournamentContainer = document.getElementById('tournamentContainer');

    tournamentContainer.classList.remove('displayNone');
    tournamentContainer.classList.add('d-flex');

    const playerNameInput = document.getElementById('playerName');
    playerNameInput.value = "";
    playerNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            console.log("Intentando agregar jugador:", playerNameInput.value);
            addPlayer();
        }
    });
}

function startTournament() {
    if (players.length < 2) {
        console.log("Se necesitan al menos dos jugadores para iniciar el torneo.");
        return;
    }

    console.log("Iniciando el torneo con jugadores:", players);
    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('d-flex');
    tournamentContainer.classList.add('displayNone');

    setupMatches();
    playNextMatch();
}

function endTournament() {
    console.log("Finalizando torneo...");
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

    const playerListDiv = document.getElementById('playerList');
    while (playerListDiv.firstChild) {
        playerListDiv.removeChild(playerListDiv.firstChild);
    }

    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('d-flex');
    tournamentContainer.classList.add('displayNone');

    hideShowGameSelect(".gameSelectionButtons", "show");
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
    console.log("Partidos a jugar:", matchesQueue);
}

async function playNextMatch() {
    if (matchesQueue.length === 0) {
        console.log("No hay más partidos por jugar.");
        return;
    }

    let match = matchesQueue.shift();
    let player1 = match[0];
    let player2 = match[1];

    console.log(`Iniciando partida entre ${player1} y ${player2}.`);
    gameRunning = true;

    try {
        startGame("tournament"); 
        await waitForGameToEnd();

        if (player2) {
            players = players.filter(player => player !== player2); 
        }
        
        if (winner !== 'No one') {
            console.log(`${winner} gana esta ronda!`);
            players.push(winner);
        }
        
        playNextMatch();
    } catch (error) {
        console.error("Error al jugar el partido:", error);
        gameRunning = false;
    }
}

async function waitForGameToEnd() {
    return new Promise((resolve) => {
        const checkGameRunning = setInterval(() => {
            if (!gameRunning) { 
                clearInterval(checkGameRunning);
                console.log("El juego ha terminado.");
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
        playerDiv.textContent = player;
        playerDiv.className = 'player-name';
        playerListDiv.appendChild(playerDiv);
    });
}

function addPlayer() {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();

    if (playerName === "") {
        console.log("No se puede agregar un nombre vacío.");
        return;
    }

    if (players.includes(playerName)) {
        console.log("El jugador ya está registrado.");
        return;
    }

    players.push(playerName);
    playerNameInput.value = "";
    updatePlayerList();
}
