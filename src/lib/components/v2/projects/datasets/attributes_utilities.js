/**
 * @param {{ [key: string]: null | Array<string | number | boolean> }} oldObject
 * @param {{ [key: string]: null | Array<string | number | boolean> }} newObject
 */
export function attributesChanged(oldObject, newObject) {
	if (Object.keys(oldObject).length !== Object.keys(newObject).length) {
		return true;
	}
	for (const [oldKey, oldValue] of Object.entries(oldObject)) {
		if (!(oldKey in newObject)) {
			return true;
		}
		const newValue = newObject[oldKey];
		if (Array.isArray(oldValue) && Array.isArray(newValue)) {
			if (oldValue.length !== newValue.length) {
				return true;
			}
			for (let i = 0; i < oldValue.length; i++) {
				if (oldValue[i] !== newValue[i]) {
					return true;
				}
			}
		} else if (oldValue !== newValue) {
			return true;
		}
	}
	return false;
}
