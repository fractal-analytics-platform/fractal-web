/**
 * Split the error of a failed workflow job into multiple parts, marking the relevents ones,
 * so that they can be extracted or highlighted in a different way in the UI.
 *
 * @param {string} jobError
 * @returns {Array<{text: string, highlight: boolean}>}
 */
export function extractJobErrorParts(jobError) {
	const tracebackLine = 'TRACEBACK:';
	const completeTracebackLine = 'Traceback (most recent call last):';

	if (jobError.includes(completeTracebackLine)) {
		const parts = [];
		let tracebackStarted = false;
		let relevantErrorStarted = false;
		let part = '';
		for (const line of jobError.split('\n')) {
			if (line === completeTracebackLine) {
				tracebackStarted = true;
			} else if (tracebackStarted && !relevantErrorStarted) {
				if (!line.startsWith(' ') && !line.startsWith('\t')) {
					parts.push({ text: part.trim(), highlight: false });
					relevantErrorStarted = true;
					part = '';
				}
			}
			part += line + '\n';
		}
		parts.push({ text: part.trim(), highlight: true });
		return parts;
	}

	if (jobError.includes(tracebackLine)) {
		const parts = jobError.split(new RegExp('(.*' + tracebackLine + '\n)(.*)', 's'));
		return parts
			.map((t) => t.trim())
			.filter((t) => t !== '')
			.map((text) => {
				return text.includes(tracebackLine)
					? { text, highlight: false }
					: { text, highlight: true };
			});
	}

	return [{ text: jobError.trim(), highlight: false }];
}

/**
 * @param {string} completeJobError
 * @returns {string}
 */
export function extractRelevantJobError(completeJobError) {
	const relevantParts = extractJobErrorParts(completeJobError).filter((p) => p.highlight);
	if (relevantParts.length === 0) {
		return completeJobError;
	}
	return relevantParts[0].text;
}
