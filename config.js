
var config = {}

config.secrets = require("./secrets")
config.data_location = "data_directory"
//When changing any of these, make sure to update the failed validation error in the validate_username and validate_real_name functions
config.validation = {
  username_regex: /^\w{3,20}$/,
  real_name_regex: /^([a-zA-Z -]{2,20})$/
}

module.exports = config
