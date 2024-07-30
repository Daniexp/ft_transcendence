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
const uniqueID = getOrGenerateUniqueID();

function initWebSocket(){
    var gameSocket = new WebSocket(`ws://${window.location.host}/ws/pong/${uniqueID}/`);

    gameSocket.onopen = function(event) {
        console.log('Conexión abierta');
    };

    gameSocket.onmessage = function(event) {
        try {
            var data = JSON.parse(event.data);
            console.log('Datos parseados:', data);
            
            if (data && typeof data.message === 'object' && data.message !== null) {
                if (data.message.game_started && typeof data.message.game_started === 'object') { // Verificar si es un objeto
                    console.log('Juego iniciado: players=', data.message.game_started);
                    const gameContainer = document.getElementById('gameContainer');
                    console.log('gameContainer encontrado:', gameContainer);
                    
                    if (gameContainer) {
                        gameContainer.innerHTML = '';
    
                        Object.keys(data.message.game_started).forEach(key => {
                            const element = data.message.game_started[key];
                            const newDiv = document.createElement('div');
                                
                            newDiv.id = key;
                            newDiv.classList.add('gamePlayer');
                            
                            gameContainer.appendChild(newDiv);
                            
                            console.log('Nuevo div añadido:', newDiv);
                        });
                        
                        gameRunning = 1;
                    } else {
                        console.error('gameContainer no encontrado');
                    }
    
                } else if (data.message.players && typeof data.message.players === 'object') {
                    console.log('Actualizando posiciones de jugadores:', data.message.players);
                    const gameContainer = document.getElementById('gameContainer');
    
                    if (gameContainer) {
                        Object.keys(data.message.players).forEach(key => {
                            const player = data.message.players[key];
                            const playerDiv = document.getElementById(key);
    
                            if (playerDiv) {
                                playerDiv.style.left = `${player.position[0]}%`;
                                playerDiv.style.top = `${player.position[1]}%`;
                                
                                console.log('Posición actualizada para:', key, 'a', player.position);
                            } else {
                                console.error('Div no encontrado para el jugador:', key);
                            }
                        });
                    } else {
                        console.error('gameContainer no encontrado');
                    }
                } else {
                    console.log('Datos de jugadores no encontrados o no es un objeto:', data.message.players);
                }
                
                if (data.message.ball) {
                    console.log('Posición de la bola:', data.message.ball.position);
                }
    
                if (typeof data.message === 'string') {
                    console.log('Mensaje de texto recibido:', data.message);
                    if(data.message === "User disconnected") {
                        hideShowGameSelect('.gameSelectionButtons', 'show');
                        hideShowGameSelect('.gamePong', 'hide');
                        gameRunning = 0;
                        gameSocket.close();
                    }
                } else {
                    console.log('Mensaje recibido no es un objeto válido');
                }
                
            } else {
                console.log('Mensaje recibido no tiene una propiedad message válida');
            }
            
        } catch (error) {
            console.error('Error al parsear el mensaje:', error);
        }
    };    
    
    
    gameSocket.onerror = function(error) {
        console.error('Error en la conexión WebSocket:', error);
        hideShowGameSelect(".gameSelectionButtons", "show");
        hideShowGameSelect('.gamePong', 'hide');
        gameRunning = 0;
    };

    gameSocket.onclose = function(event) {
        console.log('Conexión cerrada');
        hideShowGameSelect(".gameSelectionButtons", "show");
        hideShowGameSelect('.gamePong', 'hide');
        gameRunning = 0;
    };

    window.gameSocket = gameSocket;
}
