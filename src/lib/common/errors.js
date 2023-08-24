import { error } from "@sveltejs/kit";

export function PostResourceException(response) {
	this.reason = response;
}
export async function responseError(response) {
	throw error(response.status, await response.json())
}