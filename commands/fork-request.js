const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fork-request')
		.setDescription('Request to start a new Bits&Bytes fork in your city.'),
	async execute(interaction) {
		const modal = new ModalBuilder()
			.setCustomId('forkRequestForm')
			.setTitle('Fork Request Form');

		const nameInput = new TextInputBuilder()
			.setCustomId('name')
			.setLabel("What's your name?")
			.setStyle(TextInputStyle.Short)
            .setRequired(true);

		const cityInput = new TextInputBuilder()
			.setCustomId('city')
			.setLabel("Which city do you want to fork in?")
			.setStyle(TextInputStyle.Short)
            .setRequired(true);

		const aboutInput = new TextInputBuilder()
			.setCustomId('about')
			.setLabel("Brief intro — who you are and what you want.")
			.setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const studentInput = new TextInputBuilder()
            .setCustomId('student')
            .setLabel("Are you a student? (Yes/No)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

		// Add inputs to the modal
		modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(cityInput),
            new ActionRowBuilder().addComponents(aboutInput),
            new ActionRowBuilder().addComponents(studentInput)
        );

		// Show the modal to the user
		await interaction.showModal(modal);
	},
};
