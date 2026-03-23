import { stripNullAndEmptyObjectsAndArrays } from "../common/utils";
import { adaptJsonSchema } from "./jschema_adapter";
import { getJsonSchemaData } from "./jschema_initial_data";
import { getPropertiesToIgnore } from "./property_utils";

/**
 * Fill default values on old data, but only for new properties.
 * Needed at version update.
 * 
 * @param {object} newJschema 
 * @param {object} oldData 
 * @param {'pydantic_v1'|'pydantic_v2'} schemaVersion
 */
export function getUpdatedData(newJschema, oldData, schemaVersion) {
  const propertiesToIgnore = getPropertiesToIgnore(schemaVersion === 'pydantic_v1');
  const newAdapted = adaptJsonSchema(newJschema, propertiesToIgnore);
  const newDefault = getJsonSchemaData(newAdapted, schemaVersion);
  return mergeDeep(stripNullAndEmptyObjectsAndArrays(oldData), newDefault)
}

/**
 * @param {*} oldData 
 * @param {*} newData 
 */
function mergeDeep(oldData, newData) {
  if (typeof oldData !== 'object' || typeof newData !== 'object' ||
    typeof oldData !== typeof newData || (Array.isArray(oldData) && !Array.isArray(newData))
  ) {
    return oldData;
  }
  for (const key in newData) {
    if (Object.hasOwn(newData, key)) {
      // If the key exists in oldData and both are objects, merge recursively
      if (typeof newData[key] === 'object' && newData[key] !== null &&
        typeof oldData[key] === 'object' && oldData[key] !== null) {
        oldData[key] = mergeDeep(oldData[key], newData[key]);
      } else if (!Object.hasOwn(oldData, key)) {
        // If the key does not exist in oldData, add it
        oldData[key] = newData[key];
      }
    }
  }
  return oldData;
}
