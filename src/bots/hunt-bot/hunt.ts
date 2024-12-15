// Author: Brandon Hook
//
// Copyright (c) 2024 Brandon Hook. All rights reserved.
// This work is licensed under the terms of the MIT license.  
// For a copy, see <https://opensource.org/licenses/MIT>.
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CommandInteraction,
	ComponentType,
	Interaction,
	Message,
	MessageFlags,
	ModalBuilder,
	ModalSubmitInteraction,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputComponentData,
	TextInputStyle,
} from 'discord.js';

import { SlashCommands } from '../../classes';

/**
 * The time in milliseconds. to watch the modal before we can assume it closed without user input. 
 */
const ModalWatchTime = 300000;

/**
 * A list of channels that the user is able to request a hunting request in.
 */
const HuntChannels = ['1316921349809246229', '1316921337582977054'];

/**
 * The slash command's name.
 * Also a prefix for all {@link Content} within this class, to ensure uniqueness across {@link Content} across the entire application.
 */
const CommandName = 'hunt';

/**
 * An object holding all of the displayed content to the user, alongside specific IDs.
 * Intended to be used as an easy mechanism to change messages or handle internationalization.
 */
const Content = {
	errors: {
		invalidChannel: 'This command can only be performed in hunting channels:\r\n'
	},
	messages: {
		command: {
			description: 'Get help looking for an item.'
		},
		followUp: {
			active: 'Your hunt request is now active. Utilize the buttons below to manage the request.',
			deleted: 'Your hunt request is deleted.',
			complete: 'Your hunt request is complete.',
		},
		updated: 'You\'ve updated the hunt request. Use the initial reply to manage the request.',
		completed: 'Hunt Completed!\r\n'
	},
	formatting: {
		bold: '**',
		strikethrough: '~~'
	},
	input: {
		optional: 'N/A',
		link: { id: `${CommandName}-input-link`, inputLabel: 'Link to item', displayLabel: 'Links:' },
		budget: { id: `${CommandName}-input-budget`, inputLabel: 'What is your budget and currency?', displayLabel: 'Budget/Currency:' },
		location: { id: `${CommandName}-input-location`, inputLabel: 'Which location/region are you located in?', displayLabel: 'Location/Region:' },
		condition: { id: `${CommandName}-input-condition`, inputLabel: 'Do you have any condition requirements?', displayLabel: 'Condition:' },
		notes: { id: `${CommandName}-input-notes`, inputLabel: 'Any other notes or limitations?', displayLabel: 'Notes:' },
	},
	modal: {
		base: { id: `${CommandName}-request-base`, displayLabel: 'Hunting Request' },
		edit: { id: `${CommandName}-request-edit`, displayLabel: 'Hunting Request Edit' },
	},
	buttons: {
		manage: {
			delete: { id: `${CommandName}-delete`, displayLabel: 'Delete' },
			edit: { id: `${CommandName}-edit`, displayLabel: 'Edit' },
			complete: { id: `${CommandName}-complete`, displayLabel: 'Complete' },
			reinstate: { id: `${CommandName}-reinstate`, displayLabel: 'Re-enable' },
		}
	}
};

/**
 * This is an ordered list of items that will display in the modal. If this is updated, the retrieval of the values in for deserialization also need to be updated.
 */
const Inputs: TextInputComponentData[] = [
	{ customId: Content.input.link.id, label: Content.input.link.inputLabel, style: TextInputStyle.Short, required: true, type: ComponentType.TextInput },
	{ customId: Content.input.budget.id, label: Content.input.budget.inputLabel, style: TextInputStyle.Short, required: true, type: ComponentType.TextInput },
	{ customId: Content.input.location.id, label: Content.input.location.inputLabel, style: TextInputStyle.Short, required: true, type: ComponentType.TextInput },
	{ customId: Content.input.condition.id, label: Content.input.condition.inputLabel, style: TextInputStyle.Paragraph, required: false, type: ComponentType.TextInput },
	{ customId: Content.input.notes.id, label: Content.input.notes.inputLabel, style: TextInputStyle.Paragraph, required: false, type: ComponentType.TextInput }
];

/**
 * Buttons used for managing the request.
 */
const ManageButtons = {
	Delete: (id: string) => { return new ButtonBuilder().setCustomId(`${Content.buttons.manage.delete.id}-${id}`).setLabel(Content.buttons.manage.delete.displayLabel).setStyle(ButtonStyle.Danger); },
	Edit: (id: string) => { return new ButtonBuilder().setCustomId(`${Content.buttons.manage.edit.id}-${id}`).setLabel(Content.buttons.manage.edit.displayLabel).setStyle(ButtonStyle.Secondary); },
	Confirm: (id: string) => { return new ButtonBuilder().setCustomId(`${Content.buttons.manage.complete.id}-${id}`).setLabel(Content.buttons.manage.complete.displayLabel).setStyle(ButtonStyle.Success); },
	Reinstate: (id: string) => { return new ButtonBuilder().setCustomId(`${Content.buttons.manage.reinstate.id}-${id}`).setLabel(Content.buttons.manage.reinstate.displayLabel).setStyle(ButtonStyle.Success); }
};

export class Hunt implements SlashCommands {
	Command = new SlashCommandBuilder()
		.setName(CommandName)
		.setDescription(Content.messages.command.description);

	Execute = async (interaction: CommandInteraction) => {
		const timeNow = Date.now(); // This will track specific modals that appear and ensure we only fire the submit once. 

		if (!HuntChannels.includes(interaction.channelId)) {
			return interaction.reply({
				content: `${Content.errors.invalidChannel}${HuntChannels.map(i => `https://discord.com/channels/${interaction.guildId}/${i}`).join('\r\n')}`,
				ephemeral: true
			});
		}

		ModalOpen(interaction, timeNow.toString());

		const submitted = await interaction.awaitModalSubmit({
			time: ModalWatchTime,
			filter: i => i.user.id === interaction.user.id && i.customId.includes(timeNow.toString()), // Ensure we are watching the event for the same modal + user that opened it.
		}).catch(() => {
			console.warn('The waiting did not return a result or ran into an error.');
		});

		ModalClose(submitted);
	};

	InteractionCreateFilter = async (interaction: Interaction) => {
		// As the event may be global, kick back if we aren't in the right channel to save time. 
		if (!interaction.channel || !HuntChannels.includes(interaction.channel.id)) {
			return;
		}

		// Base button logic handling. 
		if (interaction.isButton()) {
			if (interaction.customId.includes(`${Content.buttons.manage.delete.id}`)) {
				const huntMessage = await interaction.channel?.messages.fetch(interaction.customId.replace(`${Content.buttons.manage.delete.id}-`, ''));

				huntMessage?.delete();
				interaction.update({ content: Content.messages.followUp.deleted, components: [] });
			}
			else if (interaction.customId.includes(`${Content.buttons.manage.edit.id}`)) {
				// This particular fetch sometimes gets the cached version, so we need to invalidate that cache to ensure our modal has the right options.
				// There doesn't seem a good way to do that in the overloaded method, so we need to use the fuzzy search one. 
				const fuzzyMessage = await interaction.channel?.messages.fetch({
					around: interaction.customId.replace(`${Content.buttons.manage.edit.id}-`, ''),
					limit: 1,
					cache: false
				});
				const huntMessage = fuzzyMessage.first();

				if (huntMessage) {
					ModalOpen(interaction, huntMessage.id, huntMessage);
				}
			}
			else if (interaction.customId.includes(`${Content.buttons.manage.complete.id}`)) {
				const huntMessage = await interaction.channel?.messages.fetch(interaction.customId.replace(`${Content.buttons.manage.complete.id}-`, ''));

				if (huntMessage) {
					const followUpButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
						ManageButtons.Delete(huntMessage.id), ManageButtons.Reinstate(huntMessage.id)
					);

					huntMessage.edit({
						content: `${Content.messages.completed}${Content.formatting.strikethrough}${huntMessage.content}${Content.formatting.strikethrough}`
					});

					interaction.update({ content: Content.messages.followUp.complete, components: [followUpButtons] });
				}
			}
			else if (interaction.customId.includes(`${Content.buttons.manage.reinstate.id}`)) {
				const huntMessage = await interaction.channel?.messages.fetch(interaction.customId.replace(`${Content.buttons.manage.reinstate.id}-`, ''));

				if (huntMessage) {
					const followUpButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
						ManageButtons.Delete(huntMessage.id), ManageButtons.Edit(huntMessage.id), ManageButtons.Confirm(huntMessage.id)
					);

					huntMessage.edit({
						content: huntMessage.content.replace(Content.messages.completed, '').replaceAll(Content.formatting.strikethrough, '')
					});

					interaction.update({ content: Content.messages.followUp.active, components: [followUpButtons] });
				}
			}
		}
		// For edits, we have less control due to how Discord buttons/modals are handled, so we need to capture through the InteractionCreate event, instead of through awaitModalSubmit. 
		else if (interaction.isModalSubmit()) {
			if (interaction.customId.includes(`${Content.modal.edit.id}`)) {
				const huntMessage = await interaction.channel?.messages.fetch(interaction.customId.replace(`${Content.modal.edit.id}-`, ''));

				if (huntMessage) {
					ModalClose(interaction, huntMessage);
				}
			}
		}
	};
}

/**
 * Handles the opening of the modal, including all of the input fields and default values.
 * 
 * @param interaction An {@link ButtonInteraction} or {@link CommandInteraction} of which the request is being made from. 
 * @param id A string indicating what the modal's identifier will be. 
 * @param huntMessage If passed, then the Modal will attempt to read from this message to pre-populate the values.
 */
async function ModalOpen(interaction: ButtonInteraction | CommandInteraction, id: string, huntMessage?: Message) {
	const isNew = huntMessage === undefined;
	const customId = `${isNew ? Content.modal.base.id : Content.modal.edit.id}-${id}`;
	const title = isNew ? Content.modal.base.displayLabel : Content.modal.edit.displayLabel;

	const editModal = new ModalBuilder()
		.setCustomId(customId)
		.setTitle(title);

	const values = huntMessage ? MessageDeserialize(huntMessage) : [];

	Inputs.forEach((input, index) => {
		editModal.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder({
					...input,
					value: values.length > 0 ? values[index] : '' // Pre-fill with previous values
				})
			)
		);
	});

	await interaction.showModal(editModal);
}

/**
 * Handles how to respond to a hunt request modal closing. Behaves slightly differently for new/editted requests.
 * 
 * @param submitted A {@link ModalSubmitInteraction} indicating the result from the Modal submit button. 
 * @param huntMessage If passed, then the Modal will update this message, as it will be assumed to be an edit. 
 */
async function ModalClose(submitted: ModalSubmitInteraction | void, huntMessage?: Message) {
	if (submitted) {
		// If an existing hunt
		if (huntMessage) {
			await huntMessage.edit({
				content: MessageSerialize(submitted),
				flags: MessageFlags.SuppressEmbeds, // Prevent embeds of links to prevent NSFW items displaying
			});

			// Due to how Discord handles modal, we must make a reply, even if it doesn't make sense to do so. 
			submitted.reply({
				content: Content.messages.updated,
				ephemeral: true,
				components: []
			});
		}
		else {
			const huntMessage = await submitted.reply({
				content: MessageSerialize(submitted),
				flags: MessageFlags.SuppressEmbeds, // Prevent embeds of links to prevent NSFW items displaying
				fetchReply: true
			});

			const followUpButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
				ManageButtons.Delete(huntMessage.id), ManageButtons.Edit(huntMessage.id), ManageButtons.Confirm(huntMessage.id)
			);

			await submitted.followUp({
				content: Content.messages.followUp.active,
				ephemeral: true,
				fetchReply: true,
				components: [followUpButtons]
			});
		}
	}
}

/**
 * Serializes the outputs from the modal into one final form message to make as a reply. 
 * 
 * @param textInput A valid {@link ModalSubmitInteraction} ontaining all of the fields from {@link Inputs}
 * 
 * @returns One string containing the formatted hunting request that the user made. 
 */
function MessageSerialize(textInput: ModalSubmitInteraction): string {
	if (!textInput?.fields) {
		console.error('The input from the modal is incorrect.');
		console.error(textInput);
		return '';
	}

	const inputMap = [Content.input.link, Content.input.budget, Content.input.location, Content.input.condition, Content.input.notes];
	const values = Inputs.map(input => {
		const label = inputMap.find((i) => i.id === input.customId)?.displayLabel;
		const inputText = textInput.fields.getTextInputValue(input.customId);
		const text = !inputText ? Content.input.optional : inputText;

		return `${Content.formatting.bold}${label}${Content.formatting.bold}\r\n${text}`;
	});

	return values.join('\r\n\r\n');
}

/**
 * Deserializes the output hunt message back to fields for the input modal.
 * 
 * @param huntMessage A valid {@link Message} that contains the information from a hunt request.
 *  
 * @returns A list of strings, in order, of how they need to be re-placed back onto the modal.
 */
function MessageDeserialize(huntMessage: Message): string[] {
	if (!huntMessage.id || !huntMessage.content.includes(Content.input.link.displayLabel)) {
		console.error('The input from the message is incorrect.\r\n', huntMessage);
		return ['', '', '', '', ''];
	}

	const inputList: string[] = [];
	const messageContent = huntMessage.content.replaceAll(Content.formatting.bold, '');
	const searchList = [Content.input.link.displayLabel, Content.input.budget.displayLabel, Content.input.location.displayLabel, Content.input.condition.displayLabel, Content.input.notes.displayLabel];

	for (let i = 0; i < searchList.length; i++) {
		const item1 = searchList[i];
		const item2 = i + 1 < searchList.length ? searchList[i + 1] : undefined;

		let inputString = messageContent.substring(messageContent.indexOf(item1) + item1.length, item2 === undefined ? undefined : messageContent.indexOf(item2));
		inputString = inputString.trim();
		inputString = inputString === Content.input.optional || !inputString ? '' : inputString;

		inputList.push(inputString);
	}

	return inputList;
}