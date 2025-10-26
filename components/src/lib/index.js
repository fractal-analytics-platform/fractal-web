import JSchema from './jschema/JSchema.svelte';
import PropertyDescription from './jschema/properties/PropertyDescription.svelte';
import { SchemaValidator, detectSchemaVersion } from './jschema/jschema_validation';
import {
	deepCopy,
	getValidationErrorMessage,
	stripNullAndEmptyObjectsAndArrays,
	normalizePayload,
	nullifyEmptyStrings
} from './common/utils';
import {
	isCompoundType,
	isNonParallelType,
	isParallelType,
	hasComputeArguments,
	hasInitialisationArguments,
	hasNonParallelArguments,
	hasParallelArguments
} from './common/workflow_task_utils';
import { getPropertiesToIgnore } from './jschema/property_utils';
import { JsonSchemaDataError } from './jschema/form_manager';
import { stripDiscriminator, stripIgnoredProperties } from './jschema/jschema_adapter';
import FilteredTasksTable from './tasks/FilteredTasksTable.svelte';

// Exporting components for public usage
export {
	JSchema,
	SchemaValidator,
	deepCopy,
	stripNullAndEmptyObjectsAndArrays,
	stripIgnoredProperties,
	getPropertiesToIgnore,
	JsonSchemaDataError,
	getValidationErrorMessage,
	PropertyDescription,
	detectSchemaVersion,
	FilteredTasksTable,
	isCompoundType,
	isNonParallelType,
	isParallelType,
	hasComputeArguments,
	hasInitialisationArguments,
	hasNonParallelArguments,
	hasParallelArguments,
	normalizePayload,
	nullifyEmptyStrings,
	stripDiscriminator
};
