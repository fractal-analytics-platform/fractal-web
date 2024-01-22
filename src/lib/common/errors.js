import { error } from '@sveltejs/kit';
import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';

/**
 * Propagates an error response.
 * @param {Response} response
 */
export async function responseError(response) {
	error(response.status, await response.json());
}

/**
 * Class that can be used by front-end to propagate an error from a component to another.
 * Used for example to handle the displaying of the error alert when using the ConfirmActionButton.
 */
export class AlertError extends Error {
	/**
	 * @param {any} reason
	 * @param {number|null} statusCode
	 */
	constructor(reason, statusCode = null) {
		super();
		this.reason = reason;
		/** @type {null | { loc: string[], msg: string } | string} */
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
		if (typeof this.simpleValidationMessage === 'string') {
			return this.simpleValidationMessage;
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
 * @returns {null | { loc: string[], msg: string } | string}
 */
function getSimpleValidationMessage(reason, statusCode) {
	if (!isValidationError(reason, statusCode)) {
		return null;
	}
	if (typeof reason.detail === 'string') {
		return reason.detail;
	}
	if (reason.detail.length !== 1) {
		return null;
	}
	const err = reason.detail[0];
	if (!isValueError(err)) {
		return null;
	}
	return {
		loc: err.loc.length > 1 && err.loc[0] === 'body' ? err.loc.slice(1) : err.loc,
		msg: err.msg
	};
}

/**
 * @param {any} reason
 * @param {number | null} statusCode
 * @returns {null | { [key: string]: string }}
 */
export function getValidationMessagesMap(reason, statusCode) {
	if (!isValidationError(reason, statusCode)) {
		return null;
	}
	if (!Array.isArray(reason.detail) || reason.detail.length === 0) {
		return null;
	}
	/** @type {{[key: string]: string}} */
	const map = {};
	for (const error of reason.detail) {
		if (!isValueError(error)) {
			return null;
		}
		if (error.loc.length !== 2 || error.loc[0] !== 'body') {
			return null;
		}
		map[error.loc[1]] = error.msg;
	}
	return map;
}

/**
 * @param {any} reason
 * @param {number | null} statusCode
 * @returns {boolean}
 */
function isValidationError(reason, statusCode) {
	return (
		statusCode === 422 &&
		'detail' in reason &&
		(Array.isArray(reason.detail) || typeof reason.detail === 'string')
	);
}

/**
 * @param {any} err
 * @returns {boolean}
 */
function isValueError(err) {
	return Array.isArray(err.loc) && !!err.msg && err.type.startsWith('value_error');
}

/**
 * Returns true if all the keys of the error map are handled by the current page or component.
 * Used to decide if it possible to show user friendly validation messages
 * or if it is necessary to display a generic error message.
 * @param {{[key:string]: string}} errorsMap
 * @param {string[]} handledErrorKeys
 * @return {boolean}
 */
export function validateErrorMapKeys(errorsMap, handledErrorKeys) {
	for (const key of Object.keys(errorsMap)) {
		if (!handledErrorKeys.includes(key)) {
			return false;
		}
	}
	return true;
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
