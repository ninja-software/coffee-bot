const routes = require('express').Router();
const api = require("./api")
const rate_limit = require("../rate_limit")

//Create body-parser instance to parse application/x-www-form-urlencoded content
var bodyParser = require('body-parser').urlencoded({ extended: true })

routes.get('/', (req, res) => {
  res.render("index")
});
routes.get('/admin', (req, res) => {
  if (req.session.admin) {
    res.render("admin")
  } else {
    res.render("login")
  }
});

//Make sure to use the body parser in the API!
routes.use('/api', rate_limit, api)
routes.use('/api', bodyParser, api)

module.exports = routes;
