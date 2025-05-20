import { error } from '@sveltejs/kit';
import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';
import { writable } from 'svelte/store';
import { mount } from 'svelte';

/**
 * Propagates an error response.
 * @param {Response} response
 */
export async function responseError(response) {
	let errorResponse = await response.json();
	if ('detail' in errorResponse) {
		errorResponse = errorResponse.detail;
	}
	error(response.status, errorResponse);
}

/**
 * @param {Response} response
 */
async function parseErrorResponse(response) {
	try {
		return await response.json();
	} catch {
		return `Invalid JSON response. Response status is ${response.status}.`;
	}
}

/**
 * @param {Response} response
 */
export async function getAlertErrorFromResponse(response) {
	const result = await parseErrorResponse(response);
	return new AlertError(result, response.status);
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
		return extractFieldValidationError(this.simpleValidationMessage, loc);
	}
}

/**
 * @param {any} errorResponse
 * @returns {string | object | null}
 */
export function extractErrorDetail(errorResponse) {
	if (typeof errorResponse !== 'object') {
		return null;
	}
	if (!('detail' in errorResponse)) {
		return null;
	}
	if (typeof errorResponse.detail === 'string') {
		return errorResponse.detail;
	}
	if (!Array.isArray(errorResponse.detail)) {
		return null;
	}
	if (errorResponse.detail.length !== 1) {
		return null;
	}
	return errorResponse.detail[0];
}

/**
 * Detects if the error message is a simple validation message for one field.
 *
 * @param {any} reason
 * @param {number | null} statusCode
 * @returns {null | { loc: string[], msg: string } | string}
 */
function getSimpleValidationMessage(reason, statusCode) {
	if (typeof reason === 'object' && 'message' in reason && typeof reason.message === 'string') {
		return reason.message;
	}
	if (!isValidationError(reason, statusCode)) {
		return null;
	}
	const err = extractErrorDetail(reason);
	if (err === null || typeof err === 'string') {
		return err;
	}
	if (!hasValidationErrorPayload(err)) {
		return null;
	}
	const loc = err.loc.length > 1 && err.loc[0] === 'body' ? err.loc.slice(1) : err.loc;
	return {
		loc: loc.length === 1 && loc[0] === '__root__' ? [] : loc,
		msg: err.msg
	};
}

/**
 * Extract the validation error, assuming that the call can fail only for on one
 * field. Returns null if there is no error or if there are multiple errors.
 * @param {any} reason
 * @param {number | null} statusCode
 * @param {string[] | undefined} loc expected location of the validation message,
 * undefined if any location is considered valid
 * @returns {string | null}
 */
export function getFieldValidationError(reason, statusCode, loc = undefined) {
	const simpleValidationMessage = getSimpleValidationMessage(reason, statusCode);
	return extractFieldValidationError(simpleValidationMessage, loc);
}

/**
 * @param {{ loc: string[], msg: string } | string|null} simpleValidationMessage
 * @param {string[] | undefined} loc expected location of the validation message,
 * undefined if any location is considered valid
 * @returns {string | null} the validation message, if found
 */
function extractFieldValidationError(simpleValidationMessage, loc) {
	if (!simpleValidationMessage) {
		return null;
	}
	if (typeof simpleValidationMessage === 'string') {
		return simpleValidationMessage;
	}
	if (loc === undefined) {
		return simpleValidationMessage.msg;
	}
	if (simpleValidationMessage.loc.length !== loc.length) {
		return null;
	}
	for (let i = 0; i < loc.length; i++) {
		if (simpleValidationMessage.loc[i] !== loc[i]) {
			return null;
		}
	}
	return simpleValidationMessage.msg;
}

/**
 * @param {any} reason
 * @param {number | null} statusCode
 * @returns {null | { [key: string]: string | string[] }}
 */
export function getValidationMessagesMap(reason, statusCode) {
	if (!isValidationError(reason, statusCode)) {
		return null;
	}
	if (!Array.isArray(reason.detail) || reason.detail.length === 0) {
		return null;
	}
	/** @type {{[key: string]: string | string[]}} */
	const map = {};
	for (const error of reason.detail) {
		if (!hasValidationErrorPayload(error)) {
			return null;
		}
		if (error.loc[0] !== 'body') {
			return null;
		}
		if (error.loc.length === 2) {
			map[error.loc[1]] = error.msg;
		} else if (error.loc.length === 3 && typeof error.loc[2] === 'number') {
			if (!(error.loc[1] in map)) {
				map[error.loc[1]] = [];
			}
			/** @type {string[]} */ (map[error.loc[1]])[error.loc[2]] = error.msg;
		} else {
			return null;
		}
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
function hasValidationErrorPayload(err) {
	return Array.isArray(err.loc) && typeof err.msg === 'string' && typeof err.type === 'string';
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
		return mount(StandardErrorAlert, {
			target: errorAlert,
			props: {
				error
			}
		});
	} else {
		console.warn(`Unable to display the error: element ${targetElementId} not found`);
	}
}

/**
 * Handle errors associated with a form, considering both error related to specific fields
 * and a generic error, displayed in a standard error alert component.
 */
export class FormErrorHandler {
	/**
	 * @param {string} errorAlertId id of the generic error alert component
	 * @param {string[]} handledErrorKeys keys associated with form fields
	 */
	constructor(errorAlertId, handledErrorKeys) {
		this.validationErrors = writable({});
		/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
		this.errorAlert = undefined;
		this.errorAlertId = errorAlertId;
		this.handledErrorKeys = handledErrorKeys;
	}

	/**
	 * @returns the store containing the map of validation errors
	 */
	getValidationErrorStore() {
		return this.validationErrors;
	}

	/**
	 * Manually add a validation error (e.g. for checks performed by the frontend
	 * before sending any request to the server).
	 * @param {string} key
	 * @param {string} value
	 */
	addValidationError(key, value) {
		this.validationErrors.update((errors) => ({ ...errors, [key]: value }));
	}

	/**
	 * @param {any} error
	 */
	setGenericError(error) {
		this.errorAlert = displayStandardErrorAlert(new AlertError(error), this.errorAlertId);
	}

	/**
	 * Manually remove a validation error.
	 * @param {string} key
	 */
	removeValidationError(key) {
		this.validationErrors.update((errors) => {
			const newErrors = { ...errors };
			delete newErrors[key];
			return newErrors;
		});
	}

	/**
	 * Extract the errors from the response and assign them to the validationErrors
	 * map or display the standard error alert in case of generic error.
	 * @param {Response} response
	 */
	async handleErrorResponse(response) {
		const result = await parseErrorResponse(response);
		const errorsMap = getValidationMessagesMap(result, response.status);
		if (errorsMap && this.validateErrorMapKeys(errorsMap)) {
			this.validationErrors.set(errorsMap);
		} else {
			this.errorAlert = displayStandardErrorAlert(
				new AlertError(result, response.status),
				this.errorAlertId
			);
		}
	}

	/**
	 * @private
	 * Returns true if all the keys of the error map are handled by the current page or component.
	 * Used to decide if it possible to show user friendly validation messages
	 * or if it is necessary to display a generic error message.
	 * @param {{[key:string]: string | string[] }} errorsMap
	 * @return {boolean}
	 */
	validateErrorMapKeys(errorsMap) {
		for (const key of Object.keys(errorsMap)) {
			if (!this.handledErrorKeys.includes(key)) {
				return false;
			}
		}
		return true;
	}

	clearErrors() {
		this.validationErrors.set({});
		this.errorAlert?.hide();
	}
}
