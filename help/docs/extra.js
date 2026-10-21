// Propagate ESC key to parent window
document.addEventListener('DOMContentLoaded', () => {
	window.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			window.parent.postMessage({ type: 'closeModal' });
		}
	});
});

/**
 * @param {MouseEvent} event
 * @param {string} videoId
 * @returns
 */
window['loadYouTubeVideo'] = function (event, videoId) {
	if (!(event.target instanceof HTMLElement)) {
		return;
	}
	const element = event.target.closest('.youtube-facade');
	if (!element) {
		return;
	}
	const iframe = document.createElement('iframe');
	iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
	iframe.allowFullscreen = true;
	iframe.width = '560';
	iframe.height = '315';
	iframe.allow = 'autoplay; picture-in-picture';
	iframe.referrerPolicy = 'strict-origin-when-cross-origin';
	iframe.style.cssText = 'border: 0px;';
	element.innerHTML = '';
	element.appendChild(iframe);
};
