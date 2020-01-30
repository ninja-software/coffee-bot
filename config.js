
var config = {}

config.secrets = require("./secrets")
config.data_location = "data_directory"
//When changing any of these, make sure to update the failed validation error in the validate_username and validate_real_name functions
config.validation = {
  username_regex: /^\w{3,20}$/,
  real_name_regex: /^([a-zA-Z -]{2,20})$/
}

//All of these limits are measured in requests/minute
config.rate_limits = {
  authenticate: 5
}

//How long the session can exist before expiring, measured in seconds
config.session_length = 1 * 60 * 60 * 1000

module.exports = config
