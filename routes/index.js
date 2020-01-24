const routes = require('express').Router();
const api = require("./api")

//Create body-parser instance to parse application/x-www-form-urlencoded content
var bodyParser = require('body-parser').urlencoded({ extended: true })

routes.get('/', (req, res) => {
  res.render("index")
});

//Make sure to use the body parser in the API!
routes.use('/api', bodyParser, api)

module.exports = routes;
