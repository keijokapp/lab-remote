'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _common = require('../common');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = async function asd(key) {

	let rdpPort;

	if (key.includes(':')) {

		if (!('labManager' in _config2.default)) {
			_common.logger.warn('Lab manager integration is not configured');
			return false;
		}

		const [instanceToken, machineId] = key.split(':');

		_common.logger.info('Authorizing', { instanceToken, machine: machineId });

		try {
			const response = await (0, _nodeFetch2.default)(_config2.default.labManager.url + '/instance/' + encodeURIComponent(instanceToken) + '/machine/' + encodeURIComponent(machineId), {
				headers: {
					'accept': 'application/json',
					'authorization': 'key' in _config2.default.labManager ? 'Bearer ' + _config2.default.labManager.key : undefined
				}
			});
			if (response.status === 404) {
				_common.logger.warn('Machine with given key was not found');
				return false;
			}
			if (!response.ok) {
				_common.logger.error('Failed to query machine from lab manager', { response: await response.text() });
				return false;
			}
			const body = await response.json();
			if (!('rdp-port' in body)) {
				_common.logger.warn('Machine is not accessible');
				return;
			}
			rdpPort = body['rdp-port'];
		} catch (e) {
			_common.logger.error('Failed to query machine from lab manager', { e: e.message });
			return false;
		}
	} else if (/^[a-zA-Z0-9-]+$/.test(key)) {

		if (!('virtualbox' in _config2.default)) {
			_common.logger.warn('VirtualBox service is not configured');
			return;
		}

		try {
			const response = await (0, _nodeFetch2.default)(_config2.default.virtualbox.url + '/machine/' + encodeURIComponent(key), {
				headers: {
					'authorization': 'key' in _config2.default.virtualbox ? 'Bearer ' + _config2.default.virtualbox.key : undefined
				}
			});
			if (response.status === 404) {
				_common.logger.warn('Machine was not found');
				return false;
			}
			if (!response.ok) {
				_common.logger.error('Failed to get machine info', { response: await response.text() });
				return false;
			}
			const body = await response.json();
			if (!('rdp-port' in body)) {
				_common.logger.warn('Machine is not accessible', { response: body });
				return;
			}
			rdpPort = body['rdp-port'];
		} catch (e) {
			_common.logger.error('Failed to get machine info', { e: e.message });
			return false;
		}
	} else {
		_common.logger.warn('Bad key', { key });
		return;
	}

	return {
		tyoe: 'rdp',
		hostname: _config2.default.rdp.host,
		port: rdpPort,
		username: _config2.default.rdp.user,
		password: _config2.default.rdp.password
	};
};