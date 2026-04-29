const cron = require('node-cron');
const notion = require('../lib/notion');

/**
 * Report Late Updater Job
 * Queries reports with status 'on-time' and marks them as 'late' if past their deadline.
 * Runs hourly to ensure reports are flagged appropriately after deadlines pass.
 */
module.exports = (client) => {
	// Run hourly at minute 0
	cron.schedule('0 * * * *', async () => {
		console.log('[JOB] Running Report Late Updater...');
		
		try {
			const forks = await notion.getForks();
			const activeForks = forks.filter(f => f.properties?.Status?.select?.name === 'Active');
			const now = new Date();

			// Get timezone-aware current date (using local timezone)
			const currentYear = now.getFullYear();
			const currentMonth = now.getMonth();
			const currentDay = now.getDate();

			// Calculate monthly deadline: last day of previous month for reports due last month
			// For current month reports, deadline is last day of current month
			const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
			
			// Bi-weekly deadlines: 15th and last day of month
			const biweeklyDeadline1 = 15;
			const biweeklyDeadline2 = lastDayOfCurrentMonth;

			let updatedCount = 0;

			for (const fork of activeForks) {
				const reports = await notion.getReports(fork.id);
				
				// Only check reports marked as 'on-time'
				const onTimeReports = reports.filter(r => r.status === 'on-time');
				
				for (const report of onTimeReports) {
					if (!report.submittedDate) continue;
					
					const submittedDate = new Date(report.submittedDate);
					const submitYear = submittedDate.getFullYear();
					const submitMonth = submittedDate.getMonth();
					const submitDay = submittedDate.getDate();

					let isLate = false;

					if (report.type === 'monthly') {
						// Monthly report: due on the last day of the month it was submitted
						const lastDayOfMonth = new Date(submitYear, submitMonth + 1, 0).getDate();
						const monthlyDeadline = new Date(submitYear, submitMonth + 1, 0, 23, 59, 59);
						
						// If we're past the deadline for this month's report
						if (now > monthlyDeadline) {
							isLate = true;
						}
					} else if (report.type === 'bi-weekly') {
						// Bi-weekly report: due on 15th or last day of month
						if (submitDay <= 15) {
							// First half bi-weekly: due on the 15th
							const deadline = new Date(submitYear, submitMonth, 15, 23, 59, 59);
							if (now > deadline) {
								isLate = true;
							}
						} else {
							// Second half bi-weekly: due on last day of month
							const lastDay = new Date(submitYear, submitMonth + 1, 0).getDate();
							const deadline = new Date(submitYear, submitMonth, lastDay, 23, 59, 59);
							if (now > deadline) {
								isLate = true;
							}
						}
					}

					if (isLate) {
						try {
							// Update report status to 'late'
							await notion.updateReport(report.id, { status: 'late' });
							updatedCount++;
							console.log(`[JOB] Marked report ${report.id} as late for fork in ${fork.properties.City?.rich_text?.[0]?.text?.content || 'unknown'}`);
						} catch (e) {
							console.error(`[JOB] Failed to mark report ${report.id} as late:`, e.message);
						}
					}
				}
			}

			console.log(`[JOB] Report Late Updater completed. Updated ${updatedCount} reports.`);

		} catch (error) {
			console.error('[JOB ERROR] Report Late Updater failed:', error);
		}
	});
};