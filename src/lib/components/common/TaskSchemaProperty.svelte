<script>
	/**
	 * This component takes in input a json schema property, a reference value for the property and
	 * the reference schema in order to render an appropriate set of DOM elements to edit the value
	 * accordingly to the schema.
	 */

	import { createEventDispatcher } from 'svelte';
	import TaskSchemaPropertyItems from '$lib/components/common/TaskSchemaPropertyItems.svelte';

	const dispatch = createEventDispatcher();

	export let referenceSchema = undefined;
	export let propertyValue = undefined;
	export let schemaProperty = undefined;
	export let schemaPropertyKey = undefined;

	// SchemaProperty main properties
	let title = schemaProperty.title;
	let type = schemaProperty.type;
	let description = schemaProperty.description;
	let defaultValue = schemaProperty.default;
	let items = schemaProperty.items;

	const updateMainProperties = function() {
		title = schemaProperty.title;
		type = schemaProperty.type;
		description = schemaProperty.description;
		defaultValue = schemaProperty.default;
		items = schemaProperty.items;
	};


	// Reference schema can not be undefined
	if (referenceSchema === undefined) {
		throw new Error('reference schema can not be undefined');
	}

	if (propertyValue === undefined) {
		console.log(schemaPropertyKey, propertyValue);
		// throw new Error('propertyValue can not be undefined');
	}

	if (schemaProperty === undefined) {
		throw new Error('a property definition must be given in order to render a DOM structure');
	}


	/**
	 * Resolve a reference in a schema
	 * @param {string} reference - the reference to resolve
	 * @param {object} schema - the schema to resolve the reference against
	 * @returns {object} the resolved reference
	 */
	function resolveReference(reference, schema) {
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

	const deserializeSubSchema = function(schema, referenceSchema) {
		// If schema has a $ref property, resolve it against the reference schema
		if (schema.$ref !== undefined) {
			// Store key in a variable
			schema = resolveReference(schema.$ref, referenceSchema);
		}
		// If schema has a allOf property, resolve it against the reference schema
		if (schema.allOf !== undefined) {
			// Should keep the schemaProperty initial properties
			const initialSchemaProperty = schema;
			// Resolve the first reference
			schema = resolveReference(schema.allOf[0].$ref, referenceSchema);
			// Merge the initial schemaProperty with the resolved one
			schema = { ...schema, ...initialSchemaProperty };
		}

		// If the schemaProperty is of type array, resolve the items property
		// The items property can be a nested array of items
		if (schema.type === 'array') {
			schema.items = deserializeSubSchema(schema.items, referenceSchema);
		}

		if (schema.type === 'object' && schema.properties !== undefined) {
			// Resolve each property
			for (const [key, property] of Object.entries(schema.properties)) {
				// If property has a reference, resolve it
				if (property.$ref !== undefined) {
					// Store key in a variable
					schema.properties[key] = resolveReference(property.$ref, referenceSchema);
				}

				// If property has an allOf, resolve it
				if (property.allOf !== undefined) {
					// Should keep the schemaProperty initial properties
					const initialSchemaProperty = property;
					// Resolve the first reference
					schema.properties[key] = resolveReference(property.allOf[0].$ref, referenceSchema);
					// Merge the initial schemaProperty with the resolved one
					schema.properties[key] = { ...schema.properties[key], ...initialSchemaProperty };
				}
			}
		}

		return schema;
	};


	// Resolve all json references within schemaProperty
	const deserializeSchemaReferences = function() {
		// If schema has a $ref property, resolve it against the reference schema
		if (schemaProperty.$ref !== undefined) {
			// Store key in a variable
			schemaProperty = resolveReference(schemaProperty.$ref, referenceSchema);
		}

		// If schemaProperty has a allOf property, resolve it against the reference schema
		if (schemaProperty.allOf !== undefined) {
			// Should keep the schemaProperty initial properties
			const initialSchemaProperty = schemaProperty;
			// Resolve the first reference
			schemaProperty = resolveReference(schemaProperty.allOf[0].$ref, referenceSchema);
			// Merge the initial schemaProperty with the resolved one
			schemaProperty = { ...schemaProperty, ...initialSchemaProperty };
		}

		// Resolve references in schemaProperty items recursively
		// If the schemaProperty is of type array, resolve the items property
		// The items property can be a nested array of items
		if (schemaProperty.type === 'array') {
			schemaProperty.items = deserializeSubSchema(schemaProperty.items, referenceSchema);
		}
	};

	// Resolve and update all json references within schemaProperty
	deserializeSchemaReferences();
	updateMainProperties();

	const handlePropertyChanged = function() {
		dispatch('propertyChanged', { schemaPropertyKey, propertyValue });
	};

	console.log(schemaProperty);

</script>

<div id='{schemaPropertyKey}' class='card'>
  <div class='card-body'>
    <h1>{title ?? schemaPropertyKey}</h1>
    <div>
      <p>Type: {type}</p>
      <p>Description: {description}</p>
      <p>ItemsType: {items?.type}</p>
    </div>
    <div>
      <span class='bg-light'>Default value: <code>{defaultValue}</code></span>
      {#if type === 'number' || type === 'integer' }
        <div>
          <input type='number' bind:value={propertyValue} on:change={handlePropertyChanged}>
        </div>
      {/if}

      {#if type === 'string' }
        <div>
          <input type='text' bind:value={propertyValue} on:change={handlePropertyChanged}>
        </div>
      {/if}

      {#if type === 'boolean' }
        <div>
          <input type='checkbox' bind:checked={propertyValue} on:change={handlePropertyChanged}>
        </div>
      {/if}

      {#if type === 'array'}
        <div>
          <span>Current value: {propertyValue}</span>
          <TaskSchemaPropertyItems value={propertyValue} itemsSchema={schemaProperty.items} />
        </div>
      {/if}

      <!--{#if type === 'object'}
        <p>{JSON.stringify(propertiesSchema)}</p>
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          {#each Object.keys(propertiesSchema) as propertyArgumentKey}
            <TaskArgumentProperty
              propertyKey={propertyArgumentKey}
              propertySchema={propertiesSchema[propertyArgumentKey]}
              bind:propertyValue={value[propertyArgumentKey]}
            ></TaskArgumentProperty>
          {/each}
          <button class='btn btn-primary'>Update</button>
        </form>
      {/if}-->
    </div>
  </div>
</div>
