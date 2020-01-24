const express = require('express');
const app = express()
const routes = require('./routes');
var path = require('path')

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'))

app.use('/', routes);

app.listen(3000, () => {
  console.log('App listening on port 3000');
});
