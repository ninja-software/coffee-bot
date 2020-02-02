const routes = require('express').Router();
const config = require("../../config")
const fs = require('fs');

const data_directory = process.cwd() + "/" + config.data_location + "/"
const backups_directory = data_directory + "backups"

function getBackups(callback) {
  fs.readdir(backups_directory, (err, files) => {
    callback(err, files)
  });
}

function restoreBackup(name, callback) {
  fs.copyFile(backups_directory + "/" + name, data_directory + "users", (err) => {
    callback(err)
  });
}

routes.post('/logout', (req, res) => {
  req.session.destroy()
  res.status(200).json({success: true})
})

routes.get("/backups", (req, res) => {
  getBackups((err, files) => {
    if (err) {
      res.json({success: false, error: err})
    } else {
      res.json({success: true, backups: files})
    }
  })
})

routes.post("/restore_backup", (req, res) => {
  restoreBackup(req.body.name, (err) => {
    if (err) {
      res.json({success: false, error: err})
    } else {
      res.json({success: true})
    }
  })
})

module.exports = routes;
