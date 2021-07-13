const fs = require("fs");
const {parse} = require("url");
const express = require("express");
const formidable = require("formidable");
const app = express();
const bcrypt = require("bcrypt");
const {verify} = require("hcaptcha");
const cheerio = require("cheerio");

if (!fs.existsSync(__dirname + "/config.json")) {
  if (process.env.H_CAPTCHA_SK && process.env.H_CAPTCHA_SEC) {
    var c = true;
    var ck = process.env.H_CAPTCHA_SK;
    var se = process.env.H_CAPTCHA_SEC;
  } else {
    var c = false;
    var ck = null;
    var se = null;
  }
  if (process.env.PORT) {var p = process.env.PORT} else {var p = 3333;}
  var j = {
    allowPasswords: true,
    allowCaptcha: c,
    hCaptchaKey: ck,
    hCaptchaSecret: se,
    idLength: 5,
    port: p,
    allowBypassKey: true
  }
  fs.promises.writeFile(__dirname + "/config.json", JSON.stringify(j));
}

const config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));
app.listen(config.port);
app.use(express.static("web-content/static"));

app.post("/api/make", async function(req, res, next) {
  var f = formidable({});
  f.parse(req, async function(err, fields) {
    if (err) {
      res.json({
        success: false,
        err
      })
      return;
    }
    if (!isURL(fields.url)) {
      res.json({
        success: false,
        err: {
          message: "Invalid URL.",
          code: "invalidURL"
        }
      })
      return;
    }
    switch(fields.sec) {
      case "1":
      case undefined: 
        var j = {
          id: createId(),
          url: fields.url,
          securityLevel: 1
        };
        await fs.promises.writeFile(`${__dirname}/shorts/${j.id}.json`, JSON.stringify(j));
        res.json({
          success: true,
          j
        });
      return;
      
      case "2":
        if (!fields.password || fields.password == "") {
          res.json({
            success: false,
            err: {
              message: "Invalid password to set.",
              code: "invalidPass"
            }
          });
          return;
        } else if (config.allowPasswords == false) {
          res.json({
            success: false,
            err: {
              message: "This instance does not allow passworded links.",
              code: "notAllowed"
            }
          });
          return;
        }
        var j = {
          id: createId(),
          url: fields.url,
          securityLevel: 2,
          password: bcrypt.hashSync(fields.password, 10)
        };
        await fs.promises.writeFile(`${__dirname}/shorts/${j.id}.json`, JSON.stringify(j));
        res.json({
          success: true,
          j
        });
      return;

      case "3":
        if (config.allowCaptcha == false) {
          res.json({
            success: false,
            err: {
              message: "Protecting links via Captcha is not allowed on this instance.",
              code: "notAllowed"
            }
          });
          return;
        }
        var j = {
          id: createId(),
          url: fields.url,
          securityLevel: 3
        };
        await fs.promises.writeFile(`${__dirname}/shorts/${j.id}.json`, JSON.stringify(j));
        res.json({
          success: true,
          j
        });
      return;

      default:
        res.json({
          success: false,
          err: {
            message: "Invalid security level.",
            code: "invalidSec"
          }
        })
      return;
    }
  })
});

app.get("/:id", async function(req, res, next) {
  if (fs.existsSync(`${__dirname}/shorts/${req.params.id}.json`)) {
    var j = JSON.parse((await fs.promises.readFile(`${__dirname}/shorts/${req.params.id}.json`)).toString());
    switch(j.securityLevel) {
      case 1:
        res.redirect(j.url);
      return;

      case 2:
        res.sendFile(`${__dirname}/web-content/dynamic/unlock.html`);
      return;

      case 3:
        fs.readFile(`${__dirname}/web-content/dynamic/captcha.html`, function(err, resp) {
          var $ = cheerio.load(resp);
          $(".h-captcha").attr("data-sitekey", config.hCaptchaKey);
          res.send($.html());
        })
      return;
    }
  } else {
    res.sendFile(`${__dirname}/web-content/dynamic/err/404.html`);
  }
});

app.post("/:id", async function(req, res, next) {
  if (fs.existsSync(`${__dirname}/shorts/${req.params.id}.json`)) {
    var j = JSON.parse((await fs.promises.readFile(`${__dirname}/shorts/${req.params.id}.json`)).toString());
    var form = formidable();
    form.parse(req, function(err, fields) {
      if (err) {
        res.json({
          success: false,
          err
        })
        return;
      }
      if (!fields.password) {res.sendFile(`${__dirname}/web-content/dynamic/unlock-wrong.html`);}
      if (bcrypt.compareSync(fields.pass, j.password)) {
        res.redirect(j.url);
      } else {
        res.sendFile(`${__dirname}/web-content/dynamic/unlock-wrong.html`);
      }
    })
  } else {
    res.sendFile(`${__dirname}/web-content/dynamic/err/404.html`);
  }
});

app.get("/api/verifyBP", async function(req, res) {
  var url = parse(req.url, true);
  if (url.query.code && url.query.id) {
    if (isValidBypass(url.query.code)) {
      var j = JSON.parse(await (fs.promises.readFile(`${__dirname}/shorts/${url.query.id}.json`)));
      j.success = true;
      res.json(j);
    } else {
      res.json({success: false})
    }
  }
})

app.post("/api/verifyCaptcha", async function(req, res, next) {
  var form = formidable();
  form.parse(req, function(err, fields) {
    if (err) {
      res.json({
        success: false,
        err
      })
      return;
    }
    if (fields.key && fields.id) {
      verify(config.hCaptchaSecret, fields.key).then(async function(resp) {
        if (resp.success) {
          var j = JSON.parse(await (fs.promises.readFile(`${__dirname}/shorts/${fields.id}.json`)));
          j.bypassKey = createBypass();
          j.success = true;
          res.json(j);
        } else {
          res.json({success: false})
        }
      })
    } else {
      res.json({success: false})
    }
  })
});

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
  if (config.allowBypassKey == null || config.allowBypassKey) {
    var result = "";
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_$%()';
    for (var c = 0; c < 25; c++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (!fs.existsSync(__dirname + "/private/bp-db.json")) {fs.writeFileSync(__dirname + "/private/bp-db.json", "[]");}
    var j = JSON.parse(fs.readFileSync(__dirname + "/private/bp-db.json"));
    j.push({key: result, dateGen: new Date() * 1});
    fs.writeFileSync(__dirname + "/private/bp-db.json", JSON.stringify(j));
    return result;
  } else {
    return null;
  }
}

function removeBypass(t) {
  if (t.length !== 25) {return null;}
  if (!fs.existsSync(__dirname + "/private/") && !fs.existsSync(__dirname + "/private/bp-db.json")) {return true;}
  else {
    var j = JSON.parse(fs.readFileSync(__dirname + "/private/bp-db.json"));
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