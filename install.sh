#!/usr/bin/env bash
npm install
mkdir ./data_directory
touch ./data_directory/users
location=$(pwd)
location="${location//\//\\\/}"
sed "s/{PATH}/$location/g" coffeetrack.service>coffeereplaced.service
sudo -u root -H sh -c "npm install --save -g nodemon"
sudo -u root -H sh -c "cp coffeereplaced.service /etc/systemd/system/coffeetracker.service"
sudo -u root -H sh -c "systemctl enable coffeetracker.service"
sudo -u root -H sh -c "systemctl start coffeetracker.service"
rm coffeereplaced.service
