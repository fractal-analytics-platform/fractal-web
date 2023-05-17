export async function updateFormEntry(
	projectId,
	workflowId,
	workflowTaskId,
	updatingWorkflowTaskProperties,
	groupName
) {
	const requestData = {};
	requestData[groupName] = updatingWorkflowTaskProperties;

	// Should make a PATCH request to the server to update the workflow task properties
	const response = await fetch(
		`/projects/${projectId}/workflows/${workflowId}/tasks/${workflowTaskId}`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestData)
		}
	);

	if (response.ok) {
		console.log('Update form entry response successful');
		// Should return the updated form entry
		const updatedFormEntry = await response.json();
		return updatedFormEntry;
	}

	console.error('Update form entry response not ok');
	throw new Error(response.statusText);
}
