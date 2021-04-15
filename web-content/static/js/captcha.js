bp();

function bp() {
    if (!localStorage.getItem("bpKey")) {loadCaptcha();}
    else {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/verifyBP?code=" + localStorage.getItem("bpKey") + "&id=" + window.location.pathname.substring(1));
        xhr.send();
        xhr.onload = function () {
            var j = JSON.parse(xhr.responseText);
            if (j.success == true) {
                window.open(j.url, "_self");
            } else {
                loadCaptcha();
            }
        }
    }
}

function loadCaptcha() {
    var s = document.createElement("SCRIPT");
    s.src = "https://hcaptcha.com/1/api.js?onload=showCaptcha";
    s.setAttribute("async", "");
    s.setAttribute("defer", "");
    document.body.append(s);
}

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
            if (j.bypassKey) {localStorage.setItem("bpKey", j.bypassKey);}
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