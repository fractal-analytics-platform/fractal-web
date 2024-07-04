<script>
	import ArrayProperty from './ArrayProperty.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';
	import ObjectProperty from './ObjectProperty.svelte';
	import StringProperty from './StringProperty.svelte';
	import BooleanProperty from './BooleanProperty.svelte';
	import NumberProperty from './NumberProperty.svelte';
	import EnumProperty from './EnumProperty.svelte';
	import TupleProperty from './TupleProperty.svelte';

	export let formElement;

	/**
	 * Function passed by the parent that reset this element to its default value (used only on top-level objects)
	 * @type {null|(() => void)}
	 */
	 export let reset = null;
</script>

{#if formElement.type === 'string'}
	<StringProperty {formElement} />
{:else if formElement.type === 'number'}
	<NumberProperty {formElement} />
{:else if formElement.type === 'boolean'}
	<BooleanProperty {formElement} />
{:else if formElement.type === 'enum'}
	<EnumProperty {formElement} />
{:else if formElement.type === 'object'}
	<CollapsibleProperty {formElement} {reset}>
		<ObjectProperty {formElement} />
	</CollapsibleProperty>
{:else if formElement.type === 'array'}
	<ArrayProperty {formElement} {reset} />
{:else if formElement.type === 'tuple'}
	<TupleProperty {formElement} {reset} />
{:else}
	<p>Unsupported property type {formElement.type}</p>
{/if}
