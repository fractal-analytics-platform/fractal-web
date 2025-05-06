<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import { sortUserToImportSettings } from '$lib/components/admin/user_utilities';
	import Modal from '$lib/components/common/Modal.svelte';
	import SlimSelect from 'slim-select';
	import { onMount } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {number} currentUserId
	 * @property {(settings: import('fractal-components/types/api').UserSettings) => void} onSettingsImported
	 */

	/** @type {Props} */
	let { currentUserId, onSettingsImported } = $props();
	let importingSettings = $state(false);
	/** @type {number[]} */
	let desiredGroups = [];

	/** @type {Array<import('fractal-components/types/api').User & {id: number}>} */
	let users = [];
	/** @type {number|null} */
	let selectedUserId = null;
	let userError = $state('');

	/** @type {Modal|undefined}*/
	let modal = $state();
	/** @type {SlimSelect|undefined} */
	let userSelector;

	onMount(() => {
		setUsersSlimSelect();
	});

	/**
	 * @param {number[]} selectedGroups
	 */
	export async function open(selectedGroups) {
		userError = '';
		selectedUserId = null;
		modal?.hideErrorAlert();
		desiredGroups = selectedGroups;
		modal?.show();
		await setUsersSlimSelectOptions();
	}

	async function importSettingsFromSelectedUser() {
		if (selectedUserId === null) {
			userError = 'User is required';
			return;
		}
		importingSettings = true;
		const response = await fetch(`/api/auth/users/${selectedUserId}/settings`, {
			method: 'GET',
			credentials: 'include'
		});
		if (response.ok) {
			onSettingsImported(await response.json());
			importingSettings = false;
			modal?.hide();
		} else {
			const error = await getAlertErrorFromResponse(response);
			modal?.displayErrorAlert(error);
			importingSettings = false;
		}
	}

	function setUsersSlimSelect() {
		const elementId = 'user-to-import-settings-select';
		const selectElement = document.getElementById(elementId);
		selectElement?.classList.remove('invisible');
		userSelector = new SlimSelect({
			select: `#${elementId}`,
			settings: {
				maxValuesShown: 5,
				showSearch: true,
				ariaLabel: 'Select user'
			},
			events: {
				afterChange: (selection) => {
					if (selection.length === 0 || selection[0].value === 'Select...') {
						selectedUserId = null;
					} else {
						selectedUserId = Number(selection[0].value);
					}
				}
			}
		});
	}

	async function setUsersSlimSelectOptions() {
		try {
			const allUsers = await getUsers();
			const allGroups = await getGroups();
			users = sortUserToImportSettings(
				allUsers.filter((u) => u.id !== currentUserId),
				desiredGroups,
				allGroups
			);
		} catch (err) {
			modal?.displayErrorAlert(err);
			return;
		}

		const options = users.map((u) => ({ text: u.email, value: u.id.toString() }));
		userSelector?.setData([{ text: 'Select...', placeholder: true }, ...options]);
	}

	/**
	 * @returns {Promise<Array<import('fractal-components/types/api').User & {id: number}>>}
	 */
	async function getUsers() {
		const response = await fetch('/api/auth/users', {
			method: 'GET',
			credentials: 'include'
		});

		if (response.ok) {
			return await response.json();
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}

	/**
	 * @returns {Promise<Array<import('fractal-components/types/api').Group & {user_ids: number[]}>>}
	 */
	async function getGroups() {
		const response = await fetch('/api/auth/group?user_ids=true', {
			method: 'GET',
			credentials: 'include'
		});

		if (response.ok) {
			return await response.json();
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}
</script>

<Modal id="selectUserToImportSettingsModal" centered={true} bind:this={modal} focus={false}>
	{#snippet header()}
		<h1 class="modal-title fs-5">Select user to import settings</h1>
	{/snippet}
	{#snippet body()}
		<select id="user-to-import-settings-select" class="invisible" class:border-danger={userError}
		></select>
		{#if userError}
			<span class="text-danger">{userError}</span>
		{/if}
		<div id="errorAlert-selectUserToImportSettingsModal" class="mt-3"></div>
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			class="btn btn-primary"
			onclick={importSettingsFromSelectedUser}
			disabled={importingSettings}
		>
			{#if importingSettings}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Import settings
		</button>
	{/snippet}
</Modal>
