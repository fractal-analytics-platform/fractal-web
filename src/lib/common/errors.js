import { error } from '@sveltejs/kit';
import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';

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
	/** @type {null | { loc: string[], msg: string }} */
	simpleValidationMessage;

	/**
	 * @param {any} reason
	 * @param {number|null} statusCode
	 */
	constructor(reason, statusCode = null) {
		super();
		this.reason = reason;
		this.simpleValidationMessage = getSimpleValidationMessage(reason, statusCode);
	}

	/**
	 * @param {string[]} loc expected location of the validation message
	 * @returns {string | null} the validation message, if found
	 */
	getSimpleValidationMessage(...loc) {
		if (!this.simpleValidationMessage) {
			return null;
		}
		if (this.simpleValidationMessage.loc.length !== loc.length) {
			return null;
		}
		for (let i = 0; i < loc.length; i++) {
			if (this.simpleValidationMessage.loc[i] !== loc[i]) {
				return null;
			}
		}
		return this.simpleValidationMessage.msg;
	}
}

/**
 * Detects if the error message is a simple validation message for one field.
 *
 * @param {any} reason
 * @param {number | null} statusCode
 * @returns {null | { loc: string[], msg: string }}
 */
function getSimpleValidationMessage(reason, statusCode) {
	if (
		statusCode !== 422 ||
		!('detail' in reason) ||
		!Array.isArray(reason.detail) ||
		reason.detail.length !== 1
	) {
		return null;
	}
	const err = reason.detail[0];
	if (!Array.isArray(err.loc) || !err.msg || err.type !== 'value_error') {
		return null;
	}
	return {
		loc: err.loc.length > 1 && err.loc[0] === 'body' ? err.loc.slice(1) : err.loc,
		msg: err.msg
	};
}

/**
 * Display a standard error alert on the desired HTML element.
 * @param {any} error
 * @param {string} targetElementId
 * @returns {StandardErrorAlert|undefined}
 */
export function displayStandardErrorAlert(error, targetElementId) {
	const errorAlert = document.getElementById(targetElementId);
	if (errorAlert) {
		return new StandardErrorAlert({
			target: errorAlert,
			props: {
				error
			}
		});
	} else {
		console.warn(`Unable to display the error: element ${targetElementId} not found`);
	}
}
