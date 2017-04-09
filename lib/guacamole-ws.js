import { Socket } from 'net';
import { parseStream, createMessage } from 'guacamole-util';
import { logger } from './common';
import config from './config';


function guacamoleBootstrap(ws, client, connectionInfo) {
	return new Promise((resolve, reject) => {

		var state = '';

		parseStream(client, (e, message) => {

			if(e) {
				logger.warn('Error parsing Guacamole stream', { e: e.message });
				return;
			}

			if(state == '') {
				if(message[0] !== 'args') {
					const e = new Error('Bad opcode while initializing (expected "args"): ', message[0]);
					client.emit('error', e);
					client.end();
					reject(e);
					return;
				}

				state = 'args';
				client.write(createMessage(['size', connectionInfo.resolution.width, connectionInfo.resolution.height, connectionInfo.resolution.density]));
				client.write(createMessage(['audio', 'audio/ogg']));
				client.write(createMessage(['video']));
				client.write(createMessage(['image', 'image/png', 'image/jpeg']));

				const command = ['connect'];
				for(let i = 1, l = message.length; i < l; i++) {
					command[i] = message[i] in connectionInfo ? connectionInfo[message[i]] : '';
				}
				client.write(createMessage(command));
			} else if(state == 'args') {
				if(message[0] !== 'ready') {
					const e = new Error('Bad opcode while initializing (expected "ready"): ', message[0]);
					client.emit('error', e);
					client.end();
					reject(e);
					return;
				}

				state = 'ready';

				resolve(message[1]);
			} else {
				ws.send(createMessage(message));
			}
		});


		client.write(createMessage(['select', 'rdp']));

	});
}


export default function(ws, connectionInfo) {

	const gcClient = new Socket;

	ws.on('close', () => {
		gcClient.destroy();
	});

	gcClient
		.on('error', e => {
			logger.warn('Guacamole connection error', { e: e.message });
			gcClient.destroy();
			ws.close();
		})
		.on('close', () => {
			logger.debug('Guacamole connection closed');
			gcClient.destroy();
			ws.close();
		})
		.connect(config.guacd.port, config.guacd.host);

	guacamoleBootstrap(ws, gcClient, connectionInfo)
		.then(connectionId => {
			logger.debug('Guacamole connection bootstrapped', { connectionId });
			ws.on('message', data => {
				gcClient.write(data);
			});
		})
		.catch(e => {
			logger.warn('Error bootstrapping guacamole connection', { e: e.message });
			gcClient.emit('error', e);
		});
}
