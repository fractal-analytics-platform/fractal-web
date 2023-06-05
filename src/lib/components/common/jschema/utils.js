/**
 * Resolve a reference in a schema
 * @param {string} reference - the reference to resolve
 * @param {object} schema - the schema to resolve the reference against
 * @returns {object} the resolved reference
 */
export function resolveSchemaReference(reference, schema) {
	// If reference is a string, resolve it
	if (typeof reference === 'string') {
		// If reference is a local reference, resolve it
		if (reference.startsWith('#')) {
			// Remove the first character of the reference
			reference = reference.slice(1);

			// Split the reference into its parts
			const referenceParts = reference.split('/');

			// Remove the first part of the reference
			referenceParts.shift();

			// Resolve the reference against the schema
			let resolvedReference = schema;
			for (const referencePart of referenceParts) {
				resolvedReference = resolvedReference[referencePart];
			}

			// Return the resolved reference
			return resolvedReference;
		}
	}
}
