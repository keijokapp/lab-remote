'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (callback) {
	if (cleanupHandler === null) {
		cleanupHandler = callback;
		install();
	} else {
		throw new Error('Cleanup handler has already been set');
	}
};

let cleanupHandler = null;
const sigintHandler = signalHandler.bind(undefined, 'SIGINT');
const sighupHandler = signalHandler.bind(undefined, 'SIGHUP');
const sigquitHandler = signalHandler.bind(undefined, 'SIGQUIT');
const sigtermHandler = signalHandler.bind(undefined, 'SIGTERM');

function signalHandler(signal) {
	uninstall();
	cleanupHandler(signal, () => {
		process.kill(process.pid, signal);
	});
	return false;
}

function exitHandler(code) {
	uninstall();
	cleanupHandler(code);
}

function install() {
	process.on('SIGINT', sigintHandler);
	process.on('SIGHUP', sighupHandler);
	process.on('SIGQUIT', sigquitHandler);
	process.on('SIGTERM', sigtermHandler);
	process.on('exit', exitHandler);
}

function uninstall() {
	process.removeListener('SIGINT', sigintHandler);
	process.removeListener('SIGHUP', sighupHandler);
	process.removeListener('SIGQUIT', sigquitHandler);
	process.removeListener('SIGTERM', sigtermHandler);
	process.removeListener('exit', exitHandler);
}