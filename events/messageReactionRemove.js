const { Events } = require('discord.js');
const roleMap = require('../lib/roles');

module.exports = {
	name: Events.MessageReactionRemove,
	async execute(reaction, user) {
		// If the reaction is partial, fetch it
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (error) {
				console.error('Something went wrong when fetching the reaction:', error);
				return;
			}
		}

		// Don't handle bot reactions
		if (user.bot) return;

		// Check if it's the role picker channel
		if (reaction.message.channel.name !== 'roles') return;

		const roleName = roleMap[reaction.emoji.name];
		if (!roleName) return;

		try {
			const member = await reaction.message.guild.members.fetch(user.id);
			const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);

			if (role) {
				await member.roles.remove(role);
				console.log(`[ROLES] Removed @${roleName} from ${user.tag}`);
			}
		} catch (error) {
			console.error(`[ROLES] Error removing role:`, error);
		}
	},
};
