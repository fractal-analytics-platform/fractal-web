<script>
	/**
	 * This component takes in input a json schema property, a reference value for the property and
	 * the reference schema in order to render an appropriate set of DOM elements to edit the value
	 * accordingly to the schema.
	 */

	import { createEventDispatcher } from 'svelte';
	import TaskArgumentIterableValue from '$lib/components/common/TaskArgumentIterableValue.svelte';
	import TaskArgumentProperty from '$lib/components/common/TaskArgumentProperty.svelte';

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


		// If the schemaProperty is of type array, resolve the items property
		if (schemaProperty.type === 'array') {
			// If items is a reference, resolve it
			if (schemaProperty.items.$ref !== undefined) {
				// Store key in a variable
				schemaProperty.items = resolveReference(schemaProperty.items.$ref, referenceSchema);
			}

			// If items is an allOf, resolve it
			if (schemaProperty.items.allOf !== undefined) {
				// Should keep the schemaProperty initial properties
				const initialSchemaProperty = schemaProperty.items;
				// Resolve the first reference
				schemaProperty.items = resolveReference(schemaProperty.items.allOf[0].$ref, referenceSchema);
				// Merge the initial schemaProperty with the resolved one
				schemaProperty.items = { ...schemaProperty.items, ...initialSchemaProperty };
			}

			// If items is an object, resolve its properties
			if (schemaProperty.items.type === 'object') {
				// Resolve each property
				for (const [key, value] of Object.entries(schemaProperty.items.properties)) {
					// If property is a reference, resolve it
					if (value.$ref !== undefined) {
						// Store key in a variable
						schemaProperty.items.properties[key] = resolveReference(value.$ref, referenceSchema);
					}
					// If property is an allOf, resolve it
					if (value.allOf !== undefined) {
						// Should keep the schemaProperty initial properties
						const initialSchemaProperty = schemaProperty.items.properties[key];
						// Resolve the first reference
						schemaProperty.items.properties[key] = resolveReference(value.allOf[0].$ref, referenceSchema);
						// Merge the initial schemaProperty with the resolved one
						schemaProperty.items.properties[key] = { ...schemaProperty.items.properties[key], ...initialSchemaProperty };
					}
				}
			}

			// If items is an array, resolve its items
			if (schemaProperty.items.type === 'array') {
				// If items is a reference, resolve it
				if (schemaProperty.items.items.$ref !== undefined) {
					// Store key in a variable
					schemaProperty.items.items = resolveReference(schemaProperty.items.items.$ref, referenceSchema);
				}
				// If items is an allOf, resolve it
				if (schemaProperty.items.items.allOf !== undefined) {
					// Should keep the schemaProperty initial properties
					const initialSchemaProperty = schemaProperty.items.items;
					// Resolve the first reference
					schemaProperty.items.items = resolveReference(schemaProperty.items.items.allOf[0].$ref, referenceSchema);
					// Merge the initial schemaProperty with the resolved one
					schemaProperty.items.items = { ...schemaProperty.items.items, ...initialSchemaProperty };
				}
			}
		}

		return schemaProperty;
	};

	// Resolve and update all json references within schemaProperty
	deserializeSchemaReferences();
	updateMainProperties();

	const handleTaskArgumentUpdate = function() {
		dispatch('argumentUpdated', { schemaPropertyKey, propertyValue });
		console.log('Argument updated', propertyValue);
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
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          <input type='number' bind:value={propertyValue}>
          <button class='btn btn-primary'>Update</button>
        </form>
      {/if}

      {#if type === 'string' }
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          <input type='text' bind:value={propertyValue}>
          <button class='btn btn-primary'>Update</button>
        </form>
      {/if}

      {#if type === 'boolean' }
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          <input type='checkbox' bind:checked={propertyValue}>
          <button class='btn btn-primary'>Update</button>
        </form>
      {/if}

      {#if type === 'array'}
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          <span>Current value: {propertyValue}</span>
          <TaskArgumentIterableValue value={propertyValue} itemsSchema={schemaProperty.items} />
          <button class='btn btn-primary'>Update</button>
        </form>
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
