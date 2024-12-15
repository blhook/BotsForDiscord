// Author: Brandon Hook
//
// Copyright (c) 2024 Brandon Hook. All rights reserved.
// This work is licensed under the terms of the MIT license.  
// For a copy, see <https://opensource.org/licenses/MIT>.
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { TOKEN } from './constants/secrets';
import { commands } from './commands';

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds],
 });

client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(TOKEN);

// Catch all root command events.
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    console.log(commandName);
    const foundCommand = commands.find(u => u.Command.name == commandName);
    if (foundCommand) {
      foundCommand.Execute(interaction);
    }
  }
});

// Generically loop through all commands and trigger their respective `InteractionCreateFilter` method, if available. 
client.on(Events.InteractionCreate, async (interaction) => {
  commands.forEach((command) => {
    if (command.InteractionCreateFilter)
      command.InteractionCreateFilter(interaction);
  });
});