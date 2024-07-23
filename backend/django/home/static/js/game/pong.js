document.addEventListener("DOMContentLoaded", function() {
    loadHTML("/gameButtonsDisplay/", "placeholder");
});


function getOrGenerateUniqueID() {
    let uniqueID = localStorage.getItem('uniqueID');
    if (!uniqueID) {
        uniqueID = generateUUID();
        localStorage.setItem('uniqueID', uniqueID);
    }
    return uniqueID;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function hideShowGameSelect(classSelector, mode){
    var buttons = document.querySelectorAll(classSelector);
    if(mode == "show"){
        buttons.forEach(function(button) {
            button.style.display = 'block';
        });
    } else {
        buttons.forEach(function(button) {
            button.style.display = 'none';
        });
    }
}

gameRunning = 0;

function startGame(mode){
    hideShowGameSelect(".gameSelectionButtons", "hide");
    if(mode === '1vs1'){
        initWebSocket()
        hideShowGameSelect(".gamePong", "show");
        waitForGameStart(mode);
    }
}

async function waitForGameStart(mode) {
    while (gameRunning === 0) {
        await sleep(50); 
    }
    if(mode === '1vs1'){
        document.getElementById('gameContainer').addEventListener('keydown', handleKeysOnePlayer);
    }
}

function initWebSocket(){
    const uniqueID = getOrGenerateUniqueID();
    var gameSocket = new WebSocket(`ws://${window.location.host}/ws/pong/${uniqueID}/`);

    gameSocket.onopen = function(event) {
        console.log('Conexión abierta');
    };

    gameSocket.onmessage = function(event) {
        console.log('Mensaje recibido:', event.data); //TODO remove debug
        try {
            var data = JSON.parse(event.data);
            if(data.message === "Game started"){
                gameRunning = 1;
            }
            if(data.message === "disconnected") {
                hideShowGameSelect('.gameSelectionButtons', 'show');
                hideShowGameSelect('.gamePong', 'hide');
                gameRunning = 0;
            }
        } catch (error) {
            console.error('Error al parsear el mensaje:', error);
        }
    };

    gameSocket.onerror = function(error) {
        console.error('Error en la conexión WebSocket:', error);
        hideShowGameSelect(".gameSelectionButtons", "show");
        gameRunning = 0;
    };

    gameSocket.onclose = function(event) {
        console.log('Conexión cerrada');
        hideShowGameSelect(".gameSelectionButtons", "show");
        gameRunning = 0;
    };

    window.gameSocket = gameSocket;
}
