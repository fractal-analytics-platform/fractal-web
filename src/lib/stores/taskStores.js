import { writable } from 'svelte/store';

export const taskStore = writable(undefined);
export const originalTaskStore = writable(undefined);
export const modalTaskCollectionId = writable(undefined);
