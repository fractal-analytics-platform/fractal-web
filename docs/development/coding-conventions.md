# Coding conventions

## fetch

Only explicitly specify options when they differ from defaults.

Examples:

```js
// ✅ Good
const response = await fetch('/api/admin/v2/resource');

// ❌ Bad
const response = await fetch('/api/admin/v2/resource', { method: 'GET' });
```

Add Content-Type headers only when there is a body.

Examples:

```js
// ✅ Good
const headers = new Headers();
headers.set('Content-Type', 'application/json');

const response = await fetch(`/api/v2/project`, {
	method: 'POST',
	headers,
	body: normalizePayload(payload)
});

// ❌ Bad
const response = await fetch(`/api/v2/project/${projectId}`, {
	method: 'DELETE',
	headers
});
```
