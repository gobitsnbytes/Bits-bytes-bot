const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const notion = require('../lib/notion');
const config = require('../config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('forks')
		.setDescription('List all active and pending Bits&Bytes forks.'),

	async execute(interaction) {
		await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

		try {
			const forks = await notion.getForks();
            
            // Filter out "ghost" records (rows that have a status but no city or name data)
            const isValidFork = (f) => {
                const city = f.properties?.["What city are you in?"]?.rich_text?.[0]?.text?.content;
                const name = f.properties?.["Fork Name"]?.title?.[0]?.text?.content;
                const altCity = f.properties?.City?.rich_text?.[0]?.text?.content;
                return city || name || altCity;
            };

            const active = forks
                .filter(isValidFork)
                .filter(f => f.properties?.Status?.select?.name === 'Active');
            
            const pending = forks
                .filter(isValidFork)
                .filter(f => f.properties?.Status?.select?.name === 'Pending');

			const embed = new EmbedBuilder()
				.setTitle(`${config.EMOJIS.protocol} NODE TOPOLOGY: NETWORK STATUS`)
				.setColor(config.COLORS.primary)
                .setTimestamp()
                .setFooter({ 
                    text: config.BRANDING.footerText, 
                    iconURL: interaction.guild.iconURL() 
                });

            if (config.UI.useServerIcon) {
                embed.setThumbnail(interaction.guild.iconURL());
            }

            // Formatting list as "Terminal" style
            let activeList = active.map(f => {
                const city = f.properties?.["What city are you in?"]?.rich_text?.[0]?.text?.content || 
                             f.properties?.["Fork Name"]?.title?.[0]?.text?.content || 
                             'Unknown';
                const leadId = f.properties?.['Discord ID']?.rich_text?.[0]?.text?.content;
                const leadName = f.properties?.["What's your name?"]?.rich_text?.[0]?.text?.content;
                
                const nodeName = `bitsnbytes-${city.toLowerCase().replace(/\s+/g, '-')}`.padEnd(25);
                const leadDisplay = leadId ? `<@${leadId}>` : (leadName || 'unknown');
                
                return `\`${nodeName}\` ${config.EMOJIS.active} ONLINE  -> ${leadDisplay}`;
            }).join('\n') || '`NO_ACTIVE_NODES_FOUND`';

            let pendingList = pending.map(f => {
                const city = f.properties?.["What city are you in?"]?.rich_text?.[0]?.text?.content || 
                             f.properties?.["Fork Name"]?.title?.[0]?.text?.content || 
                             'Pending';
                const leadName = f.properties?.["What's your name?"]?.rich_text?.[0]?.text?.content;
                
                const nodeName = `bitsnbytes-${city.toLowerCase().replace(/\s+/g, '-')}`.padEnd(25);
                const leadDisplay = leadName ? `(${leadName})` : '';
                
                return `\`${nodeName}\` ${config.EMOJIS.pending} DISCOVERY -> pending ${leadDisplay}`;
            }).join('\n') || '`NO_PENDING_REQUESTS`';

            embed.addFields(
                { name: '🛰️ ACTIVE PROTOCOLS', value: activeList },
                { name: '⏳ PENDING SYNCHRONIZATION', value: pendingList }
            );

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('[FORKS ERROR]', error);
			await interaction.editReply({ content: '❌ There was an error while fetching the topology map.' });
		}
	},
};
