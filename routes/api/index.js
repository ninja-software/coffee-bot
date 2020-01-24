const routes = require('express').Router();
const config = require("../../config")
var fs = require('fs');

//TODO: Switch some methods to POST instead of GET, I used GET for testing as it's easier to send GET requests from a browser
//TODO: Create a better logging function that outputs errors to stdout and appends them to file for easier debugging
//TODO: Fix inconsistent casing, eg. validateRealName(real_name)
//TODO: Make the drinkCoffee method return the number of coffees that user has drank that day
//TODO: Consider using  sqlite or some ORM instead of a delimited text file, this may not be necessary but for large amounts of data this implementation might become too slow

//To parse POST url-encoded bodies
var bodyParser = require('body-parser')
routes.use(bodyParser.urlencoded({
  extended: true
}));

dataPath = process.cwd() + "/" + config.data_location + "/"
dataFile = dataPath + "users"

function validateUsername(username) {
  username_regex = config.validation.username_regex
  if (!username) {
    return "Please provide a username"
  } else if (!username_regex.test(username)) {
    return "Invalid username! Only alphanumeric characters and underscores are allowed, 3-20 characters."
  }
  return ""
}

function validateRealName(real_name) {
  real_name_regex = config.validation.real_name_regex
  if (!real_name) {
    return "Please provide a name!"
  } else if (!real_name_regex.test(real_name)) {
    return "Invalid name! Only a-z, spaces and dashes are allowed, 2-20 characters."
  }
  return ""
}

function removeBlank(data) {
  return data.filter((element) => { return element != "" })
}

function getData(callback, include_data = true) {
  fs.readFile(dataFile, function(err, data) {
    if (err) {
      callback(err,data)
    } else {
      var users = data.toString()
      //Get users array from list of lines
      users = users.split("\n")
      //Remove empty lines as they can mess with the parsing
      users = removeBlank(users)
      //Construct JSON array from lines
      var json_data = users.map((line) => {
        var user_data = {}
        user_data.username = line.split(":")[0]
        user_data.real_name = line.split(":")[1]
        //Get list of when coffee was drank for user
        if (include_data) {
          //Only add list of timestamps to response if include_data is true
          user_data.data = line.split(":")[2].split(",")
          user_data.data = removeBlank(user_data.data)
        }
        return user_data
      })
      callback(err, json_data)
    }
  });

}

function getUser(username, real_name, callback) {
  getData(function(err, data) {
    if (err) {
      callback(err, data)
    } else {
      //Filter all results down to the desired user
      if (username) {
        data = data.filter((user) => { return user.username == username })
      }
      if (real_name) {
        data = data.filter((user) => { return user.real_name == real_name })
      }
      if (data.length == 0) {
        callback(err, [])
      } else {
        callback(err, data[0])
      }
    }
  }, true)
}

function drinkCoffee(username, callback) {
  fs.readFile(dataFile, (err, data) => {
    if (err) {
      console.log("drinkCoffee: Error reading users file!")
      console.log(err)
      callback(err, false)
    } else {
      var content = data.toString()
      var lines = removeBlank(content.split("\n"))
      var wrote = false
      for (var line_number in lines) {
        line = lines[line_number]
        if (line.split(":")[0] == username) {
          if (line.charAt(line.length - 1) != ":") {
            lines[line_number] += ","
          }
          //Append the current unix timestamp
          lines[line_number] += +new Date()
          wrote = true
        }
      }
      if (wrote) {
        fs.writeFile(dataFile, lines.join("\n"), (err) => {
          if (err) {
            console.log("drinkCoffee: Error writing to users file!")
            console.log(err)
            callback(err, false)
          } else {
            callback(err, true)
          }
        })
      } else {
        callback(err, false)
      }
    }
  });
}

function deleteUser(username, callback) {
  fs.readFile(dataFile, (err, data) => {
    if (err) {
      console.log("deleteUser: Error reading users file!")
      console.log(err)
      callback(err, false)
    } else {
      var content = data.toString()
      var lines = removeBlank(content.split("\n"))
      lines = lines.filter((line) => {
        return line.split(":")[0] != username
      })
      fs.writeFile(dataFile, lines.join("\n"), (err) => {
        if (err) {
          console.log("deleteUser: Error writing to users file!")
          console.log(err)
          callback(err, false)
        } else {
          callback(err, true)
        }
      })
    }
  });
}

function updateUser(username, new_username, new_real_name, callback) {
  fs.readFile(dataFile, (err, data) => {
    if (err) {
      console.log("updateUser: Error reading users file!")
      console.log(err)
      callback(err, false)
    } else {
      var content = data.toString()
      var lines = removeBlank(content.split("\n"))
      lines = lines.map((line) => {
        if (line.split(":")[0] != username) {
          return line
        }
        new_line = line.split(":")
        if (new_username) {
          new_line[0] = new_username
        }
        if (new_real_name) {
          new_line[1] = new_real_name
        }
        return new_line.join(":")
      })
      fs.writeFile(dataFile, lines.join("\n"), (err) => {
        if (err) {
          console.log("updateUser: Error writing to users file!")
          console.log(err)
          callback(err, false)
        } else {
          callback(err, true)
        }
      })
    }
  });
}

routes.get('/', (req, res) => {
  res.render("api")
})

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

routes.get('/get_user', (req, res) => {
  getUser(req.query.username, req.query.real_name, function(err, data) {
    if (err) {
      res.status(500).json({success: false, err: error})
    } else {
      if (data.length == 0) {
        res.status(200).json({success: false, error: "User not found!", user: []})
      } else {
        res.status(200).json({success: true, user: data})
      }
    }
  })
});

routes.get('/new_user', (req, res) => {
  error = validateUsername(req.query.username)
  if (!error) {
    error = validateRealName(req.query.real_name)
  }
  if (error) {
    res.status(400).json({success: false, error: error})
  } else {
    getUser(req.query.username, null, function(err, data) {
      if (data.length != 0) {
        res.status(400).json({success: false, error: "Username is taken!"})
      } else {
        //Construct base line for new user
        line = req.query.username + ":" + req.query.real_name + ":\n"
        fs.appendFile(dataFile, line, function (err) {
          if (err) {
            console.log("/api/new_user: Error appending to users file!")
            console.log(err)
            res.status(500).json({success: false, error: err})
          } else {
            res.status(200).json({success: true})
          }
        });
      }
    })
  }
})

routes.get('/drink_coffee', (req, res) => {
  drinkCoffee(req.query.username, (err, data) => {
    if (err) {
      res.status(500).json({success: false, error: err})
    } else {
      if (data) {
        res.status(200).json({success: true})
      } else {
        res.status(400).json({success: false, error: "User not found!"})
      }
    }
  })
});

routes.get('/delete_user', (req, res) => {
  deleteUser(req.query.username, (err, data) => {
    if (err) {
      res.status(500).json({success: false, error: err})
    } else {
      if (data) {
        res.status(200).json({success: true})
      } else {
        res.status(500).json({success: false, error: err})
      }
    }
  })
});

routes.get('/update_user', (req, res) => {
  if (req.query.new_username) {
    error = validateUsername(req.query.new_username)
  }
  if (!error && req.query.new_real_name) {
    error = validateRealName(req.query.new_real_name)
  }
  if (error) {
    res.status(400).json({success: false, error: error})
  } else {
    updateUser(req.query.username, req.query.new_username, req.query.new_real_name, (err, data) => {
      if (err) {
        res.status(500).json({success: false, error: err})
      } else {
        if (data) {
          res.status(200).json({success: true})
        } else {
          res.status(500).json({success: false, error: err})
        }
      }
    })
  }
});


module.exports = routes;
