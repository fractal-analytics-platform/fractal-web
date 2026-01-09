import { writable } from 'svelte/store';

// The following store should be used to propagate selected project to display
// within a ProjectInfoModal. Every component that will update the project
// inside the store, will also update the to-be-displayed project in a modal.
/** @type {import('svelte/store').Writable<import('fractal-components/types/api').ProjectV2|undefined>}} */
export const projectInfoModalV2 = writable(undefined);

export const navigating = writable(false);
export const navigationCancelled = writable(false);

/** @type {import('svelte/store').Writable<Array<import('fractal-components/types/api').TaskGroupActivityV2>>} */
export const recentActivities = writable([]);

/** 
 * @type {import('svelte/store').Writable<import('$lib/common/errors').AlertError|null>}
 * Groups can be added during user creation. In that case, 2 API calls are performed.
 * This writable is used to store the groups call error and display it after the redirect.
 */
export const groupsErrorOnUserCreation = writable(null);
