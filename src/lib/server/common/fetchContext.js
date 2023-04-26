// This module enables to override a fetch function in modules that requires it.
export let fetchContext = fetch
export const setFetch = (fetchFunction) => {
  fetchContext = fetchFunction
}