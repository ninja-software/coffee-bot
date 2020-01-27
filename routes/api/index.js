const routes = require('express').Router();
const config = require("../../config")
var fs = require('fs');

const telegram_bot = require('node-telegram-bot-api');
const bot = new telegram_bot(config.secrets.telegram_api_key, {polling: true});

var num = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
var tens = "twenty thirty forty fifty sixty seventy eighty ninety".split(" ");

function number_to_words(n) {
    if (n < 20) return num[n];
    var digit = n%10;
    if (n < 100) return tens[~~(n/10)-2] + (digit? "-" + num[digit]: "");
    if (n < 1000) return num[~~(n/100)] +" hundred" + (n%100 == 0? "": " " + number_to_words(n%100));
    return number_to_words(~~(n/1000)) + " thousand" + (n%1000 != 0? " " + number_to_words(n%1000): "");
}

/*
/stats - list all members coffee consumption
/today - list todays consumption, break down into individual members
/me - get own stat
*/


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
    case "/stats":
      getData((err, data) => {
        if (err) {
          error = JSON.stringify(err)
          bot.sendMessage(msg.chat.id, `An error occurred! The details are as follows: ${error}`)
        } else {
          data.sort((a, b) => (a.total_cups_consumed < b.total_cups_consumed) ? 1 : -1)
          response = data.map((user) => {
            coffee_message =  user.total_cups_consumed + " coffee"
            if (user.total_cups_consumed == 0 || user.total_cups_consumed > 1) coffee_message += "s"
            today_message = user.cups_consumed_today ? user.cups_consumed_today  : "none"
            average_message = Math.round((user.average_daily_cups + Number.EPSILON) * 100) / 100 + " cup"
            days_message = "they had their first coffee today, congratulations!"
            if (user.days_since_first_coffee != 0) {
              days_message = "they had their first coffee " + user.days_since_first_coffee + " day"
              if (user.days_since_first_coffee > 0) days_message += "s"
              days_message += " ago."
            }
            if (user.average_daily_cups != 0) average_message += "s"
            return `${user.real_name} has consumed ${coffee_message} in total, ${today_message} of them were today. They drink an average of ${average_message} per day, and ${days_message}`
          }).join("\n")
          bot.sendMessage(msg.chat.id, response)
        }
      }, false)
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
        all_times = line.split(":")[2].split(",")
        if (include_data) {
          //Only add list of timestamps to response if include_data is true
          user_data.data = all_times
          user_data.data = removeBlank(user_data.data)
        } else {
          user_data.total_cups_consumed = all_times.length
          user_data.cups_consumed_today = all_times.filter(is_today).length
          user_data.days_since_first_coffee = Math.floor(new Date(new Date() - new Date(parseInt(all_times[0]))) / (1000 * 3600 * 24))
          user_data.average_daily_cups = user_data.total_cups_consumed / user_data.days_since_first_coffee
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
