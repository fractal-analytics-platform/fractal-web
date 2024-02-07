/**
 * Split the error of a failed workflow job into multiple parts, marking the relevents ones,
 * so that they can be extracted or highlighted in a different way in the UI.
 *
 * @param {string} log
 * @returns {Array<{text: string, highlight: boolean}>}
 */
export function extractJobErrorParts(log) {
	log = log.trim();
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

const completeTracebackLine = 'Traceback (most recent call last):';

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
 * @param {string} completeJobError
 * @param {number|undefined} maxLines
 * @returns {string}
 */
export function extractRelevantJobError(completeJobError, maxLines = undefined) {
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
