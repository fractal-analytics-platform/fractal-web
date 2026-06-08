import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	const logger = {
		addContext: vi.fn(),
		debug: vi.fn(),
		warn: vi.fn(),
		fatal: vi.fn()
	};

	return {
		env: {},
		existsSync: vi.fn(),
		readFileSync: vi.fn(),
		configure: vi.fn(),
		getLogger: vi.fn(() => logger),
		logger
	};
});

vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));
vi.mock('fs', () => ({
	existsSync: mocks.existsSync,
	readFileSync: mocks.readFileSync,
	default: {
		existsSync: mocks.existsSync,
		readFileSync: mocks.readFileSync
	}
}));
vi.mock('log4js', () => ({
	default: {
		configure: mocks.configure,
		getLogger: mocks.getLogger
	}
}));

async function loadLoggerModule() {
	vi.resetModules();
	return await import('../src/lib/server/logger.js');
}

describe('logger', () => {
	beforeEach(() => {
		for (const key of Object.keys(mocks.env)) {
			delete mocks.env[key];
		}
		mocks.existsSync.mockReset();
		mocks.readFileSync.mockReset();
		mocks.configure.mockReset();
		mocks.getLogger.mockClear();
		mocks.logger.addContext.mockClear();
		mocks.logger.debug.mockClear();
		mocks.logger.warn.mockClear();
		mocks.logger.fatal.mockClear();
	});

	it('uses LOG_CONFIG_FILE when the file exists', async () => {
		Object.assign(mocks.env, {
			LOG_CONFIG_FILE: '__mocked__/logger-config.json'
		});
		mocks.existsSync.mockReturnValue(true);
		mocks.readFileSync.mockReturnValue(
			JSON.stringify({
				appenders: {
					console: {
						type: 'console',
						layout: {
							type: 'pattern',
							pattern: '%m'
						}
					},
					file: {
						type: 'file',
						filename: '/tmp/app.log'
					}
				},
				categories: {
					default: {
						appenders: ['console'],
						level: 'all'
					}
				}
			})
		);

		await loadLoggerModule();

		expect(mocks.existsSync).toHaveBeenCalledWith('__mocked__/logger-config.json');
		expect(mocks.readFileSync).toHaveBeenCalledWith('__mocked__/logger-config.json', 'utf-8');
		expect(mocks.configure).toHaveBeenCalledTimes(1);
		const configured = mocks.configure.mock.calls[0][0];
		expect(configured.appenders.console.layout.type).toBe('pattern');
		expect(configured.appenders.console.layout.pattern).toBe('%m');
		expect(configured.appenders.file.filename).toBe('/tmp/app.log');
		expect(configured.categories.default.appenders).toEqual(['console']);
		expect(configured.categories.default.level).toBe('all');
		expect(mocks.logger.debug).toHaveBeenCalledWith(
			'LOG_CONFIG_FILE=%s',
			'__mocked__/logger-config.json'
		);
	});

	it('falls back to default logger config when LOG_CONFIG_FILE does not exist', async () => {
		Object.assign(mocks.env, {
			LOG_CONFIG_FILE: '_workdir/config/missing.json',
			LOG_LEVEL_CONSOLE: 'error'
		});
		mocks.existsSync.mockReturnValue(false);

		await loadLoggerModule();

		expect(mocks.configure).toHaveBeenCalledTimes(1);
		const configured = mocks.configure.mock.calls[0][0];
		expect(configured.appenders.filteredConsole.level).toBe('error');
		expect(configured.appenders.filteredConsole.appender).toBe('console');
		expect(configured.appenders.console.layout.pattern).toBe('%[%x{timestamp} - (%x{component}) - %p -%] %m');
		expect(typeof configured.appenders.console.layout.tokens.timestamp).toBe('function');
		expect(typeof configured.appenders.console.layout.tokens.component).toBe('function');
		expect(configured.categories.default.appenders).toEqual(['filteredConsole']);
		expect(configured.categories.default.level).toBe('all');
		expect(mocks.logger.debug).toHaveBeenCalledWith(
			'LOG_CONFIG_FILE=%s',
			'_workdir/config/missing.json'
		);
		expect(mocks.logger.warn).toHaveBeenCalledWith(
			'LOG_CONFIG_FILE=_workdir/config/missing.json does not exist. Falling back to default logger configuration.'
		);
	});

	it('logs LOG_CONFIG_FILE path at startup with format placeholder', async () => {
		Object.assign(mocks.env, {
			LOG_CONFIG_FILE: './config/custom logging file.json'
		});
		mocks.existsSync.mockReturnValue(false);

		await loadLoggerModule();

		expect(mocks.configure).toHaveBeenCalledTimes(1);
		const configured = mocks.configure.mock.calls[0][0];
		expect(configured.appenders.filteredConsole.level).toBe('warn');
		expect(configured.appenders.filteredConsole.appender).toBe('console');
		expect(configured.categories.default.appenders).toEqual(['filteredConsole']);
		expect(configured.categories.default.level).toBe('all');

		expect(mocks.logger.debug).toHaveBeenCalledWith(
			'LOG_CONFIG_FILE=%s',
			'./config/custom logging file.json'
		);
		expect(mocks.logger.warn).toHaveBeenCalledWith(
			'LOG_CONFIG_FILE=./config/custom logging file.json does not exist. Falling back to default logger configuration.'
		);
	});

	it('warns and falls back when LOG_CONFIG_FILE cannot be parsed', async () => {
		Object.assign(mocks.env, {
			LOG_CONFIG_FILE: '_workdir/config/broken.json',
			LOG_LEVEL_CONSOLE: 'info'
		});
		mocks.existsSync.mockReturnValue(true);
		mocks.readFileSync.mockReturnValue('{"appenders":');

		await loadLoggerModule();

		expect(mocks.configure).toHaveBeenCalledTimes(1);
		const configured = mocks.configure.mock.calls[0][0];
		expect(configured.appenders.filteredConsole.level).toBe('info');
		expect(configured.appenders.filteredConsole.appender).toBe('console');
		expect(configured.categories.default.appenders).toEqual(['filteredConsole']);
		expect(configured.categories.default.level).toBe('all');
		expect(mocks.logger.warn).toHaveBeenCalledWith(
			'Cannot parse LOG_CONFIG_FILE=_workdir/config/broken.json. Falling back to default logger configuration.'
		);
		expect(mocks.logger.debug).toHaveBeenCalledWith(
			'LOG_CONFIG_FILE=%s',
			'_workdir/config/broken.json'
		);
	});
});