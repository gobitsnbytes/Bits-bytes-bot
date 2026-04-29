const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const notion = require('../lib/notion');
const events = require('../lib/events');
const config = require('../config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('event-update')
		.setDescription('Update an existing event')
		.addStringOption(option =>
			option
				.setName('event-id')
				.setDescription('Event ID to update')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('status')
				.setDescription('New event status')
				.setRequired(false)
				.addChoices(
					{ name: '💡 Idea', value: 'Idea' },
					{ name: '📋 Planned', value: 'Planned' },
					{ name: '✅ Approved', value: 'Approved' },
					{ name: '🚀 Executing', value: 'Executing' },
					{ name: '🎉 Completed', value: 'Completed' },
				))
		.addStringOption(option =>
			option
				.setName('date')
				.setDescription('New event date (YYYY-MM-DD)')
				.setRequired(false))
		.addIntegerOption(option =>
			option
				.setName('attendees')
				.setDescription('Actual attendees count')
				.setRequired(false)
				.setMinValue(0)),

	async execute(interaction) {
		const flags = config.PRIVACY['event-update'] ? [MessageFlags.Ephemeral] : [];
		await interaction.deferReply({ flags });

		try {
			const eventId = interaction.options.getString('event-id');
			const status = interaction.options.getString('status');
			const date = interaction.options.getString('date');
			const attendees = interaction.options.getInteger('attendees');

			// Validate at least one update provided
			if (!status && !date && attendees === null) {
				return await interaction.editReply({
					content: `${config.EMOJIS.error} Please provide at least one field to update.`,
				});
			}

			// Validate date format if provided
			if (date) {
				const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
				if (!dateRegex.test(date)) {
					return await interaction.editReply({
						content: `${config.EMOJIS.error} Invalid date format. Please use YYYY-MM-DD.`,
					});
				}
			}

			// Update the event
			await notion.updateEvent(eventId, {
				status,
				date,
				attendees,
			});

			const embed = new EmbedBuilder()
				.setTitle(`${config.EMOJIS.protocol} EVENT_UPDATED`)
				.setColor(config.COLORS.success)
				.setTimestamp()
				.setFooter({ text: config.BRANDING.footerText });

			let updateText = '';
			if (status) {
				const stageEmoji = events.getStageEmoji(status);
				updateText += `${stageEmoji} **Status**: ${status}\n`;
			}
			if (date) {
				updateText += `📅 **Date**: ${date}\n`;
			}
			if (attendees !== null) {
				updateText += `👥 **Attendees**: ${attendees}\n`;
			}

			embed.addFields({
				name: '✅ CHANGES_APPLIED',
				value: updateText,
				inline: false,
			});

			embed.addFields({
				name: '📌 EVENT_ID',
				value: eventId,
				inline: false,
			});

			// Points for completing event
			if (status === 'Completed') {
				embed.addFields({
					name: '🎉 EVENT_COMPLETED',
					value: '+10 points awarded for hosting an event!',
					inline: false,
				});
			}

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('[EVENT_UPDATE_ERROR]', error);
			await interaction.editReply({
				content: `${config.EMOJIS.error} SYSTEM_FAILURE: Unable to update event.`,
			});
		}
	},
};