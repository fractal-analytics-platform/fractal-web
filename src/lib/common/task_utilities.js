/**
 * Sort task-group activities by timestamp_started.
 * @param {import('fractal-components/types/api').TaskGroupActivityV2} a1
 * @param {import('fractal-components/types/api').TaskGroupActivityV2} a2
 */
export const sortActivitiesByTimestampStarted = function (a1, a2) {
	return a1.timestamp_started < a2.timestamp_started ? 1 : -1;
};
