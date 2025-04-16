import { getPropertiesToIgnore } from '../jschema/property_utils';
import { stripIgnoredProperties } from '../jschema/jschema_adapter';

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

/**
 * @param {import("../types/api.js").WorkflowTaskV2} workflowTask
 * @returns {boolean}
 */
export function hasInitialisationArguments(workflowTask) {
	return (
		(hasNonParallelArguments(workflowTask) && hasParallelArguments(workflowTask)) ||
		(isCompoundType(workflowTask.task_type) && !workflowTask.task.args_schema_non_parallel)
	);
}

/**
 * @param {import("../types/api.js").WorkflowTaskV2} workflowTask
 * @returns {boolean}
 */
export function hasComputeArguments(workflowTask) {
	return (
		(hasNonParallelArguments(workflowTask) && hasParallelArguments(workflowTask)) ||
		(isCompoundType(workflowTask.task_type) && !workflowTask.task.args_schema_parallel)
	);
}

/**
 * @param {import("../types/api.js").WorkflowTaskV2} workflowTask
 * @returns {boolean}
 */
export function hasNonParallelArguments(workflowTask) {
	const argsSchemaNonParallel = workflowTask.task.args_schema_non_parallel;
	if (!argsSchemaNonParallel) {
		return false;
	}
	return (
		Object.keys(
			stripIgnoredProperties(argsSchemaNonParallel, getPropertiesToIgnore(false)).properties
		).length > 0
	);
}

/**
 * @param {import("../types/api.js").WorkflowTaskV2} workflowTask
 * @returns {boolean}
 */
export function hasParallelArguments(workflowTask) {
	const argsSchemaParallel = workflowTask.task.args_schema_parallel;
	if (!argsSchemaParallel) {
		return false;
	}
	return (
		Object.keys(stripIgnoredProperties(argsSchemaParallel, getPropertiesToIgnore(false)).properties)
			.length > 0
	);
}
