
function sendMessage(message) {

    if (window.gameSocket.readyState === WebSocket.OPEN) {
        window.gameSocket.send(message);
    } else {
        console.error('La conexión WebSocket no está abierta.');
    }
}

function sendPlayerMessage(uniqueId, value) {
    const data = {
        "inputMsg": {
            "player": {}
        }
    };
    data.inputMsg.player[uniqueId] = value;
    console.log("Enviando mensaje:", JSON.stringify(data));
    sendMessage(JSON.stringify(data));
}

//SAME FOR 2 PLAYERS LOCALY BUT WE ADD NEW KEYs TO LISTEN IN ANOTHER FUNCTION
function handleKeysOnePlayer(event) {
    if (event.key === 'ArrowUp' || event.keyCode === 38) {
        console.log('Flecha arriba presionada');
        sendPlayerMessage(uniqueID, "1");
    } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        console.log('Flecha abajo presionada');
        sendPlayerMessage(uniqueID, "-1");
    }
}

