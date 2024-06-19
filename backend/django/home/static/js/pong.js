
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

function initWebSocket(){
    const uniqueID = getOrGenerateUniqueID();
    var gameSocket = new WebSocket(`ws://${window.location.host}/ws/pong/${uniqueID}/`);

    gameSocket.onopen = function(event) {
        console.log('Conexión abierta');
    };

    gameSocket.onmessage = function(event) {
        console.log('Mensaje recibido:', event.data);
    };

    gameSocket.onerror = function(error) {
        console.error('Error en la conexión WebSocket:', error);
    };

    gameSocket.onclose = function(event) {
        console.log('Conexión cerrada');
    };

    window.gameSocket = gameSocket;
}
