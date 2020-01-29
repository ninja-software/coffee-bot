const express = require('express');
const app = express()
const routes = require('./routes');
var path = require('path')

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
