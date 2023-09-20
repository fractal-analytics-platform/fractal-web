import { error } from '@sveltejs/kit';
import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';

export function PostResourceException(response) {
	this.reason = response;
}

/**
 * Propagates an error response.
 * @param {Response} response
 */
export async function responseError(response) {
	throw error(response.status, await response.json());
}

/**
 * Class that can be used by front-end to propagate an error from a component to another.
 * Used for example to handle the displaying of the error alert when using the ConfirmActionButton.
 */
export class AlertError extends Error {
	/**
	 * @param {any} reason
	 */
	constructor(reason) {
		super();
		this.reason = reason;
	}
}

/**
 * Display a standard error alert on the desired HTML element.
 * @param {any} error
 * @param {string} targetElementId
 */
export function displayStandardErrorAlert(error, targetElementId) {
	const errorAlert = document.getElementById(targetElementId);
	if (errorAlert) {
		new StandardErrorAlert({
			target: errorAlert,
			props: {
				error
			}
		});
	} else {
		console.warn(`Unable to display the error: element ${targetElementId} not found`);
	}
}
