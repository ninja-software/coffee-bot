const routes = require('express').Router();
const api = require("./api")

routes.get('/', (req, res) => {
  res.render("index")
});

routes.use('/api', api)

module.exports = routes;
