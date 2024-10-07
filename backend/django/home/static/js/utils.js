function loadHTML(url, placeholderID, callback) {
    if (document.getElementById(placeholderID).innerHTML === "") {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var htmlContent = xhr.responseText;
                    document.getElementById(placeholderID).innerHTML = htmlContent;
                    if (callback) {
                        callback();  
                    }
                } else {
                    console.error('Error al hacer la solicitud AJAX:', xhr.status);
                    if (callback) {
                        callback(); 
                    }
                }
            }
        };
        xhr.send();
    } else {
        document.getElementById(placeholderID).innerHTML = "";
        if (callback) {
            callback(); 
        }
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}