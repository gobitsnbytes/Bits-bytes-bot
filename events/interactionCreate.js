const { Events, MessageFlags, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`[COMMAND ERROR] /${interaction.commandName}:`, error);
				
				const errorEmbed = new EmbedBuilder()
					.setTitle(`${config.EMOJIS.error} Protocol Breach`)
					.setDescription('A system error has occurred during synchronization. Please contact a network administrator.')
					.setColor(config.COLORS.error)
					.setFooter({ text: config.BRANDING.footerText });
				
				try {
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({ embeds: [errorEmbed], flags: [MessageFlags.Ephemeral] });
					} else {
						await interaction.reply({ embeds: [errorEmbed], flags: [MessageFlags.Ephemeral] });
					}
				} catch (innerError) {
					console.error('[ERROR HANDLER FAIL] Could not send error reply:', innerError.message);
				}
			}
		} else if (interaction.isModalSubmit()) {
			// Handle Modal Submissions if any (future use)
		}
	},
};
