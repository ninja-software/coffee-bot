const config = require("./config")

var requests = {}

setInterval(() => {requests = {}}, 60000)

module.exports = (req, res, next) => {
  key = req.url.split("/").join("")
  if (config.rate_limits[key]) {
    if (requests[key])
      requests[key]++
    else
      requests[key] = 1
    if (requests[key] > config.rate_limits[key]) {
      res.status(429).json({success: false, error: "You are sending requests too fast!"})
    }
  }
  next()
}
