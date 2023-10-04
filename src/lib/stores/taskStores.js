import { writable } from 'svelte/store';

/** @type {import('svelte/types/runtime/store').Writable<import('$lib/types').Task|undefined>} */
export const taskStore = writable(undefined);
/** @type {import('svelte/types/runtime/store').Writable<import('$lib/types').Task|undefined>} */
export const originalTaskStore = writable(undefined);
export const modalTaskCollectionId = writable(undefined);
