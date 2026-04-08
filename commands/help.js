const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Access the B&B Protocol reference manual.'),

	async execute(interaction) {
		const { commands } = interaction.client;
		
		const publicCmds = [];
		const forkCmds = [];
		const staffCmds = [];

		commands.forEach(command => {
			const entry = `\`/${command.data.name.toUpperCase()}\` :: ${command.data.description}`;
			if (['merge', 'archive'].includes(command.data.name)) {
				staffCmds.push(entry);
			} else if (['pulse', 'forks'].includes(command.data.name)) {
				forkCmds.push(entry);
			} else {
				publicCmds.push(entry);
			}
		});

		const embed = new EmbedBuilder()
			.setTitle(`${config.EMOJIS.help} BITS&BYTES_OS // CMD_REFERENCE_V${config.BRANDING.version || '2.0'}`)
			.setDescription('Welcome to the **Bits&Bytes** core auxiliary system. Select a protocol to initialize:')
			.setColor(config.COLORS.primary)
            .setThumbnail(interaction.guild.iconURL())
			.addFields(
				{ name: '🌐 PUBLIC_INTERFACE', value: publicCmds.join('\n') || '*EMPTY*' },
				{ name: '🛠️ NODE_OPERATIONS', value: forkCmds.join('\n') || '*EMPTY*' },
				{ name: '🛡️ ROOT_ACCESS_ONLY', value: staffCmds.join('\n') || '*EMPTY*' }
			)
			.setTimestamp()
            .setFooter({ text: config.BRANDING.footerText });

        const button = new ButtonBuilder()
            .setLabel(config.BRANDING.documentationLabel)
            .setURL(process.env.FORK_HANDBOOK_URL || 'https://notion.so')
            .setStyle(ButtonStyle.Link);

        const row = new ActionRowBuilder().addComponents(button);

		await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            flags: config.PRIVACY.help ? [MessageFlags.Ephemeral] : []
        });
	},
};
