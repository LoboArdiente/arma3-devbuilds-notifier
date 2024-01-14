# Arma 3 Development Branch Changelog Notifier

This Node.js script scrapes information from the [Arma 3 Development Branch Changelog](https://forums.bohemia.net/forums/topic/140837-development-branch-changelog/). It checks if the last post ID is the same as the one stored in the configuration file. If there's a new post, it sends a formatted Discord webhook message using Markdown.

### Installation

1. Clone the repo

   ```sh
   git clone https://github.com/LoboArdiente/arma3-devbuilds-notifier.git
   ```
2. Install NPM packages

   ```sh
   npm install
   ```
3. Enter your discord webhook url `config.json`

   ```js
   "webhook_url": 'ENTER YOUR WEBHOOK';
   ```
### Example

![](https://i.gyazo.com/80c4a476c367a4536f15c716fe272207.png)
