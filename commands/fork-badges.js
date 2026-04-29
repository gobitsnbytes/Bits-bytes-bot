const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const notion = require('../lib/notion');
const gamification = require('../lib/gamification');
const healthScore = require('../lib/healthScore');
const teamValidator = require('../lib/teamValidator');
const config = require('../config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fork-badges')
		.setDescription('View fork badges and achievements')
		.addStringOption(option =>
			option
				.setName('city')
				.setDescription('Fork city')
				.setRequired(true)),

	async execute(interaction) {
		const flags = config.PRIVACY['fork-badges'] ? [MessageFlags.Ephemeral] : [];
		await interaction.deferReply({ flags });

		try {
			const city = interaction.options.getString('city');

			const fork = await notion.findForkByCity(city);
			if (!fork) {
				return await interaction.editReply({
					content: `${config.EMOJIS.error} Fork not found: ${city}`,
				});
			}

			// Gather data for badge calculation
			const health = healthScore.calculateHealthScore(fork);
			const teamMembers = await notion.getTeamMembers(fork.id);
			const teamValidation = teamValidator.validateTeam(teamMembers);
			const events = await notion.getEvents(fork.id);
			const reports = await notion.getReports(fork.id);
			const onboardingStatus = await notion.getOnboardingStatus(fork.id);

			// Build fork data for badge calculation
			const forkData = {
				health,
				totalEvents: events.filter(e => e.status === 'Completed').length,
				teamComplete: teamValidation.isValid,
				teamMembersAdded: teamMembers.length,
				pulseStreak: 0, // Would need to track this
				reportsOnTime: reports.filter(r => r.status === 'on-time').length,
				partnerships: fork.properties['Partnerships Count']?.number || 0,
				onboardingComplete: onboardingStatus.progress === 7,
				maxEventAttendance: Math.max(...events.map(e => e.attendees || 0), 0),
			};

			// Determine earned badges
			const earnedBadges = gamification.determineBadges(forkData);

			// Get stored badges from Notion
			const storedBadges = await notion.getForkBadges(fork.id);

			// Get points and level
			const storedPoints = fork.properties.Points?.number || 0;
			const level = gamification.getLevelFromPoints(storedPoints);
			const progress = gamification.getProgressToNextLevel(storedPoints);

			const embed = new EmbedBuilder()
				.setTitle(`${config.EMOJIS.protocol} FORK_ACHIEVEMENTS // ${city.toUpperCase()}`)
				.setColor(level.color)
				.setTimestamp()
				.setFooter({ text: config.BRANDING.footerText });

			// Level display
			embed.addFields({
				name: `⭐ LEVEL ${level.level}: ${level.name.toUpperCase()}`,
				value: `${storedPoints} total points\n${progress.pointsNeeded > 0 ? `${progress.pointsNeeded} pts to next level` : 'Max level reached!'}`,
				inline: false,
			});

			// Progress bar
			const progressBar = '█'.repeat(Math.floor(progress.progress / 10)) + '░'.repeat(10 - Math.floor(progress.progress / 10));
			embed.addFields({
				name: '📈 PROGRESS',
				value: `\`${progressBar}\` ${progress.progress}%`,
				inline: false,
			});

			// Earned badges
			if (earnedBadges.length > 0) {
				const badgesText = earnedBadges.map(gamification.formatBadge).join('\n');
				embed.addFields({
					name: `🏅 BADGES (${earnedBadges.length})`,
					value: badgesText.substring(0, 1000),
					inline: false,
				});
			} else {
				embed.addFields({
					name: '🏅 BADGES',
					value: 'No badges earned yet. Keep up the great work!',
					inline: false,
				});
			}

			// Next badge hints
			const nextBadges = [];
			if (forkData.totalEvents === 0) {
				nextBadges.push('🎯 Host your first event to earn "First Steps"');
			}
			if (!forkData.teamComplete) {
				nextBadges.push('👥 Complete your team structure to earn "Team Builder"');
			}
			if (forkData.partnerships === 0) {
				nextBadges.push('🤝 Secure your first partnership to earn "Partner Up"');
			}
			if (!forkData.onboardingComplete) {
				nextBadges.push('✅ Complete onboarding to earn "Fully Onboarded"');
			}
			if (health.score < 60) {
				nextBadges.push('💚 Improve health to 60+ to earn "Healthy Fork"');
			}

			if (nextBadges.length > 0) {
				embed.addFields({
					name: '🎯 NEXT_ACHIEVEMENTS',
					value: nextBadges.slice(0, 5).join('\n'),
					inline: false,
				});
			}

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('[FORK_BADGES_ERROR]', error);
			await interaction.editReply({
				content: `${config.EMOJIS.error} SYSTEM_FAILURE: Unable to retrieve badges.`,
			});
		}
	},
};