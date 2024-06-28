# JSON Schema form module

The `jschema` folder on this repository contains a Svelte project that provides the JSON Schema form component (`JSchema.svelte`) and its related functions and classes. The file `index.js` contains the list of components and functions that are exported for public usage, so that they can be included using `from 'fractal-jschema'` from the main project.

The main project defines `fractal-jschema` in `vite.config.js`, as an alias pointing to `jschema/src/lib/index.js`. In this way the jschema module is automatically built when the main project is built and the Hot Module Reload feature still works.

Moreover, the path to jschema module has been added as `server.fs.allow` Vite config option, to prevent the following error while serving the files using `npm run dev`:

```
The request url "/path/to/fractal-web/jschema/src/lib/index.js" is outside of Vite serving allow list.
```

> **Important**: When importing js files inside the `jschema` module it is necessary to use a relative path. The editor might autocomplete the imports using the `$lib` prefix, but that will not work when the module is included in the main application, since it redefines the `$lib` path again.

## Structure of the code

The `JSchema` Svelte component intializes a class named `FormManager`, that handles the following features:

* creates and stores an object (`root`) used to draw the form;
* provides the functions to create new form elements;
* attaches a `notifyChange()` function to each created form element; this function is used by each component to notify changes to the manager (e.g. the value of an input changes, a new element is added to an array, and so on), then the function dispatches a `change` event up to the `JSchema` component;
* wraps the `SchemaValidator` and provides a `validate()` function;
* provides a `getFormData()` function, that returns an object based on the data present in the form.

The creation of the `root` object requires 2 preliminary steps, that are useful to reduce the complexity of the subsequent object creation:

1. provided JSON Schema is adapted, to create a simpler but equivalent JSON Schema (`jschema_adapter.js`);
2. an object representing the initial form data is created, considering both the provided data (if any) and the default values (`jschema_initial_data.js`).

The `adaptJsonSchema()` function does the following:

1. removes the properties to ignore (e.g. `zarr_url`, `zarr_urls`, `init_args`, `zarr_dir`);
2. resolves and replaces the schema references (`$ref` fields pointing to definitions);
3. merges the `allOf` items.

The `getJsonSchemaData()` function initializes an object representing the initial form data. If the `initialValue` parameter is not set the created object is populated using the default values. If an `initialValue` object is provided, the function adds to it all the optional fields set to null (this is needed to have an object that acts as a complete skeleton for the form).

Using the adapted JSON Schema and the computed data object, the `FormManager` populates the `root` object, initializing a dedicated class for each form element (`NumberFormElement`, `ArrayFormElement`, `BooleanFormElement`, ...). These classes contain fields that are specific to each form element type and may contain additional functions to manipulate them (e.g. `addChild`, `removeChild`). Functions that add new children delegate the creation to the `FormManager`, since it is the class having the knowledge to create form elements of any type, and then add the new child to an internal array of children.

Each form element is mapped to a dedicated Svelte component (e.g. the `NumberFormElement` class is passed to a `NumberProperty.svelte` component). Each property component can contain additional functions for validating the input values and display the validation errors, but delegates to the wrapped form element class any additional logic.

This structure attempts to achieve a greater separation of concerns, needed to handle properly such a complex component.
