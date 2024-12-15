# Bots for Discord (TypeScript)

## General
This project contains the source code for any personal bots that I have created for Discord. This repository assumes that the user has at least a basic understanding of Discord Bots, but refer to [Discord Developer Documents](https://discord.com/developers/docs/intro) and [Discord.js Documents](https://discordjs.guide/#before-you-begin) if not. 

This repository consists of several pieces to begin and get up and running with the bots, but the main core of the code for the unique code interacterion is in the [bots folder](./src/bots). 

## Getting Started
### Prequisites
* Ensure the entirety of the [Discord.js Installation & Preparations](https://discordjs.guide/preparations/) is complete. 
* Download and install an IDE. [VSCodium](https://vscodium.com/) is used to create this project

### Understanding the Code
The code is largely broken into three pieces:
1. [The Bots](./src/bots/)
    * This folder contains all of the different bots with their respective handling. Right now, only [Slash Commands](https://discordjs.guide/creating-your-bot/slash-commands.html#individual-command-files) are supported. 
    * Refer to the individual underlying folder for each bot for information regarding it. 
    * List:
        * [Hunt Request](./src/bots/hunt-bot): A bot meant to help with facilitating helping users find certain items, using a simplified modal. After created, the user is able to continually manage their request. 
1. [The Register](./src/register.ts)
    * This will register any commands exported from [commands](./src/commands/index.ts) to the Discord server. 
    * This code is largely just templated from Fellipe Utaka's tutorial found [here](https://dev.to/fellipeutaka/creating-your-first-discord-bot-using-typescript-1eh6), with slight modifications to respect the basic [SlashCommand](./src/classes/SlashCommands.ts) interface
    * This code runs independently from the main application, and only needs to be ran when a command is added/edited/deleted, but does not need to be re-ran when the underlying functionality of that command changes.
1. [The Main Application](./src//index.ts)
    * This is the code that runs the bots. While mostly uninteresting, it does contain the code to make it work with Discord harmoniously. 

## Running
### One-time Setup
1. Retrieve your specific Discord's Application ID, Guild (Server) ID, and Token. 
1. Paste them into a file called `secrets.ts` under [constants](./src/constants/) as exports
    ```
    export const TOKEN = '<TOKEN>';
    export const APPLICATION_ID = '<APPLICATION_ID>';
    export const GUILD_ID = '<GUILD_ID>';
    ```
1. Run the command `npm install`

### Register Your Commands
Before your Discord server will understand your commands, it needs to be registered. Run:
1. `npm run register`

### Debugging and Running
1. Run `npm run dev` to start the bot and connect to the specified Guild server. 

## License
This project is licensed under MIT. Refer to the [LICENSE](./LICENSE) for more details

This repository is not created by, affiliated with or sponsored by Discord, Inc. and its subsidiaries or its affiliates.