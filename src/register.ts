// Author: Brandon Hook
//
// Copyright (c) 2024 Brandon Hook. All rights reserved.
// This work is licensed under the terms of the MIT license.  
// For a copy, see <https://opensource.org/licenses/MIT>.
// Code heavily templated from Fellipe Utaka's tutorial: https://dev.to/fellipeutaka/creating-your-first-discord-bot-using-typescript-1eh6

import { REST, Routes } from 'discord.js';
import { TOKEN, APPLICATION_ID, GUILD_ID } from './constants/secrets';
import { commands } from './commands';

const commandsData = commands.map((command) => command.Command);
console.log(commandsData);

const rest = new REST({ version: '10' }).setToken(TOKEN);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(APPLICATION_ID, guildId),
      {
        body: commandsData,
      }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

deployCommands({guildId: GUILD_ID });