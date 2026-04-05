const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_FORK_REGISTRY_DB;

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
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                or: [
                    { property: 'Status', select: { equals: 'Active' } },
                    { property: 'Status', select: { equals: 'Pending' } },
                ],
            },
        });
        return response.results;
    },

    async findForkByCity(city) {
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'City',
                rich_text: { equals: city },
            },
        });
        return response.results[0];
    }
};
