function ended(resp) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/verifyCaptcha");
    xhr.send(JSON.stringify({
        "key": resp,
        "id": window.location.pathname.substring(1)
    }));
    xhr.onload = function () {
        var j = JSON.parse(xhr.responseText);
        if (j.success == true) {
            window.open(j.url, "_self");
        } else {
            window.location.reload();
        }
    }
}