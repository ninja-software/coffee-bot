
# Coffee Bot
Node.JS script to track how much coffee each member is drinking.
It uses Express to host a web server on port 3000, and hooks into Telegram to show statistics.

To install:
```sudo ./install.sh```
This will create ```/etc/systemd/system/coffeetrack.service``` and automatically enable and start the service.

After running the install script, the program will be run at boot time using nodemon. You will have to place your Telegram API key in the secrets.js file for the Telegram integration to function.

There will be 0 users by default, you can create, delete, and edit users using the hamburger menu in the top right corner of the index of the server.

Deleted users are not removed from the database, they are rather hidden so they still count towards statistics. To fully remove a user, remove their line from data_directory/users, to un-hide a user change the 1 at the start of their line to at 0.

The web server has an API, you can find the documentation at http://localhost:3000/api.

The Telegram bot supports the following commands:
```
/drink
/stats
/today
/me
```
If the bot says you are not in the database, create a user with the same *real name* as your Telegram first name.
