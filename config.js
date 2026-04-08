/**
 * 🛰️ BITS&BYTES PROTOCOL - THEME MANAGEMENT CENTER
 * Use this file to manage all visual aspects of the bot.
 */

module.exports = {
	// 🎨 BRANDING & COLORS
	COLORS: {
		primary: '#3498DB',    // Electric Blue (Default)
		success: '#2ECC71',    // Emerald Green
		warning: '#F1C40F',    // Sun Flower Gold
		error: '#E74C3C',      // Alizarin Red
		neutral: '#95A5A6',    // Concrete Grey
	},

	// 🛰️ EMOJIS & ICONS
	EMOJIS: {
		protocol: '🛰️',         // Symbol for the Protocol
		node: '💻',             // Symbol for individual nodes
		active: '🟢',           // Active status
		pending: '🟠',          // Pending status
		archived: '📁',         // Archived status
		pulse: '⚡',            // Pulse/Activity
		save: '💾',             // Save/Request
		help: '🤖',             // Help bot
		link: '↗️',            // External link
	},

	// 📄 EMBED DEFAULTS
	BRANDING: {
		footerText: 'Bits&Bytes Protocol | System v1.0',
		version: '1.0.0',
	},

	// 🖥️ UI SETTINGS
	UI: {
		useServerIcon: true,    // Always use server icon as thumbnail
		terminalStyle: true,    // Use code blocks for a geeky terminal look
	}
};
