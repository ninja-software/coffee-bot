#!/usr/bin/env bash
location="$(pwd)"
rm -rf /tmp/coffee-bot
rm /tmp/secrets.js
git clone https://github.com/ninja-software/coffee-bot /tmp/coffee-bot
mkdir /tmp/data_directory
cp -R data_directory/* /tmp/data_directory
cp secrets.js /tmp/secrets.js
rm -rf $location
mkdir -p $location
cp -R /tmp/coffee_bot/* $location
mkdir data_directory
cp -R /tmp/data_directory/* data_directory
cp /tmp/secrets.js secrets.js
