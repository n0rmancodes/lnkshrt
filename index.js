const http = require("http");
const fs = require("fs");
const url = require("url");

if (!fs.existsSync(__dirname + "/config.json")) {
    if (process.env.H_CAPTCHA) {var c = true; var ck = process.env.H_CAPTCHA;} else {var c = false;}
    if (process.env.PORT) {var p = process.env.PORT;} else {var p = 3003;} 
    if (c == false) {
        var j = JSON.stringify({
            allowPasswords: true,
            allowCaptcha: false,
            idLength: 5,
            port: p
        });
    } else {
        var j = JSON.stringify({
            allowPasswords: true,
            allowCaptcha: true,
            hCaptchaKey: ck,
            idLength: 5,
            port: p
        });
    }
    fs.writeFileSync(__dirname + "/config.json", j);
}

const cheerio = require("cheerio");
const {verify} = require("hcaptcha");
const bcrypt = require("bcrypt");
const config = JSON.parse(fs.readFileSync(__dirname + "/config.json"))
const port = config.port || 3333;
console.log("running @ port " + port);

http.createServer(runServer).listen(port);

function runServer(req, res) {
    var requestUrl = url.parse(req.url, true);
    var path = requestUrl.pathname;
    var pp = path.split("/").slice(1);
    switch (pp[0]) {
        case "api": 
            if (pp[1]) {
                if (pp[1] == "createUrl") {
                    if (!fs.existsSync(__dirname + "/shorts/")) {fs.mkdirSync(__dirname + "/shorts/");}
                    if (req.method.toLowerCase() == "post") {
                        var body = "";
                        req.on('data', function (data) {
                            body += data;
                        });
                        req.on('end', function() {
                            var json = JSON.parse(body);
                            if (!json.url | !isURL(json.url)) {
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": "needsMoreData",
                                        "message": "Invalid URL.",
                                        "fix": "Enter a valid url."
                                    }
                                });
                                res.writeHead(400, {
                                    "Allow-Access-Content-Control": "*",
                                    "Content-Type": "application/json"
                                });
                                res.end(j);
                            } else {
                                var id = createId();
                                if (json.securityLevel == "1" | !json.securityLevel) {
                                    var json = JSON.stringify({
                                        "id": id,
                                        "url": json.url,
                                        "securityLevel": json.securityLevel
                                    })
                                } else if (json.securityLevel == "2" && config.allowPasswords) {
                                    if (json.password == "") {
                                        var j = JSON.stringify({
                                            "success": false,
                                            "err": {
                                                "code": "needsMoreData",
                                                "fix": "Enter a valid password.",
                                                "message": "Invalid password. Please enter a different password."
                                            }
                                        });
                                        res.writeHead(400, {
                                            "Allow-Access-Content-Control": "*",
                                            "Content-Type": "application/json"
                                        })
                                        res.end(j);
                                        return;
                                    }
                                    var json = JSON.stringify({
                                        "id": id,
                                        "url": json.url,
                                        "securityLevel": json.securityLevel,
                                        "password": bcrypt.hashSync(json.password, 10)
                                    });
                                } else if (json.securityLevel == "3" && config.allowCaptcha == true && config.hCaptchaKey) {
                                    var json = JSON.stringify({
                                        "id": id,
                                        "url": json.url,
                                        "securityLevel": json.securityLevel
                                    });
                                } else {
                                    var j = JSON.stringify({
                                        "success": false,
                                        "err": {
                                            "code": "invalidData",
                                            "fix": "Choose a different security method",
                                            "message": "The method you chose is not allowed on this LnkShrt instance."
                                        }
                                    });
                                    res.writeHead(400, {
                                        "Allow-Access-Content-Control": "*",
                                        "Content-Type": "application/json"
                                    })
                                    res.end(j);
                                    return;
                                }
                                fs.writeFileSync("./shorts/" + id + ".json", json);
                                res.writeHead(200, {
                                    "Allow-Access-Content-Control": "*",
                                    "Content-Type": "application/json"
                                });
                                res.end(json);
                            }
                        })
                    } else {
                        var j = JSON.stringify({
                            "success": false,
                            "err": {
                                "code": "methodNotAllowed",
                                "fix": "You must use the POST method",
                                "message": "Your method is not allowed."
                            }
                        });
                        res.writeHead(400, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": "application/json"
                        });
                        res.end(j);
                    }
                } else if (pp[1] == "attempt" && pp[2]) {
                    if (req.method == "POST") {
                        var body = "";
                        req.on('data', function (data) {
                            body += data;
                        });
                        req.on('end', function() {
                            var json = JSON.parse(body);
                            if (!json.password) {
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": "needsMoreData",
                                        "fix": "Enter a password.",
                                        "message": "There is no password."
                                    }
                                });
                                res.writeHead(400, {
                                    "Allow-Access-Content-Control": "*",
                                    "Content-Type": "application/json"
                                });
                                res.end(j);
                            } else {
                                if (fs.existsSync(__dirname + "/shorts/" + pp[2] + ".json")) {
                                    var jsonD = JSON.parse(fs.readFileSync(__dirname + "/shorts/" + pp[2] + ".json"));
                                    if (bcrypt.compareSync(json.password, jsonD.password)) {
                                        var j = JSON.stringify({
                                            "url": jsonD.url
                                        })
                                        res.writeHead(200, {
                                            "Allow-Access-Content-Control": "*",
                                            "Content-Type": "application/json"
                                        });
                                        res.end(j);
                                    } else {
                                        var j = JSON.stringify({
                                            "success": false,
                                            "err": {
                                                "code": "invalidPassword",
                                                "fix": "Enter the valid password.",
                                                "message": "Incorrect password."
                                            }
                                        })
                                        res.writeHead(400, {
                                            "Allow-Access-Content-Control": "*",
                                            "Content-Type": "application/json"
                                        });
                                        res.end(j);
                                    }
                                } else {
                                    var j = JSON.stringify({
                                        "success": false,
                                        "err": {
                                            "code": "invalidId",
                                            "fix": "Try again later.",
                                            "message": "This ID does not exist."
                                        }
                                    })
                                    res.writeHead(400, {
                                        "Allow-Access-Content-Control": "*",
                                        "Content-Type": "application/json"
                                    });
                                    res.end(j);
                                }
                            }
                        })
                    } else {
                        var j = JSON.stringify({
                            "success": false,
                            "err": {
                                "code": "methodNotAllowed",
                                "fix": "You must use the POST method",
                                "message": "Your method is not allowed."
                            }
                        });
                        res.writeHead(400, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": "application/json"
                        });
                        res.end(j);
                    }
                } else if (pp[1] == "verifyCaptcha") {
                    if (req.method == "POST") {
                        var body = "";
                        req.on('data', function (data) {
                            body += data;
                        });
                        req.on('end', function() {
                            body = JSON.parse(body);
                            verify(config.hCaptchaKey, body.key).then(function () {
                                var url = JSON.parse(fs.readFileSync(__dirname + "/shorts/" + body.id + ".json")).url;
                                var j = JSON.stringify({
                                    "success": true,
                                    "url": url
                                });
                                res.writeHead(200, {
                                    "Allow-Access-Content-Control": "*",
                                    "Content-Type": "application/json"
                                });
                                res.end(j)
                            }).catch(function(err) {
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "message": err.message,
                                        "code": err.code
                                    }
                                });
                                res.writeHead(400, {
                                    "Allow-Access-Content-Control": "*",
                                    "Content-Type": "application/json"
                                });
                                res.end(j);
                            })
                        });
                    } else {
                        var j = JSON.stringify({
                            "err": {
                                "code": "methodNotAllowed",
                                "fix": "You must use the POST method",
                                "message": "Your method is not allowed."
                            }
                        });
                        res.writeHead(400, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": "application/json"
                        });
                        res.end(j);
                    }
                } else if (pp[1] == "verifyBP") {
                    if (requestUrl.query.code && requestUrl.query.id) {
                        if (!fs.existsSync(__dirname + "/private/bp-db.json")) {
                            var j = JSON.stringify({
                                "success": false,
                                "err": {
                                    "code": "invalidCode",
                                    "fix": "Complete a captcha to get a new one.",
                                    "message": "Your code either expired or is invalid."
                                }
                            });
                            res.writeHead(400, {
                                "Allow-Access-Content-Control": "*",
                                "Content-Type": "application/json"
                            });
                            res.end(j);
                        } else {
                            if (isValidBypass(requestUrl.query.code)) {
                                fs.readFile(__dirname + "/shorts/" + requestUrl.query.id + ".json", function(err, resp) {
                                    if (err) {
                                        res.writeHead(400, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        res.end(JSON.stringify({
                                            "success": false,
                                            "err": {
                                                "message": err.message,
                                                "code": err.code
                                            }
                                        }));
                                    } else {
                                        var j = JSON.parse(resp);
                                        res.writeHead(200, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        res.end(JSON.stringify({
                                            "success": true,
                                            "url": j.url
                                        }));
                                    }
                                })
                            } else {
                                var j = JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": "invalidCode",
                                        "fix": "Complete a captcha to get a new one.",
                                        "message": "Your code either expired or is invalid."
                                    }
                                });
                                res.writeHead(400, {
                                    "Allow-Access-Content-Control": "*",
                                    "Content-Type": "application/json"
                                });
                                res.end(j);
                            }
                        }
                    } else {
                        var j = JSON.stringify({
                            "success": false,
                            "err": {
                                "code": "invalidQuery",
                                "fix": "Add a valid bypass code and link ID.",
                                "message": "There is no bypass code in your request."
                            }
                        });
                        res.writeHead(400, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": "application/json"
                        });
                        res.end(j);
                    }
                } else {
                    var j = JSON.stringify({
                        "success": false,
                        "err": {
                            "code": "incorrectEndpoint",
                            "fix": "Read the docs and try again",
                            "message": "You entered an incorrect endpoint."
                        }
                    });
                    res.writeHead(400, {
                        "Allow-Access-Content-Control": "*",
                        "Content-Type": "application/json"
                    });
                    res.end(j);
                }
            } else {
                var j = JSON.stringify({
                    "success": false,
                    "err": {
                        "code": "incorrectEndpoint",
                        "fix": "Read the docs and try again",
                        "message": "You entered an incorrect endpoint."
                    }
                });
                res.writeHead(400, {
                    "Allow-Access-Content-Control": "*",
                    "Content-Type": "application/json"
                });
                res.end(j);
            }
        return;

        default: 
            if (fs.existsSync(__dirname + "/web-content/static" + path + "index.html")) {
                fs.readFile(__dirname + "/web-content/static" + path + "index.html" , function(err, resp) {
                    if (err) {
                        res.writeHead(500, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": "text/plain"
                        });
                        res.end(err.message);
                    } else {
                        res.writeHead(200, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": "text/html"
                        });
                        res.end(resp);
                    }
                });
            } else if (fs.existsSync(__dirname + "/web-content/static" + path)) {
                fs.readFile(__dirname + "/web-content/static" + path, function(err, resp) {
                    if (err) {
                        res.writeHead(500, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": "text/plain"
                        });
                        res.end(err.message);
                    } else {
                        res.writeHead(200, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": mime(path)
                        });
                        res.end(resp);
                    }
                });
            } else if (fs.existsSync(__dirname + "/shorts/") && fs.existsSync(__dirname + "/shorts/" + pp[0] + ".json")) {
                fs.readFile(__dirname + "/shorts/" + pp[0] + ".json", function(err, resp) {
                    var d = JSON.parse(resp);
                    if (d.securityLevel == "1" || !d.securityLevel) {
                        res.writeHead(302, {
                            "Location": d.url,
                        });
                        res.end();
                    } else if (d.securityLevel == "2") {
                        fs.readFile(__dirname + "/web-content/dynamic/unlock.html", function(err, resp) {
                            if (!err) {
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "text/html"
                                })
                                res.end(resp);
                            } else {
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "text/plain"
                                });
                                res.end(err.message);
                            }
                        })
                    } else if (d.securityLevel == "3") {
                        fs.readFile(__dirname + "/web-content/dynamic/captcha.html", function(err, resp) {
                            if (!err) {
                                var $ = cheerio.load(resp);
                                $(".h-captcha").attr("data-sitekey", config.hCaptchaKey);
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "text/html"
                                });
                                res.end($.html());
                            } else {
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "text/plain"
                                });
                                res.end(err.message);
                            }
                        })
                    }
                });
            } else {
                fs.readFile(__dirname + "/error-pages/404.html", function(err, resp) {
                    if (err) {
                        res.writeHead(500, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": "text/plain"
                        });
                        res.end(err.message);
                    } else {
                        res.writeHead(200, {
                            "Allow-Access-Content-Control": "*",
                            "Content-Type": mime(path)
                        });
                        res.end(resp);
                    }
                })
            }
        }
    }

function isURL(str) {
    var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
}

function createId() {
    var result = "";
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    for (var c = 0; c < config.idLength; c++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function createBypass() {
    var result = "";
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_$%()';
    for (var c = 0; c < 25; c++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (!fs.existsSync(__dirname + "/private/bp-db.json")) {fs.writeFileSync(__dirname + "/private/bp-db.json", "[]");}
    var j = JSON.parse(fs.readFileSync(__dirname + "/private/bp-db.json"));
    j.push({key: result, dateGen: new Date() * 1})
    fs.writeFileSync(__dirname + "/private/bp-db.json", JSON.stringify(j));
    return result;
}

function removeBypass(t) {
    if (t.length !== 25) {return null;}
    if (!fs.existsSync(__dirname + "/private/bp-db.json")) {return true;}
    else {
        var j = JSON.parse(fs.readFileSync(__dirname + "/private/bp-dp.json"));
        var nj = [];
        for (var c in j) {
            if (j[c].key == t) {continue;} else {nj.push(j[c])}
        }
        nj = JSON.stringify(nj);
        fs.writeFileSync(__dirname + "/private/bp-db.json", nj);
        return true;
    }
}

function isValidBypass(t) {
    if (t.length !== 25) {return false;}
    if (!fs.existsSync(__dirname + "/private/bp-db.json")) {return false;}
    else {
        var j = JSON.parse(fs.readFileSync(__dirname + "/private/bp-db.json"));
        for (var c in j) {
            if (j[c].key == t) {
                if (((new Date() * 1) - j[c].dateGen) > 21600000) {removeBypass(t); return false;}
                return true;
            } else {continue;}
        }
        return false;
    }
}

function mime(file) {
    switch (file.split(".")[file.split(".").length - 1]) {
        case "html":
            return "text/html";
        case "css":
            return "text/css";
        case "json":
            return "application/json";
        case "js":
            return "application/javascript";
        case "jpg":
            return "image/jpeg";
        case "png":
            return "image/png";
        case "gif":
            return "images/gif";
        case "svg":
            return "image/svg+xml";
        case "xml":
            return "application/xml";
        case "json":
            return "application/json";
        default:
            return "text/plain";
    }
}