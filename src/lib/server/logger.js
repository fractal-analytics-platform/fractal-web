import { env } from '$env/dynamic/private';
import log4js from 'log4js';

const logLevelConsole = env.LOG_LEVEL_CONSOLE || 'info';

/**
 * @param {string} pattern
 */
function getLayout(pattern) {
	return {
		type: 'pattern',
		pattern,
		tokens: {
			component: function (logEvent) {
				return logEvent.context?.component || 'general';
			}
		}
	};
}

let appenders = {
	console: {
		type: 'console',
		layout: getLayout('%[[%d] [%p] (%x{component}) -%] %m')
	},
	filteredConsole: {
		type: 'logLevelFilter',
		level: logLevelConsole,
		appender: 'console'
	}
};

let appendersList = ['filteredConsole'];

const logLevelFile = env.LOG_LEVEL_FILE || 'debug';
if (env.LOG_FILE) {
	appenders = {
		...appenders,
		file: {
			type: 'file',
			filename: env.LOG_FILE,
			layout: getLayout('[%d] [%p] (%x{component}) - %m')
		},
		filteredFile: {
			type: 'logLevelFilter',
			level: logLevelFile,
			appender: 'file'
		}
	};
	appendersList = [...appendersList, 'filteredFile'];
}

log4js.configure({
	appenders,
	categories: {
		default: {
			appenders: appendersList,
			level: 'all'
		}
	}
});

/**
 * @param {string} component
 * @returns {log4js.Logger}
 */
export function getLogger(component) {
	const logger = log4js.getLogger();
	logger.addContext('component', component);
	return logger;
}

const logger = getLogger('logger');

logger.debug('LOG_LEVEL_CONSOLE=%s', logLevelConsole);
if (env.LOG_FILE) {
	logger.debug('LOG_FILE=%s', env.LOG_FILE);
	logger.debug('LOG_LEVEL_FILE=%s', logLevelFile);
}

process.on('unhandledRejection', (error) => {
	log4js.getLogger().fatal('Unhandled rejection:', error);
});
