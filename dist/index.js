#!/usr/bin/node
'use strict';

var _fs = require('fs');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _sdNotify = require('sd-notify');

var _sdNotify2 = _interopRequireDefault(_sdNotify);

var _cleanup = require('./cleanup');

var _cleanup2 = _interopRequireDefault(_cleanup);

var _common = require('./common');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

var _wsApp = require('./ws-app');

var _wsApp2 = _interopRequireDefault(_wsApp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const server = _http2.default.createServer(_app2.default);

server.on('error', e => {
	_common.logger.error('Server error', { e });
	process.emit('SIGINT');
});

server.on('upgrade', (req, socket, head) => {
	_wsApp2.default.handleUpgrade(req, socket, head, ws => {
		_wsApp2.default.emit('connection', ws, req);
	});
});

(0, _cleanup2.default)((exit, callback) => {
	server.close();
	_common.logger.on('finish', callback);
	_common.logger.info('Exiting...', { exit });
	_common.logger.end();
	if (_config2.default.listen.path) {
		try {
			(0, _fs.unlinkSync)(_config2.default.listen.path);
		} catch (e) {
			if (e.code !== 'ENOENT') {
				throw e;
			}
		}
	}
});

if (_config2.default.listen === 'systemd') {
	const socketCount = parseInt(process.env.LISTEN_FDS, 10);
	if (socketCount !== 1) {
		_common.logger.error('Bad number of sockets', { socketCount });
	} else {
		const PipeWrap = process.binding('pipe_wrap');
		if (PipeWrap.constants && typeof PipeWrap.constants.SOCKET !== 'undefined') {
			server._handle = new PipeWrap.Pipe(PipeWrap.constants.SOCKET);
		} else {
			server._handle = new PipeWrap.Pipe();
		}
		server._handle.open(3);
		server._listen2(null, -1, -1);
		_common.logger.info('Listening', { fd: 3 });
		_sdNotify2.default.ready();
	}
} else if ('port' in _config2.default.listen) {
	server.listen(_config2.default.listen.port, _config2.default.listen.address, () => {
		const address = server.address();
		_common.logger.info('Listening', address);
		_sdNotify2.default.ready();
	});
} else if ('path' in _config2.default.listen) {
	server.listen(_config2.default.listen.path, () => {
		let error = false;
		if ('mode' in _config2.default.listen) {
			try {
				(0, _fs.chmodSync)(_config2.default.listen.path, _config2.default.listen.mode);
			} catch (e) {
				error = true;
				_common.logger.error(e.code === 'ERR_INVALID_ARG_VALUE' ? 'Bad socket mode' : 'Error setting socket mode', {
					path: _config2.default.listen.path,
					mode: _config2.default.listen.mode
				});
				server.close();
			}
		}
		if (!error) {
			_common.logger.info('Listening', { path: _config2.default.listen.path });
			_sdNotify2.default.ready();
		}
	});
}