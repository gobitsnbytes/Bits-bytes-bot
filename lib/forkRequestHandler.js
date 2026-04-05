const { EmbedBuilder } = require('discord.js');
const notion = require('./notion');

module.exports = async (interaction) => {
	const name = interaction.fields.getTextInputValue('name');
	const city = interaction.fields.getTextInputValue('city');
	const about = interaction.fields.getTextInputValue('about');
	const student = interaction.fields.getTextInputValue('student').toLowerCase() === 'yes';

	try {
		// Save to Notion
		await notion.createForkRequest({
			name,
			city,
			about,
			student,
            userId: interaction.user.id
		});

		// Notify Team in #team-forks
		const teamChannel = interaction.guild.channels.cache.find(c => c.name === 'team-forks');
		if (teamChannel) {
			const teamEmbed = new EmbedBuilder()
				.setTitle('🍴 New Fork Request')
				.addFields(
					{ name: 'City', value: city, inline: true },
					{ name: 'Name', value: name, inline: true },
					{ name: 'Student', value: student ? 'Yes' : 'No', inline: true },
					{ name: 'About', value: about },
				)
				.setColor('#F1C40F')
                .setFooter({ text: `User ID: ${interaction.user.id}` });

			await teamChannel.send({ 
                content: '🔔 <@&team_role_id_here> New fork request needs review!', 
                embeds: [teamEmbed] 
            });
		}

		// Reply to user
		await interaction.reply({
			content: `your fork request for **${city}** has been submitted. the b&b team will review it and reach out shortly.`,
			ephemeral: true,
		});

	} catch (error) {
		console.error('Error handling fork request:', error);
		await interaction.reply({
			content: 'There was an error submitting your request. Please try again later.',
			ephemeral: true,
		});
	}
};
