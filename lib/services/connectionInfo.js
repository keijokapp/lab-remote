import fetch from 'node-fetch';
import { logger } from '../common';
import config from '../config';


export default async function asd(key) {

	let rdpPort;

	if(key.includes(':')) {

		if(!('labManager' in config)) {
			logger.warn('Lab manager integration is not configured');
			return false;
		}

		const [instanceToken, machineId] = key.split(':');

		logger.info('Authorizing', { instanceToken, machine: machineId });

		try {
			const response = await fetch(config.labManager.url + '/instance/' + encodeURIComponent(instanceToken)
				+ '/machine/' + encodeURIComponent(machineId), {
				headers: {
					'accept': 'application/json',
					'authorization': 'key' in config.labManager ? 'Bearer ' + config.labManager.key : undefined
				}
			});
			if(response.status === 404) {
				logger.warn('Machine with given key was not found');
				return false;
			}
			if(!response.ok) {
				logger.error('Failed to query machine from lab manager', { response: await response.text() });
				return false;
			}
			const body = await response.json();
			if(!('rdp-port' in body)) {
				logger.warn('Machine is not accessible');
				return;
			}
			rdpPort = body['rdp-port'];
		} catch(e) {
			logger.error('Failed to query machine from lab manager', { e: e.message });
			return false;
		}
	} else if(/^[a-zA-Z0-9-]+$/.test(key)) {

		if(!('virtualbox' in config)) {
			logger.warn('VirtualBox service is not configured');
			return;
		}

		try {
			const response = await fetch(config.virtualbox.url + '/machine/' + encodeURIComponent(key), {
				headers: {
					'authorization': 'key' in config.virtualbox ? 'Bearer ' + config.virtualbox.key : undefined
				}
			});
			if(response.status === 404) {
				logger.warn('Machine was not found');
				return false;
			}
			if(!response.ok) {
				logger.error('Failed to get machine info', { response: await response.text() });
				return false;
			}
			const body = await response.json();
			if(!('rdp-port' in body)) {
				logger.warn('Machine is not accessible', { response: body });
				return;
			}
			rdpPort = body['rdp-port'];
		} catch(e) {
			logger.error('Failed to get machine info', { e: e.message });
			return false;
		}
	} else {
		logger.warn('Bad key', { key });
		return;
	}

	return {
		tyoe: 'rdp',
		hostname: config.rdp.host,
		port: rdpPort,
		username: config.rdp.user,
		password: config.rdp.password
	};
}
