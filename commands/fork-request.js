const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fork-request')
		.setDescription('Request to start a new Bits&Bytes fork in your city.'),
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setTitle(`${config.EMOJIS.save} INITIALIZING NEW FORK REQUEST`)
			.setDescription("Ready to host your own node? Please complete the official **Bits&Bytes** fork registry form to start the synchronization process. Let's build something epic! ⚡️")
			.setColor(config.COLORS.primary)
            .setThumbnail(interaction.guild.iconURL())
			.addFields(
				{ name: 'IDENTIFICATION', value: 'Complete the Notion form.', inline: true },
				{ name: 'SYNCHRONIZATION', value: 'Our team will reach out via Discord! 🛰️', inline: true }
			)
			.setFooter({ text: config.BRANDING.footerText })
			.setTimestamp();

		const button = new ButtonBuilder()
			.setLabel('Complete Form ↗️')
			.setURL('https://perfect-dinghy-781.notion.site/33a49ed2fc33800984e7c28ca3d7cd2a?pvs=105')
			.setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder()
			.addComponents(button);

		await interaction.reply({
			embeds: [embed],
			components: [row],
			flags: [MessageFlags.Ephemeral]
		});
	},
};
