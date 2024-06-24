function saludar() {
    obtenerHTMLDesdeDjango();
}

function obtenerHTMLDesdeDjango() {
    // REQUEST A LA VISTA
    if(document.getElementById('placeholder').innerHTML === ""){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/login/', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var htmlContent = xhr.responseText;
                    // SUBSTITUIR EL PLACEHOLDER DEL HTML POR EL NUEVO TEXTO
                    document.getElementById('placeholder').innerHTML = htmlContent;
                } else {
                    console.error('Error al hacer la solicitud AJAX:', xhr.status);
                }
            }
        };
        xhr.send();
    }
    else{
        document.getElementById('placeholder').innerHTML = ""
    }
}