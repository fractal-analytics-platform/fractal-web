<script>/**
 * This component handles the values of a task argument that has properties
 * In essence, a task argument that is of type object will always have properties as its values
 * This component will handle the update of every property
 */
import TaskArgumentIterableValue from '$lib/components/common/TaskArgumentIterableValue.svelte';

// import { createEventDispatcher } from 'svelte';

// Event dispatcher
// const dispatch = createEventDispatcher();

export let propertySchema = undefined;
export let propertyKey = undefined;
let propertyName = undefined;
	let propertyDescription = undefined;
	let propertyType = undefined;
	let propertyDefaultValue = undefined;
	export let propertyValue = undefined;

	if (propertySchema !== undefined) {
		propertyName = propertySchema.title;
		if (propertyName === undefined) {
			propertyName = propertyKey;
		}
		propertyDescription = propertySchema.description;
		propertyType = propertySchema.type;
		propertyDefaultValue = propertySchema.default;
		if (propertyValue === undefined) {
			propertyValue = propertyDefaultValue;
		}
	}


</script>

<div>
  <p><strong>Task argument property</strong></p>
  <p>Name: {propertyName}</p>
  <p>Description: {propertyDescription}</p>
  <p>Type: {propertyType}</p>
  <p>Default value: {propertyDefaultValue}</p>

  {#if propertyType === 'integer' || propertyType === 'number' }
    <input type='number' bind:value={propertyValue}>
  {/if}

  {#if propertyType === 'string' }
    <input type='text' bind:value={propertyValue}>
  {/if}

  {#if propertyType === 'boolean' }
    <input type='checkbox' bind:checked={propertyValue}>
  {/if}

  {#if propertyType === 'array' }
    <TaskArgumentIterableValue

    ></TaskArgumentIterableValue>
  {/if}

</div>