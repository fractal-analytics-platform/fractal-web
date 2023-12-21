import { writable } from 'svelte/store';

// The following store should be used to propagate selected project to display
// within a ProjectInfoModal. Every component that will update the project
// inside the store, will also update the to-be-displayed project in a modal.
/** @type {import('svelte/types/runtime/store').Writable<import('$lib/types').Project|undefined>}} */
export const projectInfoModal = writable(undefined);

// Context project store
export const contextProject = writable({
	project: undefined,
	workflows: [],
	datasets: []
});
