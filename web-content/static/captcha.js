function ended(resp) {
    document.getElementById("load").style.display = "";
    document.getElementById("captchaContainer").style.display = "none";
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

function showCaptcha() {
    document.getElementById("load").style.display = "none";
    document.getElementById("captchaContainer").style.display = "";
}