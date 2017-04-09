'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _url = require('url');

var _ws = require('ws');

var _common = require('./common');

var _guacamoleWs = require('./guacamole-ws');

var _guacamoleWs2 = _interopRequireDefault(_guacamoleWs);

var _connectionInfo = require('./services/connectionInfo');

var _connectionInfo2 = _interopRequireDefault(_connectionInfo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const app = new _ws.Server({ noServer: true });
exports.default = app;


app.on('connection', (ws, req) => {

	const [path, search] = req.url.split('?');
	const key = path.slice(1);

	const query = new _url.URLSearchParams(search);
	const width = parseInt(+query.get('width'));
	const height = parseInt(+query.get('height'));

	if (isNaN(width) || isNaN(height) || width < 1 || height < 1) {
		_common.logger.warn('Bad websocket request: expecting width, height and density to be positive integer');
		ws.close();
	}

	_common.logger.info('Incoming WebSocket connection', { key });

	(0, _connectionInfo2.default)(key).then(connectionInfo => {
		if (!connectionInfo) {
			ws.close();
			return;
		}

		connectionInfo.resolution = {
			width: Math.min(width, 1920),
			height: Math.min(height, 1080),
			density: 96
		};
		_common.logger.debug('Connection info: ', { connectionInfo });
		(0, _guacamoleWs2.default)(ws, connectionInfo);
	}).catch(e => {
		_common.logger.error('Error retrieving connection data', { key, e: e.message });
		ws.close();
	});
});