const { Events, MessageFlags } = require('discord.js');

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
				
				const errorMsg = 'There was an error while executing this command!';
				
				try {
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({ content: errorMsg, flags: [MessageFlags.Ephemeral] });
					} else {
						await interaction.reply({ content: errorMsg, flags: [MessageFlags.Ephemeral] });
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
