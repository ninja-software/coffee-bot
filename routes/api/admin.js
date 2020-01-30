const routes = require('express').Router();
const config = require("../../config")

routes.post('/logout', (req, res) => {
  req.session.destroy()
  res.status(200).json({success: true})
})

module.exports = routes;
