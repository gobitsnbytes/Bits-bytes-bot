const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Display information about all available commands.'),

	async execute(interaction) {
		const { commands } = interaction.client;
		
		const publicCmds = [];
		const forkCmds = [];
		const staffCmds = [];

		commands.forEach(command => {
			const entry = `\`/${command.data.name}\` — ${command.data.description}`;
			if (['merge', 'archive'].includes(command.data.name)) {
				staffCmds.push(entry);
			} else if (['pulse', 'forks'].includes(command.data.name)) {
				forkCmds.push(entry);
			} else {
				publicCmds.push(entry);
			}
		});

		const embed = new EmbedBuilder()
			.setTitle(`${config.EMOJIS.help} Bits&Bytes Protocol | Help Center`)
			.setDescription('Welcome to the **Bits&Bytes** auxiliary support system. Here are the available protocols:')
			.setColor(config.COLORS.primary)
            .setThumbnail(interaction.guild.iconURL())
			.addFields(
				{ name: '🌐 PUBLIC ACCESS', value: publicCmds.join('\n') || '*None*' },
				{ name: '🛠️ FORK OPERATIONS', value: forkCmds.join('\n') || '*None*' },
				{ name: '🛡️ STAFF ONLY', value: staffCmds.join('\n') || '*None*' }
			)
			.setTimestamp()
            .setFooter({ text: config.BRANDING.footerText });

        const button = new ButtonBuilder()
            .setLabel('Protocol Documentation ↗️')
            .setURL(process.env.FORK_HANDBOOK_URL || 'https://notion.so')
            .setStyle(ButtonStyle.Link);

        const row = new ActionRowBuilder().addComponents(button);

		await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            flags: [MessageFlags.Ephemeral] 
        });
	},
};
