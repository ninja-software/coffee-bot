
# Coffee Bot
Node.JS script to track how much coffee each member is drinking.
It uses Express to host a web server on port 3000, and hooks into Telegram to show statistics.

## Screenshots
![Main page](https://raw.githubusercontent.com/ninja-software/coffee-bot/master/screenshots/coffee_bot.png)
![User management](https://raw.githubusercontent.com/ninja-software/coffee-bot/master/screenshots/dropdown.png)
![Telegram bot](https://raw.githubusercontent.com/ninja-software/coffee-bot/master/screenshots/telegram.png)

## Install
```
git clone https://github.com/ninja-software/coffee-bot
cd coffee-bot
sudo ./install.sh
```
Edit secrets.js and fill in the required information.

You need to have Node.JS and NPM installed for this application to run.

This will create ```/etc/systemd/system/coffeetrack.service``` and automatically enable and start the service.

After running the install script, the program will be run at boot time using Nodemon.

If you are using the Telegram bot, and want command autocompletion, go to the BotFather and run /setcommands. After choosing your bot, send this message
drink - Increments your coffee counter
stats - Gives detailed statistics about everyone's coffee consumption
today - Shows statistics about today's coffee consumption
me - Shows statistics about your coffee consumption

## Update
Running git pull will replace some of your custom files such as secrets.js, instead, use the update.sh shell script to update.
```
./update.sh
```

## Manage server
To stop the server run 
```
systemctl stop coffeetrack.service
```
To start again, run 
```
systemctl start coffeetrack.service
```
To disable the server from running on boot, run 
```
systemctl disable coffeetrack.service
```
To enable again, run 
```
systemctl enable coffeetrack.service
```

## Use
There will be 0 users by default, you can create, delete, and edit users using the hamburger menu in the top right corner of the index of the server.

Deleted users are not removed from the database, they are rather hidden so they still count towards statistics. To fully remove a user, remove their line from data_directory/users, to un-hide a user change the 1 at the start of their line to at 0.

The web server has an API, you can find the documentation at http://localhost:3000/api

The Telegram bot supports the following commands:
```
/help
/drink
/stats
/today
/me
```
If the bot says you are not in the database, create a user with the same *real name* as your Telegram first name.
