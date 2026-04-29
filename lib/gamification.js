/**
 * 🏆 GAMIFICATION ENGINE
 * Points and badge calculation system
 */

/**
 * Points values for activities
 */
const POINTS = {
	// Reports
	REPORT_SUBMISSION: 5,
	REPORT_ON_TIME: 2, // Bonus
	REPORT_LATE: -3, // Penalty

	// Events
	EVENT_CREATED: 2,
	EVENT_COMPLETED: 10,
	EVENT_CANCELLED: -5,

	// Pulse
	PULSE_SUBMITTED: 1,
	PULSE_STREAK_WEEK: 3, // 4+ weeks in a row
	PULSE_OVERDUE: -2,

	// Team
	TEAM_COMPLETE: 5, // All roles filled
	TEAM_MEMBER_ADDED: 1,

	// Onboarding
	ONBOARDING_COMPLETE: 20,

	// Partnerships
	PARTNERSHIP_ADDED: 3,

	// Special
	MONTHLY_WINNER: 50,
	HEALTH_SCORE_80: 10, // Weekly bonus
	HEALTH_SCORE_90: 20, // Weekly bonus
};

/**
 * Badge definitions
 */
const BADGES = {
	// Event badges
	FIRST_EVENT: { id: 'first_event', name: 'First Steps', emoji: '🎯', description: 'Hosted first event' },
	EVENT_HERO: { id: 'event_hero', name: 'Event Hero', emoji: '🎉', description: 'Hosted 5+ events' },
	EVENT_LEGEND: { id: 'event_legend', name: 'Event Legend', emoji: '🏆', description: 'Hosted 10+ events' },

	// Team badges
	TEAM_BUILDER: { id: 'team_builder', name: 'Team Builder', emoji: '👥', description: 'Complete team structure' },
	RECRUITER: { id: 'recruiter', name: 'Recruiter', emoji: '🤝', description: 'Added 5+ team members' },

	// Activity badges
	PULSE_MASTER: { id: 'pulse_master', name: 'Pulse Master', emoji: '💓', description: '8 weeks pulse streak' },
	REPORTER: { id: 'reporter', name: 'Reliable Reporter', emoji: '📝', description: '10 reports on time' },

	// Health badges
	HEALTHY: { id: 'healthy', name: 'Healthy Fork', emoji: '💚', description: 'Health score 60+' },
	THRIVING: { id: 'thriving', name: 'Thriving Fork', emoji: '🌟', description: 'Health score 80+' },
	EXCEPTIONAL: { id: 'exceptional', name: 'Exceptional', emoji: '💎', description: 'Health score 95+' },

	// Partnership badges
	PARTNER_UP: { id: 'partner_up', name: 'Partner Up', emoji: '🤝', description: 'First partnership secured' },
	CONNECTED: { id: 'connected', name: 'Connected', emoji: '🌐', description: '5+ partnerships' },

	// Special badges
	ONBOARDED: { id: 'onboarded', name: 'Fully Onboarded', emoji: '✅', description: 'Completed all onboarding steps' },
	MONTHLY_CHAMPION: { id: 'monthly_champion', name: 'Monthly Champion', emoji: '👑', description: 'Won monthly leaderboard' },
	ON_FIRE: { id: 'on_fire', name: 'On Fire', emoji: '🔥', description: '3+ consecutive active months' },
	RISING_STAR: { id: 'rising_star', name: 'Rising Star', emoji: '⭐', description: 'Most improved fork' },
	EARLY_BIRD: { id: 'early_bird', name: 'Early Bird', emoji: '🐦', description: 'First pulse of the week' },

	// Attendance badges
	CROWD_PLEASER: { id: 'crowd_pleaser', name: 'Crowd Pleaser', emoji: '🎪', description: '50+ attendees at an event' },
	PACKED_HOUSE: { id: 'packed_house', name: 'Packed House', emoji: '🏟️', description: '100+ attendees at an event' },
};

/**
 * Calculate total points for a fork
 * @param {Object} forkData - Fork data with activities
 * @returns {number} - Total points
 */
function calculateTotalPoints(forkData) {
	let total = 0;

	// Base points from stored value
	if (forkData.points) {
		total += forkData.points;
	}

	// Health score bonus (weekly)
	if (forkData.health?.score >= 90) {
		total += POINTS.HEALTH_SCORE_90;
	} else if (forkData.health?.score >= 80) {
		total += POINTS.HEALTH_SCORE_80;
	}

	return total;
}

/**
 * Calculate points for this month
 * @param {Object} activities - Activity data
 * @returns {number} - Monthly points
 */
function calculateMonthlyPoints(activities) {
	let points = 0;

	// Reports this month
	points += (activities.reportsThisMonth || 0) * POINTS.REPORT_SUBMISSION;

	// Events completed this month
	points += (activities.eventsCompletedThisMonth || 0) * POINTS.EVENT_COMPLETED;

	// Pulses this month
	points += (activities.pulsesThisMonth || 0) * POINTS.PULSE_SUBMITTED;

	// Pulse streak bonus
	if (activities.pulseStreak >= 4) {
		points += POINTS.PULSE_STREAK_WEEK;
	}

	// Partnerships this month
	points += (activities.partnershipsThisMonth || 0) * POINTS.PARTNERSHIP_ADDED;

	return points;
}

/**
 * Determine badges earned by a fork
 * @param {Object} forkData - Fork data
 * @returns {Array} - Array of earned badge objects
 */
function determineBadges(forkData) {
	const earned = [];

	// Event badges
	if (forkData.totalEvents >= 1) earned.push(BADGES.FIRST_EVENT);
	if (forkData.totalEvents >= 5) earned.push(BADGES.EVENT_HERO);
	if (forkData.totalEvents >= 10) earned.push(BADGES.EVENT_LEGEND);

	// Team badges
	if (forkData.teamComplete) earned.push(BADGES.TEAM_BUILDER);
	if (forkData.teamMembersAdded >= 5) earned.push(BADGES.RECRUITER);

	// Activity badges
	if (forkData.pulseStreak >= 8) earned.push(BADGES.PULSE_MASTER);
	if (forkData.reportsOnTime >= 10) earned.push(BADGES.REPORTER);

	// Health badges
	if (forkData.health?.score >= 60) earned.push(BADGES.HEALTHY);
	if (forkData.health?.score >= 80) earned.push(BADGES.THRIVING);
	if (forkData.health?.score >= 95) earned.push(BADGES.EXCEPTIONAL);

	// Partnership badges
	if (forkData.partnerships >= 1) earned.push(BADGES.PARTNER_UP);
	if (forkData.partnerships >= 5) earned.push(BADGES.CONNECTED);

	// Onboarding badge
	if (forkData.onboardingComplete) earned.push(BADGES.ONBOARDED);

	// Streak/Activity badges
	if (forkData.activeMonthsStreak >= 3) earned.push(BADGES.ON_FIRE);

	// Attendance badges
	if (forkData.maxEventAttendance >= 100) earned.push(BADGES.PACKED_HOUSE);
	else if (forkData.maxEventAttendance >= 50) earned.push(BADGES.CROWD_PLEASER);

	return earned;
}

/**
 * Get badge by ID
 * @param {string} badgeId - Badge ID
 * @returns {Object|null} - Badge object or null
 */
function getBadgeById(badgeId) {
	return Object.values(BADGES).find(b => b.id === badgeId) || null;
}

/**
 * Format badge for display
 * @param {Object} badge - Badge object
 * @returns {string} - Formatted string
 */
function formatBadge(badge) {
	return `${badge.emoji} **${badge.name}** — ${badge.description}`;
}

/**
 * Get level from total points
 * @param {number} points - Total points
 * @returns {Object} - Level info { level, name, color }
 */
function getLevelFromPoints(points) {
	if (points >= 500) return { level: 10, name: 'Legend', color: '#FFD700' };
	if (points >= 400) return { level: 9, name: 'Master', color: '#FF6B6B' };
	if (points >= 300) return { level: 8, name: 'Expert', color: '#FF9F43' };
	if (points >= 250) return { level: 7, name: 'Advanced', color: '#00F2FF' };
	if (points >= 200) return { level: 6, name: 'Skilled', color: '#00FF95' };
	if (points >= 150) return { level: 5, name: 'Intermediate', color: '#A29BFE' };
	if (points >= 100) return { level: 4, name: 'Apprentice', color: '#74B9FF' };
	if (points >= 50) return { level: 3, name: 'Beginner', color: '#81ECEC' };
	if (points >= 20) return { level: 2, name: 'Novice', color: '#B2BEC3' };
	return { level: 1, name: 'Newcomer', color: '#636E72' };
}

/**
 * Get points needed for next level
 * @param {number} currentPoints - Current total points
 * @returns {Object} - { nextLevel, pointsNeeded, progress }
 */
function getProgressToNextLevel(currentPoints) {
	const thresholds = [20, 50, 100, 150, 200, 250, 300, 400, 500];
	
	for (let i = 0; i < thresholds.length; i++) {
		if (currentPoints < thresholds[i]) {
			const prevThreshold = i > 0 ? thresholds[i - 1] : 0;
			const progress = currentPoints - prevThreshold;
			const needed = thresholds[i] - prevThreshold;
			return {
				nextLevel: i + 2,
				pointsNeeded: thresholds[i] - currentPoints,
				progress: Math.round((progress / needed) * 100),
			};
		}
	}

	return { nextLevel: 10, pointsNeeded: 0, progress: 100 };
}

module.exports = {
	POINTS,
	BADGES,
	calculateTotalPoints,
	calculateMonthlyPoints,
	determineBadges,
	getBadgeById,
	formatBadge,
	getLevelFromPoints,
	getProgressToNextLevel,
};