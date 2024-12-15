// Author: Brandon Hook
//
// Copyright (c) 2024 Brandon Hook. All rights reserved.
// This work is licensed under the terms of the MIT license.  
// For a copy, see <https://opensource.org/licenses/MIT>.

import { CommandInteraction, Interaction, InteractionResponse, SlashCommandBuilder } from 'discord.js';

export interface SlashCommands {
    /**
     * The Slash Command that will be registered to the application.
     */
    Command: SlashCommandBuilder,
    /**
     * The functional code to execute when the slash command is ran. Should be triggered by client's Events.InteractionCreate
     * 
     * @param interaction Pass through argument to catch the specific details of the slahs command.
     * 
     * @returns 
     */
    Execute: (interaction: CommandInteraction) => Promise<InteractionResponse<boolean> | undefined>
    InteractionCreateFilter?: (interaction: Interaction) => Promise<void>
}