function showTournamentInput() {
    hideShowGameSelect(".gameSelectionButtons", "hide");
    document.getElementById('PongButton').onclick = gameOver; // TODO: Cambiar a finalizador del torneo
    const tournamentContainer = document.getElementById('tournamentContainer');

    tournamentContainer.classList.remove('displayNone');
    tournamentContainer.classList.add('d-flex')

    const playerNameInput = document.getElementById('playerName');
    playerNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addPlayer();
        }
    });
}

let players = [];


function endTournament() {
    const tournamentContainer = document.getElementById('tournamentContainer');

    tournamentContainer.classList.remove('d-flex');
    tournamentContainer.classList.add('displayNone');
    
    hideShowGameSelect(".gameSelectionButtons", "show");

    players = [];
    updatePlayerList();
}

function addPlayer() {
    const playerNameInput = document.getElementById('playerName');
    const playerList = document.getElementById('playerList');
    
    if (playerNameInput.value.trim() !== "") {
        players.push(playerNameInput.value.trim() + "."); 
        playerNameInput.value = "";
        updatePlayerList();
    }
}

function updatePlayerList() {
    const playerListDiv = document.getElementById('playerList');
    playerListDiv.innerHTML = ''; 

    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.textContent = player;
        playerDiv.className = 'player-name';
        if (index > 0) { 
            playerDiv.classList.add('small');
        }
        playerListDiv.appendChild(playerDiv);
    });
}
