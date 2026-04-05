const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

        // Setup Reaction Roles in the #roles channel
        // Note: You'll need to define the channel ID in your .env or grab it by name
        const rolesChannel = client.channels.cache.find(c => c.name === 'roles');
        if (rolesChannel) {
            setupReactionRoles(rolesChannel);
        } else {
            console.log("[WARNING] #roles channel not found. Skipping reaction roles setup.");
        }
	},
};

async function setupReactionRoles(channel) {
    const embed = new EmbedBuilder()
        .setTitle("🏙️ City & Interest Roles")
        .setDescription("React with the corresponding emoji to pick your city and interests!")
        .addFields(
            { name: "City Roles", value: "🏙️ lucknow | 🕌 prayagraj | 🏛️ delhi | 🌇 bangalore | 🌊 mumbai | 📚 kolkata | 🌴 chennai | 🌶️ hyderabad | 🏭 kanpur | 🗺️ other-city" },
            { name: "Interest Roles", value: "💻 dev | 🎨 design | 🔬 research | ⚙️ ops" }
        )
        .setColor('#5865F2');

    // Check if the message already exists (to avoid duplicate posts)
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessage = messages.find(m => m.author.id === channel.client.user.id && m.embeds.length > 0);

    if (!botMessage) {
        const sent = await channel.send({ embeds: [embed] });
        
        // Add reactions (City)
        const cityEmojis = ['🏙️', '🕌', '🏛️', '🌇', '🌊', '📚', '🌴', '🌶️', '🏭', '🗺️'];
        const interestEmojis = ['💻', '🎨', '🔬', '⚙️'];
        
        for (const emoji of [...cityEmojis, ...interestEmojis]) {
            await sent.react(emoji);
        }
    }
}
