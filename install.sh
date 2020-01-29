#!/usr/bin/env bash
if [[ "$EUID" -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi
npm install
npm install --save -g nodemon
mkdir ./data_directory
touch ./data_directory/users
location=$(pwd)
location="${location//\//\\\/}"
sed "s/{PATH}/$location/g" coffeetrack.service>coffeereplaced.service
cp coffeereplaced.service /etc/systemd/system/coffeetracker.service
systemctl enable coffeetracker.service
systemctl start coffeetracker.service
rm coffeereplaced.service
