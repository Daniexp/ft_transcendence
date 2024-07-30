function loadHTML(url, placeholderID) {
    // REQUEST A LA VISTA
    if(document.getElementById(placeholderID).innerHTML === ""){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var htmlContent = xhr.responseText;
                    // SUBSTITUIR EL PLACEHOLDER DEL HTML POR EL NUEVO TEXTO
                    document.getElementById(placeholderID).innerHTML = htmlContent;
                    return 200;
                } else {
                    console.error('Error al hacer la solicitud AJAX:', xhr.status);
                    return 400;
                }
            }
        };
        xhr.send();
    }
    else{
        document.getElementById(placeholderID).innerHTML = ""
        return 200;
    }
    return 400;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}