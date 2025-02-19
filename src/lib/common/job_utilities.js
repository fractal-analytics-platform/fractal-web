const completeTracebackLine = 'Traceback (most recent call last):';

/**
 * Split the error of a failed workflow job into multiple parts, marking the relevents ones,
 * so that they can be extracted or highlighted in a different way in the UI.
 *
 * @param {string|null} log
 * @param {boolean} ignoreUppercaseTraceback
 * @returns {Array<{text: string, highlight: boolean}>}
 */
export function extractJobErrorParts(log, ignoreUppercaseTraceback = false) {
	if (!log) {
		return [];
	}
	log = log.trim();
	if (!log.includes(completeTracebackLine) && ignoreUppercaseTraceback) {
		return [{ text: log, highlight: false }];
	}
	if (
		log.startsWith('TASK ERROR') ||
		log.startsWith('JOB ERROR') ||
		log.startsWith('UNKNOWN ERROR')
	) {
		const lines = log.split('\n');
		if (lines.length > 1) {
			const [firstLine, ...nextLines] = lines;
			return [{ text: firstLine, highlight: true }, ...extractTraceback(nextLines.join('\n'))];
		}
	}
	return [{ text: log, highlight: false }];
}

/**
 * @param {string} error
 */
function extractTraceback(error) {
	if (error.includes(completeTracebackLine)) {
		return extractCompleteTraceback(error);
	}
	return extractUppercaseTraceback(error);
}

/**
 * @param {string} error
 * @returns {Array<{text: string, highlight: boolean}>}
 */
function extractCompleteTraceback(error) {
	const index = error.lastIndexOf('Traceback (most recent call last):');
	if (index !== -1) {
		const firstPart = error.substring(0, index);
		const lastPart = error.substring(index);
		let relevantErrorStarted = false;
		let part = firstPart;
		const parts = [];
		const lines = lastPart.split('\n');
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (i > 0 && !relevantErrorStarted && !line.startsWith(' ') && !line.startsWith('\t')) {
				parts.push({ text: part.trim(), highlight: false });
				relevantErrorStarted = true;
				part = '';
			}
			part += line + '\n';
		}
		parts.push({ text: part.trim(), highlight: true });
		return parts;
	}
	return [{ text: error.trim(), highlight: false }];
}

/**
 * @param {string} error
 * @returns {Array<{text: string, highlight: boolean}>}
 */
function extractUppercaseTraceback(error) {
	const uppercaseTraceback = 'TRACEBACK:';
	const tracebackIndex = error.indexOf(uppercaseTraceback);
	if (tracebackIndex !== -1) {
		return [
			{ text: error.substring(tracebackIndex, uppercaseTraceback.length), highlight: false },
			{ text: error.substring(tracebackIndex + uppercaseTraceback.length + 1), highlight: true }
		];
	}
	return [{ text: error.trim(), highlight: false }];
}

/**
 * @param {string|null} completeJobError
 * @param {number|undefined} maxLines
 * @returns {string}
 */
export function extractRelevantJobError(completeJobError, maxLines = undefined) {
	if (!completeJobError) {
		return '';
	}
	const relevantParts = extractJobErrorParts(completeJobError).filter((p) => p.highlight);
	let relevantError;
	if (relevantParts.length === 0) {
		relevantError = completeJobError;
	} else {
		relevantError = relevantParts.map((p) => p.text).join('\n');
	}
	if (!maxLines) {
		return relevantError;
	}
	const lines = relevantError.split('\n');
	if (lines.length > maxLines) {
		const truncatedErrorLines = [];
		for (let i = 0; i < maxLines; i++) {
			truncatedErrorLines.push(lines[i]);
		}
		truncatedErrorLines.push('[...]');
		return truncatedErrorLines.join('\n');
	}
	return relevantError;
}

/**
 * @param {import("fractal-components/types/api").DatasetV2[]} datasets
 * @param {string} selectedDatasetName
 * @returns {string}
 */
export function generateNewUniqueDatasetName(datasets, selectedDatasetName) {
	let i = 1;
	const match = selectedDatasetName.match(/^(.*)_(\d+)$/);
	if (match) {
		selectedDatasetName = match[1];
	}
	let newDatasetName;
	do {
		newDatasetName = `${selectedDatasetName}_${i}`;
		i++;
	} while (datasets.filter((d) => d.name === newDatasetName).length > 0);
	return newDatasetName;
}

/**
 * @param {Array<import("fractal-components/types/api").WorkflowTaskV2>} workflowTasks
 * @param {{[key: number]: import('fractal-components/types/api').JobStatus}} statuses
 * @returns {number|undefined}
 */
export function getFirstTaskIndexForContinuingWorkflow(workflowTasks, statuses) {
	if (workflowTasks.find((wft) => statuses[wft.id] === 'submitted')) {
		// we can't re-submit while something is running
		return undefined;
	}
	return workflowTasks.find((wft) => !(wft.id in statuses) || statuses[wft.id] === 'failed')?.order;
}
