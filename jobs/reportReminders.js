const cron = require('node-cron');
const notion = require('../lib/notion');

module.exports = (client) => {
	// Run daily at 9 AM
	cron.schedule('0 9 * * *', async () => {
		console.log('[JOB] Running Report Reminders Check...');
		
		try {
			const forks = await notion.getForks();
			const activeForks = forks.filter(f => f.properties?.Status?.select?.name === 'Active');
			const guild = client.guilds.cache.first();
			if (!guild) return;

			const leadsCouncil = guild.channels.cache.find(c => c.name === 'leads-council');

			// Calculate report deadlines
			const now = new Date();
			const currentDay = now.getDate();
			const currentMonth = now.getMonth();
			const daysInMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();

			// Monthly report: Due on the last day of the month
			const monthlyDueDate = daysInMonth;
			const daysUntilMonthly = monthlyDueDate - currentDay;

			// Bi-weekly report: Due every 2 weeks (on 15th and last day)
			const biweeklyDueDate1 = 15;
			const biweeklyDueDate2 = daysInMonth;
			const daysUntilBiweekly1 = biweeklyDueDate1 - currentDay;
			const daysUntilBiweekly2 = biweeklyDueDate2 - currentDay;
			const daysUntilBiweekly = daysUntilBiweekly1 > 0 ? daysUntilBiweekly1 : daysUntilBiweekly2;

			for (const fork of activeForks) {
				const city = fork.properties.City?.rich_text?.[0]?.text?.content || 
				             fork.properties['Fork Name']?.title?.[0]?.text?.content || 
				             'UNKNOWN';
				const leadId = fork.properties['Discord ID']?.rich_text?.[0]?.text?.content;

				if (!leadId || !leadsCouncil) continue;

				// Get reports for this month
				const reports = await notion.getReports(fork.id);
				const thisMonthReports = reports.filter(r => {
					const submitted = new Date(r.submittedDate);
					return submitted.getMonth() === currentMonth && 
					       submitted.getFullYear() === now.getFullYear();
				});

				const monthlyReportSubmitted = thisMonthReports.some(r => r.type === 'monthly');
				const biweeklyReportSubmitted = thisMonthReports.some(r => r.type === 'bi-weekly');

				// 48 hours before monthly deadline
				if (daysUntilMonthly === 2 && !monthlyReportSubmitted) {
					await leadsCouncil.send(`📋 <@${leadId}> — Monthly report for ${city} is due in 48 hours. Submit via \`/report-submit\` to stay on track!`);
				}

			// Monthly deadline missed (check on 1st of new month if last month's report wasn't submitted)
			if (currentDay === 1 && !monthlyReportSubmitted) {
				await leadsCouncil.send(`⚠️ <@${leadId}> — Monthly report for ${city} is overdue. Please submit immediately to avoid health score impact.`);
			}

			// Bi-weekly deadline missed (check day after bi-weekly due dates)
			if ((currentDay === 16 || currentDay === 1) && !biweeklyReportSubmitted) {
				await leadsCouncil.send(`⚠️ <@${leadId}> — Bi-weekly report for ${city} is overdue. Please submit immediately!`);
			}

				// 48 hours before bi-weekly deadline
				if ((daysUntilBiweekly1 === 2 || daysUntilBiweekly2 === 2) && !biweeklyReportSubmitted) {
					await leadsCouncil.send(`📋 <@${leadId}> — Bi-weekly report for ${city} is due in 48 hours. Submit via \`/report-submit\`!`);
				}
			}

			console.log('[JOB] Report Reminders Check completed');

		} catch (error) {
			console.error('[JOB ERROR] Report Reminders Check failed:', error);
		}
	});
};