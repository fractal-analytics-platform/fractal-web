async function get_user_info() {
	let res = await fetch(
		"http://127.0.0.1:8000/auth/users/me",
		{
			credentials: "include",
		}
	)
	if (!res.ok) {
		return null;
	}
	else {
		let data = await res.json();
		return data.email;
	}
}


export async function load() {
	let userValue = await get_user_info();
	return {
		user: userValue
	};
}
