<script>
	/**
	 * TaskArgument svelte component renders a dom element with information about a task argument.
	 *
	 * This component shall allow a user to specify a new value for the property it's been displayed
	 * within the dom.
	 */

	import { createEventDispatcher } from 'svelte';
	import TaskArgumentIterableValue from '$lib/components/common/TaskArgumentIterableValue.svelte';
	import TaskArgumentProperty from '$lib/components/common/TaskArgumentProperty.svelte';

	// Task argument key within task schema or object schema property
	export let key;

	// Task argument index within a task schema list property
	export let index = undefined;

	// The title of this task argument
	export let title;

	// The type of this task argument
	export let type;
	// Argument items definition - set if the argument has items in its schema
	export let items = undefined;
	// Argument properties definition - set if the argument has properties in its schema
	export let propertiesSchema = undefined;

	// The description of this task argument
	export let description = 'No description provided';

	// The value of this task argument
	export let value = undefined;

	if (type !== undefined && type === 'boolean') {
		value = Boolean(value);
	}

	if (type !== undefined && type === 'object' && propertiesSchema !== undefined) {
		value = {};
		Object.keys(propertiesSchema).forEach(key => {
			value[key] = undefined;
		});
	}

	// The default value of this task argument
	export let defaultValue;

	// TODO: Check value and default value
	// If a given value is undefined, then value should be assigned defaultValue.
	// If no defaultValue is given, then value should be undefined.

	// Event dispatcher
	const dispatch = createEventDispatcher();

	function handleTaskArgumentUpdate() {
		dispatch('argumentUpdated', { key, index, value });
		console.log('Argument updated', value);
	}

</script>

<div id='{key}' class='card'>
  <div class='card-body'>
    <h1>{title}</h1>
    <p>Index: {index}</p>
    <div>
      <p>Type: {type}</p>
      <p>Description: {description}</p>
      <p>ItemsType: {items?.type}</p>
    </div>
    <div>
      <span class='bg-light'>Default value: <code>{defaultValue}</code></span>
      {#if type === 'number' || type === 'integer' }
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          <input type='number' bind:value={value}>
          <button class='btn btn-primary'>Update</button>
        </form>
      {/if}

      {#if type === 'string' }
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          <input type='text' bind:value={value}>
          <button class='btn btn-primary'>Update</button>
        </form>
      {/if}

      {#if type === 'boolean' }
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          <input type='checkbox' bind:checked={value}>
          <button class='btn btn-primary'>Update</button>
        </form>
      {/if}

      {#if type === 'array'}
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          <span>Current value: {value}</span>
          <TaskArgumentIterableValue iterableValue={value} iterableSchema={items} />
          <button class='btn btn-primary'>Update</button>
        </form>
      {/if}

      {#if type === 'object'}
        <p>{JSON.stringify(propertiesSchema)}</p>
        <form on:submit|preventDefault={handleTaskArgumentUpdate}>
          {#each Object.keys(propertiesSchema) as taskArgumentKey}
            <TaskArgumentProperty
              propertySchema={propertiesSchema[taskArgumentKey]}
              bind:propertyValue={value[taskArgumentKey]}
            ></TaskArgumentProperty>
          {/each}
          <button class='btn btn-primary'>Update</button>
        </form>
      {/if}
    </div>
  </div>
</div>
