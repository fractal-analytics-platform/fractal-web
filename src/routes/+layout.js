export async function load() {
	const res = await fetch(
		"http://127.0.0.1:8000/auth/users/me",
		{
			credentials: "include",
		}
	);

	if (res.ok) {
		return {user: await res.json()};
	}
	else {
		return {user: null};
	}
}
