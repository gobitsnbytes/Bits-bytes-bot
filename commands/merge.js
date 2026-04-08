const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const notion = require('../lib/notion');
const config = require('../config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('merge')
		.setDescription('Officially onboard a new fork lead.')
		.addUserOption(option => option.setName('user').setDescription('The user to merge').setRequired(true))
		.addStringOption(option => option.setName('city').setDescription('The city for the fork').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

	async execute(interaction) {
		const user = interaction.options.getUser('user');
		const city = interaction.options.getString('city');
		const guild = interaction.guild;

		await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

		try {
			// 1. Assign @fork-lead role
			const forkLeadRole = guild.roles.cache.find(r => r.name === 'fork-lead');
			if (!forkLeadRole) throw new Error('@fork-lead role not found in server.');
			
			const member = await guild.members.fetch(user.id);
			await member.roles.add(forkLeadRole);

			// 2. Update Notion
			const fork = await notion.findForkByCity(city);
			if (fork) {
				await notion.updateForkStatus(fork.id, 'Active');
			}

			// 3. Create/Setup City Channel
			const category = guild.channels.cache.find(c => c.name === 'FORKS' && c.type === ChannelType.GuildCategory);
			const channelName = `bitsnbytes-${city.toLowerCase().replace(/\s+/g, '-')}`;
			
			const channel = await guild.channels.create({
				name: channelName,
				type: ChannelType.GuildText,
				parent: category ? category.id : null,
				permissionOverwrites: [
					{ id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
					{ id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
					{ id: forkLeadRole.id, allow: [PermissionFlagsBits.ViewChannel] }
				]
			});

			await interaction.editReply(`✅ Successfully merged **@${user.tag}** as the lead for **${city}**.`);

		} catch (error) {
			console.error('[MERGE] Error:', error);
			await interaction.editReply('❌ There was an error while merging the fork lead.');
		}
	},
};
