const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_FORK_REGISTRY_DB;

/**
 * Helper to query a database that handles the standard SDK and 
 * the specific "Data Source" pattern seen in this environment.
 */
async function queryDatabase(id, filter) {
	// Standard SDK approach
	if (typeof notion.databases.query === 'function') {
		const response = await notion.databases.query({
			database_id: id,
			filter: filter,
		});
		return response.results;
	}

	// Fallback/Special SDK approach (Data Sources)
	console.log(`[NOTION] databases.query missing, falling back to dataSources for database ${id}`);
	const db = await notion.databases.retrieve({ database_id: id });
	const dataSourceId = db.data_sources?.[0]?.id;
	
	if (!dataSourceId) {
		throw new Error(`Could not find a data source for database ${id}.`);
	}

	const response = await notion.dataSources.query({
		data_source_id: dataSourceId,
		filter: filter,
	});
	return response.results;
}

module.exports = {
	async createForkRequest(data) {
		return await notion.pages.create({
			parent: { database_id: databaseId },
			properties: {
				'Name': { title: [{ text: { content: data.name } }] },
				'City': { rich_text: [{ text: { content: data.city } }] },
				'Student': { select: { name: data.student ? 'Yes' : 'No' } },
				'About': { rich_text: [{ text: { content: data.about } }] },
				'Status': { select: { name: 'Pending' } },
                'Discord ID': { rich_text: [{ text: { content: data.userId } }] },
			},
		});
	},

	async updateForkStatus(pageId, status) {
		return await notion.pages.update({
			page_id: pageId,
			properties: {
				'Status': { select: { name: status } },
			},
		});
	},

    async updatePulse(pageId, date) {
        return await notion.pages.update({
            page_id: pageId,
            properties: {
                'Last Pulse': { date: { start: date } },
            },
        });
    },

    async getForks() {
		return await queryDatabase(databaseId, {
			or: [
				{ property: 'Status', select: { equals: 'Active' } },
				{ property: 'Status', select: { equals: 'Pending' } },
			],
		});
    },

    async findForkByCity(city) {
		const results = await queryDatabase(databaseId, {
			property: 'City',
			rich_text: { equals: city },
		});
		return results[0];
    }
};
