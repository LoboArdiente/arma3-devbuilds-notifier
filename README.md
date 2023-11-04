# Arma 3 dev builds notifier
A very basic program to extract info about new dev builds posts from https://forums.bohemia.net/forums/topic/140837-development-branch-changelog/

> The idea of the program is that it runs in a cronjob so each time it detects a new message u receive a notification

# Usage
**Install dependencies with**
```
npm install
```
> Configure your discord webhook url on the file config.json

**Run using**
```
npm start
```
# TODO
- Improve the way the content is displayed
