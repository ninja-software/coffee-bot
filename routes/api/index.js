const routes = require('express').Router();
const config = require("../../config")
var fs = require('fs');

const telegram_bot = require('node-telegram-bot-api');
const bot = new telegram_bot(config.secrets.telegram_api_key, {polling: true});

/*
/drink - increment coffee count for command issuer
/stats - list all members coffee consumption
/today - list todays consumption, break down into individual members
/me - get own stat
*/

var num = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
var tens = "twenty thirty forty fifty sixty seventy eighty ninety".split(" ");

function number_to_words(n) {
    if (n < 20) return num[n];
    var digit = n%10;
    if (n < 100) return tens[~~(n/10)-2] + (digit? "-" + num[digit]: "");
    if (n < 1000) return num[~~(n/100)] +" hundred" + (n%100 == 0? "": " " + number_to_words(n%100));
    return number_to_words(~~(n/1000)) + " thousand" + (n%1000 != 0? " " + number_to_words(n%1000): "");
}


bot.on('message', (msg) => {
  switch (msg.text) {
    case "/drink":
      drinkCoffee("", msg.from.first_name, (err, data) => {
        if (err) {
          error = JSON.stringify(err)
          bot.sendMessage(msg.chat.id, `An error occurred! The details are as follows: ${error}`)
        } else if (data == -1) {
          bot.sendMessage(msg.chat.id, `There is no user named "${msg.from.first_name}" in the coffee database!`)
        } else {
          bot.sendMessage(msg.chat.id, data.message)
        }
      })
      break

  }
});

//TODO: Create a better logging function that outputs errors to stdout and appends them to file for easier debugging
//TODO: Fix inconsistent casing, eg. validateRealName(real_name)
//TODO: Make the drinkCoffee method return the number of coffees that user has drank that day
//TODO: Consider using sqlite or some ORM instead of a delimited text file, this may not be necessary but for large amounts of data this implementation might become too slow
//TODO: Move code from new_user API into a newUser function
//TODO: Comment res.json calls

//To parse POST url-encoded bodies
var bodyParser = require('body-parser')
routes.use(bodyParser.urlencoded({
  extended: true
}));

dataPath = process.cwd() + "/" + config.data_location + "/"
dataFile = dataPath + "users"

function is_today(timestamp) {
  var today = new Date()
  if (today.setHours(0,0,0,0) == new Date(parseInt(timestamp)).setHours(0,0,0,0)) return true
  return false
}

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

function drinkCoffee(username, real_name, callback) {
  fs.readFile(dataFile, (err, data) => {
    if (err) {
      console.log("drinkCoffee: Error reading users file!")
      console.log(err)
      callback(err, false)
    } else {
      var content = data.toString()
      var lines = removeBlank(content.split("\n"))
      var wrote = false
      var coffee_timestamps
      for (var line_number in lines) {
        line = lines[line_number]
        if (line.split(":")[0] == username || line.split(":")[1] == real_name) {
          if (line.charAt(line.length - 1) != ":") {
            lines[line_number] += ","
          }
          //Append the current unix timestamp
          coffee_timestamps = lines[line_number].split(":")[2].split(",")
          coffee_timestamps = coffee_timestamps.filter(is_today)
          lines[line_number] += +new Date()
          wrote = true
        }
      }
      if (wrote) {
        fs.writeFile(dataFile, lines.join("\n"), (err) => {
          if (err) {
            console.log("drinkCoffee: Error writing to users file!")
            console.log(err)
            callback(err, {amount: -1})
          } else {
            amount = coffee_timestamps.length
            coffees = number_to_words(amount) + " coffee"
            if (amount > 1) coffees += "s"
            message = amount ? `You have drunk ${coffees} today!` : "This is your first coffee today!"      
            callback(err, {amount: amount, message: message})
          }
        })
      } else {
        callback(err, {amount: -1})
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

routes.post('/new_user', (req, res) => {
  error = validateUsername(req.body.username)
  if (!error) {
    error = validateRealName(req.body.real_name)
  }
  if (error) {
    res.status(400).json({success: false, error: error})
  } else {
    getUser(req.body.username, null, function(err, data) {
      if (data.length != 0) {
        res.status(400).json({success: false, error: "Username is taken!"})
      } else {
        //Construct base line for new user
        line = req.body.username + ":" + req.body.real_name + ":\n"
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

routes.post('/drink_coffee', (req, res) => {
  drinkCoffee(req.body.username, req.body.real_name, (err, data) => {
    if (err) {
      res.status(500).json({success: false, error: err})
    } else {
      if (data.amount >= 0) {
        res.status(200).json({success: true, data: data})
      } else {
        res.status(400).json({success: false, error: "User not found!"})
      }
    }
  })
});

routes.post('/delete_user', (req, res) => {
  deleteUser(req.body.username, (err, data) => {
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

routes.post('/update_user', (req, res) => {
  if (req.body.new_username) {
    error = validateUsername(req.body.new_username)
  }
  if (!error && req.body.new_real_name) {
    error = validateRealName(req.body.new_real_name)
  }
  if (error) {
    res.status(400).json({success: false, error: error})
  } else {
    updateUser(req.body.username, req.body.new_username, req.body.new_real_name, (err, data) => {
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
