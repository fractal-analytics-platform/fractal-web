# Code-base structure

This project is based on [svelte kit](https://kit.svelte.dev) and follows its conventions and structure.

## 1-level folders

By default, the main application folder is located at `/src`.
The structure of this folder is explained in depth
in [svelte kit docs](https://kit.svelte.dev/docs/project-structure#project-files)

`/static` is a folder related to static files that will be served by the client server.
More on this could be found in
the [svelte kit docs](https://kit.svelte.dev/docs/project-structure#project-files-static).

The `/lib` folder contains files and sources that enable correct instrumentation and testing of this client application.
Currently, within this folder are present files to support the project's unit tests arrangements and other
library files to populate local instances of the fractal server in order to test the client.

As for testing, currently, there are two folders `/__tests__` and `/tests`.
The former contains files of unit tests executed by `vitest` and the latest
is related to `playwright` testing.
This structure could be improved and organized differently by updating project configuration files,
specifically `vite.config.js` and `playwrght.config.js` which are located at project root.

`/examples` folder contains configuration guidance to set up local environments to test different
fractal server / fractal web interoperability architectures.

`/docs` folder is the root of the project docs files.

```
[project root]
├ /src
├ /static
├ /lib
├ /__tests__
├ /tests
├ /examples
├ /docs
```

## Application structure

With reference to `/src/routes` folder, therein are defined svelte kit page components
that structure the fractal web client.

> It is important to mention that, this client application
> is [server-side rendered](https://kit.svelte.dev/docs/glossary#ssr).
> By default, this is the default behaviour
> of [svelte kit](https://kit.svelte.dev/docs/introduction#sveltekit-vs-svelte).

> Before proceeding, it is important to understand the distinction of files terminating with the suffix `+[.]server.js`.
> Those files are explicitly processed by the client's server.

This client application is in essence a proxy that enables users to interact with a server application, the fractal
server.
Through the browser interface, the svelte application enable users to build HTTP requests that will be sent to the
fractal server.

The svelte client and fractal server interact through a REST interface.

But how is this interaction implemented in this client?

### Client server interoperability

As said, the svelte client communicate with the fractal server through a set of REST APIs.

In this client, every request to the fractal server is sent by the *nodejs server that is serving the svelte
application*.
In fact, within the project structure, in `src/lib/server/api` are defined all the REST endpoint requests that
the svelte client could make to the fractal server from within the nodejs server context (client backend).

> It is important to understand that these requests are made in the server context of the svelte client.
> No request to the fractal server is sent directly by the browser of the user.

The fact that every request on behalf of a user is sent through a common backend nodejs server, implies a proxy
architecture.
The way this works is the following, the svelte client in the browser, sends a HTTP request to the nodejs server that
is serving the application. This request, with the attached cookies, is then used to compose a new request to be sent to
the fractal server.

> Note that the authentication context is kept thanks to cookies that establish user sessions.

The following image provides an overview for the reader of the described architecture.

![proxy-architecture.png](media/proxy-architecture.png)

Every fractal server REST endpoint that the client application support is listed within a file in `src/server/api/v1`.
Here requests are grouped by contexts as `auth_api`, `monitoring_api`, [...].

### An example

For instance, considering the code at `src/lib/server/api/v1/auth_api.js:5`:

```javascript
/**
 * Request to authenticate user
 * @param fetch
 * @param data
 * @returns {Promise<*>}
 */
export async function userAuthentication(fetch, data) {
	const response = await fetch(FRACTAL_SERVER_HOST + '/auth/token/login', {
		method: 'POST',
		credentials: 'include',
		mode: 'cors',
		body: data
	});

	if (!response.ok) {
		throw new Error('Authentication failed');
	}

	return await response.json();
}
```

This code is responsible to call the `/auth/token/login` REST api endpoint of the fractal server.
The request is made by the svelte client application in a backend context within the nodejs server.

The client will, if the request succeeds, handle the fractal server response in
a [form action](https://kit.svelte.dev/docs/form-actions).

```javascript 
// src/routes/auth/login/+page.server.js

export const actions = {
	// Default page action / Handles POST requests
	default: async ({ request, cookies, fetch }) => {
		// TODO: Handle login request
		console.log('Login action');

		// Get form data
		const formData = await request.formData();
		// Set auth data
		let authData;
		try {
			authData = await userAuthentication(fetch, formData);
		} catch (error) {
			console.error(error);
			return fail(400, { invalidMessage: 'Invalid credentials', invalid: true });
		}
		const authToken = authData.access_token;
		// Decode JWT token claims
		const tokenClaims = jose.decodeJwt(authToken);

		// Set the authentication cookie
		const cookieOptions = {
			domain: `${AUTH_COOKIE_DOMAIN}`,
			path: `${AUTH_COOKIE_PATH}`,
			expires: new Date(tokenClaims.exp * 1000),
			sameSite: `${AUTH_COOKIE_SAME_SITE}`,
			secure: `${AUTH_COOKIE_SECURE}` === 'true',
			httpOnly: `${AUTH_COOKIE_HTTP_ONLY}` === 'true'
		};
		console.log(cookieOptions);
		cookies.set(AUTH_COOKIE_NAME, authData.access_token, cookieOptions);

		throw redirect(302, '/');
	}
};
```

The previous code is executed in the backend (as one could understand by the name of the file) and it basically provides
a form action that allows a user to login.

This kind of pattern, form actions, is widely used within the client application, as it enables the browser-side client
application to request different actions the server-side should take.

In this case, we briefly described the authentication flow of the svelte client application.

> Notice that the authentication and session of a user is managed through cookies. The client application requests a
> authentication token to the fractal server, which data is used to create another cookie that the nodejs server of the
> client application sends to the browser.

The default action within the `+page.server.js` is requested through an HTTP request that the browser-side client app
makes when a user sends an HTML from, for completion, the one defined in:

```html
<!-- src/routes/auth/login/+page.svelte -->

<script>
  export let form;
  let loginError = false;

  if (form?.invalid) {
    loginError = true;
  }
</script>

<div class='container'>
  <div class='row'>
    <h1>Login</h1>
  </div>
  <div class='row'>
    <div class='col-md-4'>
      <form method='POST'>
        <div class='mb-3'>
          <label for='userEmail' class='form-label'>Email address</label>
          <input
            name='username'
            type='email'
            class="form-control {loginError ? 'is-invalid' : ''}"
            id='userEmail'
            aria-describedby='emailHelp'
            required
          />
          <div id='emailHelp' class='form-text'>The email you provided to the IT manager</div>
          <div class='invalid-feedback'>
            {form?.invalidMessage}
          </div>
        </div>
        <div class='mb-3'>
          <label for='userPassword' class='form-label'>Password</label>
          <input name='password' type='password' class='form-control' id='userPassword' required />
        </div>
        <button class='btn btn-primary'>Submit</button>
      </form>
    </div>
  </div>
</div>
```