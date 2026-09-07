/**
 * @param {import("../types/api.js").TaskV2Type} taskType
 * @returns {boolean}
 */
export function isCompoundType(taskType) {
	return taskType === 'compound' || taskType === 'converter_compound';
}

/**
 * @param {import("../types/api.js").TaskV2Type} taskType
 * @returns {boolean}
 */
export function isNonParallelType(taskType) {
	return taskType === 'non_parallel' || taskType === 'converter_non_parallel';
}

/**
 * @param {import("../types/api.js").TaskV2Type} taskType
 * @returns {boolean}
 */
export function isParallelType(taskType) {
	return taskType === 'parallel';
}
/**
 * @param {import("../types/api.js").TaskV2Type} taskType
 * @returns {boolean}
 */
export function isConverterType(taskType) {
	return taskType === 'converter_compound' || taskType === 'converter_non_parallel';
}
