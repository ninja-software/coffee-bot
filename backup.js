var fs = require('fs')
var config = require("./config")

var data_directory = "./" + config.data_location + "/"

module.exports = () => {
  var date = new Date().toString()
  console.log(`Backing up database! Current time: ${date}`)
  fs.mkdir(data_directory + "backups", err => {
    if (err && err.code != 'EEXIST') throw err
    var name = new Date().toISOString().replace('T', ' ').substr(0, 19)
    console.log(`Backup name: ${name}`)
    fs.copyFile(data_directory + "users", data_directory + "backups/" + name, (err) => {
      if (err) throw err;
      console.log('Backup complete!');
    });
  })
}
