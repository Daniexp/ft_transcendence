
function sendMessage(message) {

    if (window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.send(message);
    } else {
        console.error('La conexión WebSocket no está abierta.');
    }
}

function handleKeysOnePlayer(event) {
    if (event.key === 'ArrowUp' || event.keyCode === 38) {
        console.log('Flecha arriba presionada');
        sendMessage(JSON.stringify({
        "message": { 
                "player": {
                [uniqueID]: "1"
                }
            }
        }));

        
    } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        console.log('Flecha abajo presionada');
        sendMessage(JSON.stringify({
            "message": { 
                    "player": {
                    [uniqueID]: "-1"
                    }
                }
            }));
    }
}
