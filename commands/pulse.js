const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const notion = require('../lib/notion');
const config = require('../config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pulse')
		.setDescription('Submit a structured activity update for your fork.')
		.addStringOption(option => option.setName('city').setDescription('The city for the fork').setRequired(true))
		.addStringOption(option => option.setName('update').setDescription('The update details (text)').setRequired(true)),

	async execute(interaction) {
		const city = interaction.options.getString('city');
		const updateText = interaction.options.getString('update');
		const guild = interaction.guild;

		const flags = config.PRIVACY.pulse ? [MessageFlags.Ephemeral] : [];

        // Check if @fork-lead
        const member = await guild.members.fetch(interaction.user.id);
        const forkLeadRole = guild.roles.cache.find(r => r.name === 'fork-lead');
        if (!forkLeadRole || !member.roles.cache.has(forkLeadRole.id)) {
            return await interaction.reply({ 
                content: `${config.EMOJIS.error} SYSTEM_ALERT: Command requires **@fork-lead** authorization level.`, 
                flags
            });
        }

		await interaction.deferReply({ flags });

		try {
			// 1. Post to #pulse
			const pulseChannel = guild.channels.cache.find(c => c.name === 'pulse');
			if (pulseChannel) {
				const pulseEmbed = new EmbedBuilder()
					.setTitle(`${config.EMOJIS.pulse} INBOUND PULSE: ${city.toUpperCase()}`)
					.setDescription(updateText)
					.setColor(config.COLORS.primary)
					.setThumbnail(interaction.guild.iconURL())
					.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
					.setTimestamp()
                    .setFooter({ text: config.BRANDING.footerText });

				await pulseChannel.send({ embeds: [pulseEmbed] });
			}

			// 2. Update Notion
			const fork = await notion.findForkByCity(city);
			if (fork) {
				await notion.updatePulse(fork.id, new Date().toISOString());
			}

			const successEmbed = new EmbedBuilder()
				.setTitle(`${config.EMOJIS.protocol} PULSE SYNCHRONIZED`)
				.setDescription(`Your update for **${city}** has been broadcast to the network.`)
				.setColor(config.COLORS.success)
				.setTimestamp()
                .setFooter({ text: config.BRANDING.footerText });

			await interaction.editReply({ embeds: [successEmbed] });

		} catch (error) {
			console.error('[PULSE ERROR]', error);
			await interaction.editReply({ content: `❌ Protocol breach during pulse: ${error.message}` });
		}
	},
};
