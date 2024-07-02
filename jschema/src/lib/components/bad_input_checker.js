import { NumberFormElement } from './form_element';
import { JsonSchemaDataError } from './form_manager';

/**
 * @param {import('../types/form').FormElement} element
 */
export function checkBadInputs(element) {
	switch (element.type) {
		case 'object':
		case 'array':
		case 'tuple':
			for (const child of element.children) {
				checkBadInputs(child);
			}
			break;
		default:
			if (element instanceof NumberFormElement && element.badInput) {
				throw new JsonSchemaDataError([{ message: 'Form contains invalid input' }]);
			}
	}
}
