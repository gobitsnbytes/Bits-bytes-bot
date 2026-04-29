/**
 * 📋 FORK ONBOARDING TRACKER
 * Tracks 7-step onboarding progress for new fork leads
 */

// Onboarding steps with their labels and descriptions
const ONBOARDING_STEPS = [
	{ step: 1, label: 'GitHub repository joined', description: 'Fork lead has joined the GitHub organization' },
	{ step: 2, label: 'Fork channel created', description: 'Dedicated Discord channel created for the fork' },
	{ step: 3, label: 'Website deployed', description: 'Fork website is live and accessible' },
	{ step: 4, label: 'Notion workspace shared', description: 'Fork lead has access to Notion workspace' },
	{ step: 5, label: 'First pulse submitted', description: 'First activity update has been submitted' },
	{ step: 6, label: 'Team structure defined', description: 'Team roles have been assigned' },
	{ step: 7, label: 'First event planned', description: 'First event has been created in the system' },
];

// Auto-reminder timing (hours after merge)
const REMINDER_TIMING = {
	1: 48,   // GitHub check after 48 hrs
	3: 72,   // Website check after 72 hrs
	4: 168,  // Notion check after 7 days
	'default': 168, // Weekly for other incomplete steps
};

/**
 * Get onboarding step info
 * @param {number} stepNumber - Step number (1-7)
 * @returns {Object} - Step info
 */
function getStepInfo(stepNumber) {
	return ONBOARDING_STEPS.find(s => s.step === stepNumber) || null;
}

/**
 * Format onboarding progress for display
 * @param {Object} onboardingStatus - Status object from notion.getOnboardingStatus
 * @returns {string} - Formatted progress display
 */
function formatOnboardingProgress(onboardingStatus) {
	const lines = [];
	
	for (const step of onboardingStatus.steps) {
		const stepInfo = getStepInfo(step.step);
		const icon = step.completed ? '✅' : '⬜';
		lines.push(`${icon} **Step ${step.step}**: ${stepInfo?.label || 'Unknown'}`);
	}

	return lines.join('\n');
}

/**
 * Get progress bar for onboarding
 * @param {number} progress - Number of completed steps
 * @param {number} total - Total steps (7)
 * @returns {string} - Progress bar string
 */
function getProgressBar(progress, total = 7) {
	const filled = progress;
	const empty = total - filled;
	return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Calculate onboarding completion percentage
 * @param {Object} onboardingStatus - Status object from notion.getOnboardingStatus
 * @returns {number} - Percentage complete
 */
function getCompletionPercentage(onboardingStatus) {
	return Math.round((onboardingStatus.progress / onboardingStatus.total) * 100);
}

/**
 * Get incomplete steps
 * @param {Object} onboardingStatus - Status object from notion.getOnboardingStatus
 * @returns {Array} - Array of incomplete step numbers
 */
function getIncompleteSteps(onboardingStatus) {
	return onboardingStatus.steps
		.filter(s => !s.completed)
		.map(s => s.step);
}

/**
 * Get next pending step
 * @param {Object} onboardingStatus - Status object from notion.getOnboardingStatus
 * @returns {Object|null} - Next step to complete or null if all done
 */
function getNextPendingStep(onboardingStatus) {
	const incomplete = onboardingStatus.steps.find(s => !s.completed);
	if (incomplete) {
		return getStepInfo(incomplete.step);
	}
	return null;
}

/**
 * Check if onboarding is complete
 * @param {Object} onboardingStatus - Status object from notion.getOnboardingStatus
 * @returns {boolean} - True if complete
 */
function isOnboardingComplete(onboardingStatus) {
	return onboardingStatus.progress === onboardingStatus.total;
}

/**
 * Get onboarding status label
 * @param {Object} onboardingStatus - Status object from notion.getOnboardingStatus
 * @returns {Object} - { label, color, emoji }
 */
function getOnboardingStatusLabel(onboardingStatus) {
	const percentage = getCompletionPercentage(onboardingStatus);
	
	if (percentage === 100) {
		return { label: 'Complete', color: '#00FF95', emoji: '✅' };
	} else if (percentage >= 70) {
		return { label: 'Almost There', color: '#00F2FF', emoji: '🔧' };
	} else if (percentage >= 40) {
		return { label: 'In Progress', color: '#FFCC00', emoji: '⚙️' };
	} else {
		return { label: 'Just Started', color: '#FF9900', emoji: '🆕' };
	}
}

/**
 * Generate reminder message for incomplete onboarding
 * @param {Object} onboardingStatus - Status object from notion.getOnboardingStatus
 * @param {string} city - Fork city name
 * @returns {string} - Reminder message
 */
function generateReminderMessage(onboardingStatus, city) {
	const incompleteSteps = getIncompleteSteps(onboardingStatus);
	const nextStep = getNextPendingStep(onboardingStatus);
	
	if (!nextStep) return null;

	return `📋 **Onboarding Reminder for ${city}**\n` +
		`You have ${incompleteSteps.length} steps remaining. Next step:\n` +
		`**Step ${nextStep.step}: ${nextStep.label}**\n` +
		`${nextStep.description}\n\n` +
		`Progress: ${onboardingStatus.progress}/${onboardingStatus.total} complete`;
}

module.exports = {
	ONBOARDING_STEPS,
	REMINDER_TIMING,
	getStepInfo,
	formatOnboardingProgress,
	getProgressBar,
	getCompletionPercentage,
	getIncompleteSteps,
	getNextPendingStep,
	isOnboardingComplete,
	getOnboardingStatusLabel,
	generateReminderMessage,
};