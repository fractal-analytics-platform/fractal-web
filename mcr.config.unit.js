// https://github.com/cenfun/monocart-coverage-reports

export default {
	logging: 'debug',
	name: 'Unit Coverage Report',
	outputDir: './coverage-reports/unit',

	reports: ['console-details', 'v8', 'raw'],

	entryFilter: {
		'**/src/**': true
	}
};
