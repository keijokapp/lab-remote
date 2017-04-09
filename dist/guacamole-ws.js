'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (ws, connectionInfo) {

	const gcClient = new _net.Socket();

	ws.on('close', () => {
		gcClient.destroy();
	});

	gcClient.on('error', e => {
		_common.logger.warn('Guacamole connection error', { e: e.message });
		gcClient.destroy();
		ws.close();
	}).on('close', () => {
		_common.logger.debug('Guacamole connection closed');
		gcClient.destroy();
		ws.close();
	}).connect(_config2.default.guacd.port, _config2.default.guacd.host);

	guacamoleBootstrap(ws, gcClient, connectionInfo).then(connectionId => {
		_common.logger.debug('Guacamole connection bootstrapped', { connectionId });
		ws.on('message', data => {
			gcClient.write(data);
		});
	}).catch(e => {
		_common.logger.warn('Error bootstrapping guacamole connection', { e: e.message });
		gcClient.emit('error', e);
	});
};

var _net = require('net');

var _guacamoleUtil = require('guacamole-util');

var _common = require('./common');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function guacamoleBootstrap(ws, client, connectionInfo) {
	return new Promise((resolve, reject) => {

		var state = '';

		(0, _guacamoleUtil.parseStream)(client, (e, message) => {

			if (e) {
				_common.logger.warn('Error parsing Guacamole stream', { e: e.message });
				return;
			}

			if (state == '') {
				if (message[0] !== 'args') {
					const e = new Error('Bad opcode while initializing (expected "args"): ', message[0]);
					client.emit('error', e);
					client.end();
					reject(e);
					return;
				}

				state = 'args';
				client.write((0, _guacamoleUtil.createMessage)(['size', connectionInfo.resolution.width, connectionInfo.resolution.height, connectionInfo.resolution.density]));
				client.write((0, _guacamoleUtil.createMessage)(['audio', 'audio/ogg']));
				client.write((0, _guacamoleUtil.createMessage)(['video']));
				client.write((0, _guacamoleUtil.createMessage)(['image', 'image/png', 'image/jpeg']));

				const command = ['connect'];
				for (let i = 1, l = message.length; i < l; i++) {
					command[i] = message[i] in connectionInfo ? connectionInfo[message[i]] : '';
				}
				client.write((0, _guacamoleUtil.createMessage)(command));
			} else if (state == 'args') {
				if (message[0] !== 'ready') {
					const e = new Error('Bad opcode while initializing (expected "ready"): ', message[0]);
					client.emit('error', e);
					client.end();
					reject(e);
					return;
				}

				state = 'ready';

				resolve(message[1]);
			} else {
				ws.send((0, _guacamoleUtil.createMessage)(message));
			}
		});

		client.write((0, _guacamoleUtil.createMessage)(['select', 'rdp']));
	});
}