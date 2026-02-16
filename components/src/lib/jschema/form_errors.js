import { get } from 'svelte/store';

/**
 * @param {import("../types/form").FormElement} formElement 
 * @param {any[]} errors 
 * @returns {string[]}
 */
export function processErrors(formElement, errors) {
  /** 
   * Errors that have not been set to any form element
   * @type {string[]}
   */
  const genericErrors = [];
  for (const error of errors) {
    const errorIsSet = addErrorToForm(error, formElement);
    if (!errorIsSet) {
      genericErrors.push(JSON.stringify(error, null, 2));
    }
  }

  return genericErrors;
}

/**
 * @param {object} error
 * @param {import('../types/form').FormElement} parentElement 
 */
function addErrorToForm(error, parentElement) {
  if (ignoreUnselectedConditionalError(error, parentElement)) {
    return true;
  }
  if (error.instancePath.startsWith(parentElement.path)) {
    parentElement.hasErrors.set(true);
  }
  if (parentElement.path === error.instancePath) {
    setErrorToElement(error, parentElement);
    return true;
  } else {
    const children = getChildren(parentElement);
    for (const element of children) {
      if (ignoreUnselectedConditionalError(error, element)) {
        return true;
      }
      if (element.path === error.instancePath) {
        setErrorToElement(error, element);
        return true;
      }
      if (addErrorToForm(error, element)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * @param {object} error 
 * @param {import('../types/form').FormElement} element 
 */
function setErrorToElement(error, element) {
  element.hasErrors.set(true);
  if ('params' in error) {
    if ('missingProperty' in error.params && setErrorToChildElement(error, error.params.missingProperty, element)) {
      return;
    } else if ('additionalProperty' in error.params && setErrorToChildElement(error, error.params.additionalProperty, element)) {
      return;
    }
  } else if ('selectedItem' in element && element.selectedItem) {
    element.selectedItem.addError(getErrorMessage(error, element.selectedItem));
    return;
  }
  element.addError(getErrorMessage(error, element));
}

/**
 * @param {any} error 
 * @param {string} key 
 * @param {import('../types/form').FormElement} parentElement 
 */
function setErrorToChildElement(error, key, parentElement) {
  const children = getChildren(parentElement);
  for (const element of children) {
    if (element.key === key) {
      const message = getErrorMessage(error, element);
      element.addError(message);
      return true;
    }
  }
  return false;
}

/**
 * @param {any} error 
 * @param {import('../types/form').FormElement} element 
 */
function getErrorMessage(error, element) {
  if ('missingProperty' in error.params) {
    if ('children' in element && element.children.length > 0) {
      return 'missing required child value';
    }
    if (isPrimitiveTypeElement(element)) {
      return 'required property';
    }
  }
  return error.message;
}

/**
 * @param {import('../types/form').FormElement} element 
 */
function isPrimitiveTypeElement(element) {
  return element.type && ['string', 'number', 'boolean', 'enum'].includes(element.type);
}

/**
 * For oneOf properties, AJV returns errors also for unselected elements.
 * This function returns true when such an error is found, in order to ignore them.
 * @param {object} error 
 * @param {import('../types/form').FormElement} element 
 */
function ignoreUnselectedConditionalError(error, element) {
  if ('selectedItem' in element) {
    const { oneOf } = element.property;
    for (let i = 0; i < oneOf.length; i++) {
      if (i === get(element.selectedIndex)) {
        continue;
      }
      if (error.schemaPath.startsWith(`#/properties${element.path}/oneOf/${i}`)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * @param {import('../types/form').FormElement} element 
 */
function getChildren(element) {
  if ('children' in element) {
    return element.children;
  } else if ('selectedItem' in element && element.selectedItem) {
    return getChildren(element.selectedItem);
  }
  return [];
}
