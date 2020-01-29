#!/usr/bin/env bash
location="$(pwd)"
rm -rf /tmp/coffee-bot
rm /tmp/secrets.js
rm -rf /tmp/data_directory
git clone https://github.com/ninja-software/coffee-bot /tmp/coffee-bot
mkdir /tmp/data_directory
cp -R data_directory/* /tmp/data_directory
cp ./secrets.js /tmp/secrets.js
rm -rf $location
mkdir -p $location
cp -R /tmp/coffee-bot/* $location
mkdir $location/data_directory
cp -R /tmp/data_directory/* $location/data_directory
cp /tmp/secrets.js $location/secrets.js
