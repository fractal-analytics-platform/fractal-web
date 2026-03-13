<script>
	import ArrayProperty from './ArrayProperty.svelte';
	import CollapsibleProperty from './CollapsibleProperty.svelte';
	import ObjectProperty from './ObjectProperty.svelte';
	import StringProperty from './StringProperty.svelte';
	import BooleanProperty from './BooleanProperty.svelte';
	import NumberProperty from './NumberProperty.svelte';
	import EnumProperty from './EnumProperty.svelte';
	import TupleProperty from './TupleProperty.svelte';
	import ConditionalProperty from './ConditionalProperty.svelte';
	import UnexpectedProperty from './UnexpectedProperty.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} formElement BaseFormElement
	 * @property {boolean} [editable]
	 * @property {null|(() => void)} [reset] - Function passed by the parent that resets this element to its default value (used only on top-level objects)
	 * @property {null|(() => void)} [init] - Function passed by the parent that initializes a nullable element
	 */

	/** @type {Props} */
	let { formElement, editable = true, reset = null, init = null } = $props();
</script>

{#if formElement.type === 'string'}
	<StringProperty {formElement} {editable} />
{:else if formElement.type === 'number'}
	<NumberProperty {formElement} {editable} />
{:else if formElement.type === 'boolean'}
	<BooleanProperty {formElement} {editable} />
{:else if formElement.type === 'enum'}
	<EnumProperty {formElement} {editable} />
{:else if formElement.type === 'object'}
	<CollapsibleProperty {formElement} {reset} {init}>
		<ObjectProperty {formElement} {editable} showErrors={false} />
	</CollapsibleProperty>
{:else if formElement.type === 'array'}
	<ArrayProperty {formElement} {editable} {reset} />
{:else if formElement.type === 'tuple'}
	<TupleProperty {formElement} {editable} {reset} />
{:else if formElement.type === 'conditional'}
	<ConditionalProperty {formElement} {editable} {reset} />
{:else if formElement.type === 'unexpected' || formElement.type === 'invalid'}
	<UnexpectedProperty {formElement} {editable} />
{:else}
	<p>Unsupported property type {formElement.type}</p>
{/if}
