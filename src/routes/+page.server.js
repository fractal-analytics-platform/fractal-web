import { env } from '$env/dynamic/private';
import { getLogger } from '$lib/server/logger.js';
import fs from 'fs/promises';

const logger = getLogger('page');

export async function load() {
	return {
		news: await getNews()
	};
}

async function getNews() {
	if (!env.NEWS_INFO_PATH) {
		return null;
	}
	try {
		try {
			await fs.stat(env.NEWS_INFO_PATH);
		} catch {
			logger.error("News info file %s doesn't exist", env.NEWS_INFO_PATH);
			return null;
		}
		const newsData = await fs.readFile(env.NEWS_INFO_PATH, { encoding: 'utf-8' });
		return newsData.trim();
	} catch (err) {
		logger.error('An error happened reading news info file %s', env.NEWS_INFO_PATH, err);
		return null;
	}
}
