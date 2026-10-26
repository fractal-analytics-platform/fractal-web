import { AUTH_COOKIE_NAME, FRACTAL_SERVER_HOST } from '$app/env/private';
import { getLogger } from '#lib/server/logger.js';
// FIXME: remove custom undici import when Node 24 will be deprecated
import { fetch, FormData } from 'undici';

const logger = getLogger('/v2/tasks/management/pip - JSON/Form proxy');

export const POST = async function ({ request, cookies }) {
	/** @type {import('#fractal-components/types/api.js').PipCollectionRequest} */
	const data = await request.json();

	const formData = new FormData();

	if (data.packageType === 'pypi') {
		formData.append('package', data.package);
		if (data.package_version) {
			formData.append('package_version', data.package_version);
		}
	} else if (data.file) {
		const buffer = Buffer.from(data.file.data, 'base64');
		const fileBlob = new Blob([buffer], {
			type: data.file.contentType || 'application/octet-stream'
		});
		formData.append('file', fileBlob, data.file.fileName);
	}

	if (data.python_version) {
		formData.append('python_version', data.python_version);
	}

	if (data.package_extras) {
		formData.append('package_extras', data.package_extras);
	}

	if (data.pinned_package_versions_pre) {
		formData.append(
			'pinned_package_versions_pre',
			JSON.stringify(data.pinned_package_versions_pre)
		);
	}
	if (data.pinned_package_versions_post) {
		formData.append(
			'pinned_package_versions_post',
			JSON.stringify(data.pinned_package_versions_post)
		);
	}

	let url = `${FRACTAL_SERVER_HOST}/api/v2/task/collect/pip?private=${data.private}`;
	if (!data.private && data.user_group_id) {
		url += `&user_group_id=${data.user_group_id}`;
	}

	logger.debug(`Sending collect request to ${url}`);

	const headers = new Headers();
	headers.set('Cookie', `${AUTH_COOKIE_NAME}=${cookies.get(AUTH_COOKIE_NAME)}`);

	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: formData
	});

	const result = await response.json();
	return Response.json(result, { status: response.status });
};
