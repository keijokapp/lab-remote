import { URLSearchParams } from 'url';
import { Server } from 'ws';
import { logger } from './common';
import guacamoleWs from './guacamole-ws';
import connectionInfoService from './services/connectionInfo';

const app = new Server({ noServer: true });
export default app;

app.on('connection', (ws, req) => {

	const [ path, search ] = req.url.split('?');
	const key = path.slice(1);

	const query = new URLSearchParams(search);
	const width = parseInt(+query.get('width'));
	const height = parseInt(+query.get('height'));

	if(isNaN(width) || isNaN(height) || width < 1 || height < 1) {
		logger.warn('Bad websocket request: expecting width, height and density to be positive integer');
		ws.close();
	}

	logger.info('Incoming WebSocket connection', { key });

	connectionInfoService(key)
		.then(connectionInfo => {
			if(!connectionInfo) {
				ws.close();
				return;
			}

			connectionInfo.resolution = {
				width: Math.min(width, 1920),
				height: Math.min(height, 1080),
				density: 96
			};
			logger.debug('Connection info: ', { connectionInfo });
			guacamoleWs(ws, connectionInfo);
		})
		.catch(e => {
			logger.error('Error retrieving connection data', { key, e: e.message });
			ws.close();
		})
});
