let players = [];

function showTournamentInput() {
    hideShowGameSelect(".gameSelectionButtons", "hide");
    document.getElementById('PongButton').onclick = endTournament;
    const tournamentContainer = document.getElementById('tournamentContainer');

    tournamentContainer.classList.remove('displayNone');
    tournamentContainer.classList.add('d-flex');

    const playerNameInput = document.getElementById('playerName');
    playerNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            console.log("Intentando agregar jugador:", playerNameInput.value);
            addPlayer();
        }
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
    console.log("Jugador agregado:", playerName);
}

function startTournament() {
    if (players.length < 2) {
        console.log("Se necesitan al menos dos jugadores para iniciar el torneo.");
        return;
    }

    console.log("Iniciando el torneo con jugadores:", players);
    document.getElementById('tournamentContainer').classList.add('displayNone');

    playMatches(players);
}

function endTournament() {
    const tournamentContainer = document.getElementById('tournamentContainer');
    tournamentContainer.classList.remove('d-flex');
    tournamentContainer.classList.add('displayNone');
    
    hideShowGameSelect(".gameSelectionButtons", "show");

    players = [];
    updatePlayerList();
}

function playMatches(players) {
    let matches = [];
    for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
            matches.push([players[i], players[i + 1]]);
        } else {
            matches.push([players[i], null]);
        }
    }

    console.log("Partidos a jugar:", matches);
    playMatch(matches);
}

async function playMatch(matches) {
    if (matches.length === 0) {
        console.log("No hay más partidos por jugar.");
        return;
    }

    if (matches.length === 1) {
        console.log("El torneo ha terminado. El ganador es " + matches[0][0]);
        return; 
    }

    let match = matches.shift(); 
    let player1 = match[0];
    let player2 = match[1];

    if (player2) {
        console.log(`Iniciando partida entre ${player1} y ${player2}.`);
    } else {
        console.log(`El jugador ${player1} avanza automáticamente.`);
    }

    await startGame("tournament");
    await waitForGameToEnd();

    let winner = player2 ? player1 : player1; 
    if (player2) {
        players = players.filter(player => player !== player2); 
    }

    console.log(`${winner} gana esta ronda!`);
    players.push(winner);
    playMatches(players); 
}

async function waitForGameToEnd() {
    return new Promise((resolve) => {
        const checkGameRunning = setInterval(() => {
            if (gameRunning === 0) { 
                clearInterval(checkGameRunning);
                resolve();
            }
        }, 100);
    });
}

function updatePlayerList() {
    const playerListDiv = document.getElementById('playerList');
    playerListDiv.innerHTML = ''; 

    players.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.textContent = player;
        playerDiv.className = 'player-name';
        playerListDiv.appendChild(playerDiv);
    });
}
