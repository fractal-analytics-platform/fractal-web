// Propagate ESC key to parent window
document.addEventListener('DOMContentLoaded', () => {
	window.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			window.parent.postMessage({ type: 'closeModal' });
		}
	});
});
