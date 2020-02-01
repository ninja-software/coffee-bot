const express = require('express');
const app = express()
const routes = require('./routes');
var path = require('path')
var config = require("./config")

var session = require('express-session');
if (config.secrets.telegram_api_key == "<telegram-api-key>") {
  console.error("\x1b[31m" + "Telegram API key is still default, Telegram integration will be disabled." + "\x1b[0m")
}
if (config.secrets.session_key == "<session-key>") {
  throw new Error("Refusing to use default as session key.")
}
if (config.secrets.admin_password == "<admin-password>") {
  throw new Error("Refusing to use default as admin password.")
}
app.use(session({
  secret: config.secrets.session_key,
  maxAge: config.session_length
}));

var backup = require("./backup")
setInterval(backup, config.backup_frequency)

var views = path.join(__dirname, './views')
app.set('view engine', 'ejs');
app.set('views', views)

app.use('/', routes);
app.get("/res/:name", (req, res) => {
  res.sendFile(views + "/res/" + req.params.name)
})

app.listen(3000, () => {
  console.log('App listening on port 3000');
});
