# Error handling

This page describes which coding patterns are used by fractal-web to handle various error cases.

## Fractal-server errors structure

Fractal-server error responses payloads are usually JSON structures having the error under a `detail` key. This is not true for the 500 Internal Server Error, which doesn't provide a JSON payload.

Generic fractal-server errors contain the error message string directly as `detail` value or as an array of values:

```json
{ "detail": "this is the error message" }
```

```json
{ "detail": ["this is also an error"] }
```

Validation errors associated with a specific request field are represented using a `loc` array that describes the position of the invalid field in the request payload:

```json
{
  "detail": [
    {
      "loc": [
        "body",
        "zarr_url"
      ],
      "msg": "URLs must begin with '/' or 's3'.",
      "type": "value_error"
    }
  ]
}
```

Some validation errors may not be associated with a specific field and in that case their `loc` array will reference a `__root__` element:

```json
{
  "detail": [
    {
      "loc": [
        "body",
        "__root__"
      ],
      "msg": "error message",
      "type": "value_error"
    }
  ]
}
```

The goal of fractal-web is to extract the error message and display it inside an alert component or directly near the invalid form field, when possible. If an unexpected JSON structure is received, fractal-web will display the error JSON payload as it is, but that should happen rarely, except for the JSON Schema form, whose errors may result in some complex payloads.

## Error responses in Svelte backend (SSR)

Files in `src/lib/server/api` provide API calls to fractal-server to be used from Svelte backend. These calls are usually required to be successful in order to properly display the page, since they retrieve the main resources of the page. A failure at this level is usually a 404 error (e.g. attempting to open a project with a non existent id) or something really severe (500 errors). For this reason the API calls errors happening on Svelte backend should usually be directly propagated, in order to display the error code inside the page.

The utility function `responseError()` (in `error.js`) can be used to propagate the error in these cases. It will throw an exception if an error response is detected, automatically extracting the `detail`.

It is suggested to handle the unsuccessful response first, in order to return the payload at the end of the function.

```javascript
if (!response.ok) {
  await responseError(response);
}
return await response.json();
```

In this way it is easier to define properly the type of the response using JSDoc annotation.

## Error responses in Svelte frontend

### The AlertError class

The `AlertError` class represents errors handled by fractal-web that has to be displayed somewhere. It has a constructor that receives an object or string representing the error and an optional status code (if the error was originated from an unsuccessful API call).

It can be used to istantiate a new error message; this is mostly used when we need to propagate an error from a component to another, that will catch the error:

```javascript
throw new AlertError('Invalid JSON schema');
```

Most of the time it is used to handle an unsuccessful API response; the status code is used to check if it is a validation error (status is equals to 422) and it automatically extracts the message from the detail:

```javascript
throw await getAlertErrorFromResponse(response);
```

### The standard error alert

It is possible to use the `displayStandardErrorAlert()` function to display a generic error inside an Bootstrap alert component. The function returns a reference to a `StandardErrorAlert` component, that can be used to hide the error invoking its `hide()` function.

Inside the page we have to add a div for the alert component, with a defined id:

```html
<div id="errorAlert-projectInfoModal" />
```

Then we have to define a variable for the alert component:

```javascript
/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
let errorAlert = undefined;
```

Finally, we invoke the function to display the error:

```javascript
errorAlert = displayStandardErrorAlert(
  new AlertError(result, response.status),
  'errorAlert-projectInfoModal'
);
```

If we need to hide the error (for example before clicking a submit button again), we can invoke the `hide()` function.

```javascript
errorAlert?.hide();
```

Notice that we are using the optional chaining operator (`?.`), since the variable might be undefined if no error happened previously.

### Form validation errors

A form usually needs an error alert component to display generic errors and a mechanism to display errors associated with specific form fields. This logic has been incapsulated in the `FormErrorHandler` class.

The constructor accepts as first argument the id of the div that will contain the generic error message and as second argument an array containing all the fields that correspond with some input fields in the form.

```javascript
const formErrorHandler = new FormErrorHandler('taskCollectionError', [
  'package',
  'package_version',
  'package_extras',
  'python_version'
]);
```

Once created, it is possible to retrieve the `validationErrors` object from the form error handler:

```javascript
const validationErrors = formErrorHandler.getValidationErrorStore();
```

This is a Svelte store referencing a map of errors, so it has to be accessed prepending the `$` symbol: `$validationErrors`, as shown in the example above.

The Bootstrap validation classes are used inside the form: `has-validation` on parent, `is-invalid` on the invalid field and `invalid-feedback` for the message.

```svelte
<div class="input-group has-validation">
  <div class="input-group-text">
    <label class="font-monospace" for="package">Package</label>
  </div>
  <input
    name="package"
    id="package"
    type="text"
    class="form-control"
    required
    class:is-invalid={$validationErrors['package']}
    bind:value={python_package}
  />
  <span class="invalid-feedback">{$validationErrors['package']}</span>
</div>
```

The `handleErrorResponse()` function is used to populate the fields from an error response:

```javascript
if (!response.ok) {
  await formErrorHandler.handleErrorResponse(response);
}
```

The class also provides a `clearErrors()` function and some functions to manually add or remove errors (`addValidationError()`, `removeValidationError()`, `setGenericError()`); these are useful to handle some validation directly on the frontend (e.g. required fields), without performing any API calls.
