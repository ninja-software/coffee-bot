const routes = require('express').Router();
const config = require("../../config")
var fs = require('fs');

//TODO: Switch some methods to POST instead of GET, I used GET for testing as it's easier to send GET requests from a browser

//To parse POST url-encoded bodies
var bodyParser = require('body-parser')
routes.use(bodyParser.urlencoded({
  extended: true
}));

dataPath = process.cwd() + "/" + config.data_location + "/"

function getData(callback, include_data = true) {
  fs.readFile(dataPath + "data", function(err, data) {
    if (err) {
      callback(err,data)
    } else {
      var users = data.toString()
      //Get users array from list of lines
      users = users.split("\n")
      //Remove empty lines as they can mess with the parsing
      users = users.filter((line) => { return line != "" })
      //Construct JSON array from lines
      var json_data = users.map((line) => {
        var user_data = {}
        user_data.username = line.split(":")[0]
        //Get list of when coffee was drank for user
        if (include_data) {
          //Only add list of timestamps to response if include_data is true
          user_data.data = line.split(":")[1].split(",")
        }
        return user_data
      })
      callback(err, json_data)
    }
  });

}

routes.get('/users', (req, res) => {
  getData(function(err, data) {
    if (err) {
      console.log("/api/users: Error reading users file!")
      console.log(err)
      res.status(500).json({success: false, error: err})
    } else {
      res.status(200).json({success: true, users: data})
    }
  }, false)
});

routes.get('/data', (req, res) => {
  getData(function(err, data) {
    if (err) {
      console.log("/api/users: Error reading users file!")
      console.log(err)
      res.status(500).json({success: false, error: err})
    } else {
      res.status(200).json({success: true, users: data})
    }
  }, true)
});

routes.get('/new_user', (req, res) => {
  res.json({name: req.query.name})
})


module.exports = routes;
