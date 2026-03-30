<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '../../common/Modal.svelte';
	import { normalizePayload } from 'fractal-components';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	/**
	 * @typedef {Object} Props
     * @property {import('fractal-components/types/api').WorkflowV2} workflow
	 */

	/** @type {Props} */
	let { workflow } = $props();

	// Component properties
	let creating = $state(false);

	/** @type {string|undefined} */
	let templateName = $state(undefined);
	/** @type {number} */
	let templateVersion = $state(1);
    /** @type {string|undefined} */
	let templateDescription = $state();
	/** @type {number|undefined} */
	let userGroupId = $state(undefined)
	
	/** @type {Array<import('fractal-components/types/api').Group>} */
	let groups = $state([])

    /**
	 * @type {import('fractal-components/types/api').WorkflowTemplate|undefined}
	 */
	let originaleTemplate = $state()

	/** @type {Modal|undefined} */
	let modal = $state(undefined);

	onMount(
		async () => {
			const response = await fetch(
				`/api/auth/group`, {
				method: 'GET',
				credentials: 'include',
            });

			if (!response.ok) {
				throw new Error('Unable to retrieve user groups.');
			}
			else {
				groups = await response.json();
			}
		}
	)

	export async function show() {
        if (workflow.template_id) {
            const response = await fetch(
                `/api/v2/workflow-template/${workflow.template_id}`, {
                method: 'GET',
                credentials: 'include',
            });
    
            if (!response.ok) {
                console.error('Import template failed');
                const alertError = await getAlertErrorFromResponse(response);
                throw alertError;
            }
            else {
                originaleTemplate = await response.json()
				templateName = originaleTemplate?.name;
				templateDescription = originaleTemplate?.description || workflow.description || undefined;
                if (originaleTemplate?.user_email === page.data.userInfo.email) {
                    templateVersion = originaleTemplate ? originaleTemplate.version + 1 : 1
                }
            }
        }
		else {
			templateName = workflow.name;
			templateDescription = workflow.description || undefined;
		}
        modal?.show();
        }

	export function close() {
		templateName = undefined;
		templateVersion = 1;
        templateDescription = undefined;
		creating = false;
		modal?.hideErrorAlert();
	}

	function createTemplate() {
		modal?.confirmAndHide(
			async () => {
				creating = true;
				await handleCreateTemplate();
			},
			() => {
				creating = false;
			}
		);
	}

	async function handleCreateTemplate() {

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const url = new URL('/api/v2/workflow-template', window.location.origin);

		url.searchParams.set('workflow_id', String(workflow.id));

		if (userGroupId) {
			url.searchParams.set('user_group_id', String(userGroupId));
		}

		const response = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload({
				name: templateName,
				version: templateVersion,
				description: templateDescription || null
			})
		});

		if (!response.ok) {
			console.error('Import template failed');
			const alertError = await getAlertErrorFromResponse(response);
			throw alertError;
		}
		else {
			let newTemplate = await response.json()
			await goto(`/v2/templates?template_id=${newTemplate.id}`);
		}
    }


</script>

<Modal
	id="createTemplateModal"
	size="lg"
	centered={true}
	scrollable={true}
	onOpen={()=>{}}
	onClose={close}
	bind:this={modal}
>
	{#snippet header()}
		<h5 class="modal-title">Create template from workflow</h5>
	{/snippet}
	{#snippet body()}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				createTemplate();
			}}
		>		
			
			<div class="mb-2">
				<label for="templateName" class="form-label">Template name</label>
				<input
					id="templateName"
					name="templateName"
					type="text"
					bind:value={templateName}
					class="form-control"
				/>
			</div>
			<div class="mb-2">
				<label for="templateVersion" class="form-label">Template version</label>
				<input
					id="templateVersion"
					name="templateVersion"
					type="number"
					min="1"
					bind:value={templateVersion}
					class="form-control"
				/>
			</div>
			<div class="mb-2">
				<label for="templateDescription" class="form-label">Template description</label>
				<input
					id="templateDescription"
					name="templateDescription"
					type="text"
					bind:value={templateDescription}
					class="form-control"
				/>
			</div>
			<div class="mb-2">
				<label class="form-label" for="template-user-group-id">Share with User Group</label>
				<select
					class="form-select"
					id="template-user-group-id"
					bind:value={userGroupId}
				>
					<option value={null}>None (only me)</option>
					{#each groups as group, index (index) }
						<option value={group.id}>{group.name}</option>
					{/each}
					
				</select>
			</div>

			<button
				class="btn btn-primary mt-2"
				disabled={templateVersion<1 || !templateName || creating}
			>
				{#if creating}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				{/if}
				Create template
			</button>
			<div class="mt-2" id="errorAlert-createTemplateModal"></div>
		</form>
	{/snippet}
</Modal>
