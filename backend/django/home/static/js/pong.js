document.addEventListener("DOMContentLoaded", function() {
    var connectionString = 'ws://' + window.location.host + '/ws/pong/';
    var gameSocket = new WebSocket(connectionString);

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
});
