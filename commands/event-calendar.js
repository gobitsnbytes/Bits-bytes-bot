const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const notion = require('../lib/notion');
const events = require('../lib/events');
const config = require('../config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('event-calendar')
		.setDescription('Network-wide event calendar'),

	async execute(interaction) {
		const flags = config.PRIVACY['event-calendar'] ? [MessageFlags.Ephemeral] : [];
		await interaction.deferReply({ flags });

		try {
			// Get all upcoming events
			const upcomingEvents = await notion.getUpcomingEvents(20);

			if (upcomingEvents.length === 0) {
				return await interaction.editReply({
					content: `${config.EMOJIS.warning} No upcoming events scheduled.`,
				});
			}

			// Enrich events with fork city names
			const forks = await notion.getForks();
			const forkMap = new Map();
			for (const fork of forks) {
				forkMap.set(fork.id, fork.properties.City?.rich_text?.[0]?.text?.content || 
				                      fork.properties['Fork Name']?.title?.[0]?.text?.content || 
				                      'Unknown');
			}

			for (const event of upcomingEvents) {
				if (event.forkId) {
					event.forkCity = forkMap.get(event.forkId) || '';
				}
			}

			const embed = new EmbedBuilder()
				.setTitle(`${config.EMOJIS.protocol} NETWORK_EVENT_CALENDAR`)
				.setColor(config.COLORS.primary)
				.setTimestamp()
				.setFooter({ text: config.BRANDING.footerText });

			// Calendar view
			const calendarText = events.formatCalendarView(upcomingEvents);
			embed.addFields({
				name: '📅 UPCOMING_EVENTS',
				value: calendarText.substring(0, 1000),
				inline: false,
			});

			// Summary stats
			const stats = events.getEventStats(upcomingEvents);
			embed.addFields({
				name: '📊 SUMMARY',
				value: `Total Upcoming: ${upcomingEvents.length}\n` +
					`Workshops: ${stats.byType.workshop || 0}\n` +
					`Hackathons: ${stats.byType.hackathon || 0}\n` +
					`Meetups: ${stats.byType.meetup || 0}`,
				inline: false,
			});

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('[EVENT_CALENDAR_ERROR]', error);
			await interaction.editReply({
				content: `${config.EMOJIS.error} SYSTEM_FAILURE: Unable to retrieve event calendar.`,
			});
		}
	},
};