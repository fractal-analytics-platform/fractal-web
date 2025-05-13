import { writable } from 'svelte/store';

// The following store should be used to propagate selected project to display
// within a ProjectInfoModal. Every component that will update the project
// inside the store, will also update the to-be-displayed project in a modal.
/** @type {import('svelte/store').Writable<import('fractal-components/types/api').ProjectV2|undefined>}} */
export const projectInfoModalV2 = writable(undefined);

export const navigating = writable(false);
export const navigationCancelled = writable(false);
