
# Coffee Bot
Node.JS script to track how much coffee each member is drinking.
It uses Express to host a web server on port 3000, and hooks into Telegram to show statistics.

## Install
```
git clone https://github.com/ninja-software/coffee-bot
cd coffee-bot
sudo ./install.sh
```
Edit secrets.js
You have to place your Telegram API key.

This will create ```/etc/systemd/system/coffeetrack.service``` and automatically enable and start the service.

After running the install script, the program will be run at boot time using Nodemon. You will have to place your Telegram API key in the secrets.js file fo

## Manage server
To stop the server run ```systemctl stop coffeetrack.service```
To start again, run ```systemctl start coffeetrack.service```
To disable the server from running on boot, run ```systemctl disable coffeetrack.service```
To enable again, run ```systemctl enable coffeetrack.service```

## Use
There will be 0 users by default, you can create, delete, and edit users using the hamburger menu in the top right corner of the index of the server.

Deleted users are not removed from the database, they are rather hidden so they still count towards statistics. To fully remove a user, remove their line from data_directory/users, to un-hide a user change the 1 at the start of their line to at 0.

The web server has an API, you can find the documentation at http://localhost:3000/api

The Telegram bot supports the following commands:
```
/drink
/stats
/today
/me
```
If the bot says you are not in the database, create a user with the same *real name* as your Telegram first name.
