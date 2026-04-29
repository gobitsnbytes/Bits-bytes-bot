const cron = require('node-cron');
const notion = require('../lib/notion');
const healthScore = require('../lib/healthScore');
const smartReminders = require('../lib/smartReminders');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
	// Run daily at 9 AM
	cron.schedule('0 9 * * *', async () => {
		console.log('[JOB] Running Daily Reminder Check...');
		
		try {
			const forks = await notion.getForks();
			const activeForks = forks.filter(f => f.properties?.Status?.select?.name === 'Active');
			const guild = client.guilds.cache.first();
			if (!guild) return;

			const leadsCouncil = guild.channels.cache.find(c => c.name === 'leads-council');

			for (const fork of activeForks) {
				const leadId = fork.properties['Discord ID']?.rich_text?.[0]?.text?.content;
				const city = fork.properties.City?.rich_text?.[0]?.text?.content || 
				             fork.properties['Fork Name']?.title?.[0]?.text?.content || 
				             'UNKNOWN';

				if (!leadId || !leadsCouncil) continue;

				// Gather fork data
				const health = healthScore.calculateHealthScore(fork);
				const teamMembers = await notion.getTeamMembers(fork.id);
				const events = await notion.getEvents(fork.id);
				const reports = await notion.getReports(fork.id);
				const onboardingStatus = await notion.getOnboardingStatus(fork.id);

				// Generate reminders
				const reminders = smartReminders.generateReminders({
					fork,
					health,
					teamMembers,
					events,
					reports,
					onboardingStatus,
				});

				// Only send if there are critical or high priority reminders
				const urgentReminders = reminders.filter(
					r => r.priority.level >= smartReminders.PRIORITY.HIGH.level
				);

				if (urgentReminders.length > 0) {
					const embed = new EmbedBuilder()
						.setTitle(`🔔 DAILY_DIGEST // ${city.toUpperCase()}`)
						.setColor('#FFCC00')
						.setTimestamp()
						.setFooter({ text: 'BITS&BYTES // AUTOMATED_REMINDER' });

					const reminderText = urgentReminders.map(smartReminders.formatReminder).join('\n\n');
					embed.addFields({
						name: '⚠️ ACTION_REQUIRED',
						value: reminderText.substring(0, 1000),
						inline: false,
					});

					await leadsCouncil.send({ content: `<@${leadId}>`, embeds: [embed] });
				}
			}

			console.log('[JOB] Daily Reminder Check completed');

		} catch (error) {
			console.error('[JOB ERROR] Daily Reminder Check failed:', error);
		}
	});
};