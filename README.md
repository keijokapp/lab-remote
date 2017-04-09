Remote desktop console provider for labs.

## Installation

```
npm install https://github.com/keijokapp/lab-remote

lab-remote /path/to/config-file.json
```

Example configuration is shown in [config_sample.json](config_sample.json).

 | Option | Description |
 |--------|-------------|
 | `listen` | Listener configuration - `"systemd"` in case of Systemd socket or `object` |
 | `listen.port`, `listen.address` | Listen address (optional) and port |
 | `listen.path`, `listen.mode` | UNIX socket path and mode (optional) |
 | `appUrl` | Public (related to other components) URL prefix of the application |
 | `guacd.host`, `guacd.port` | Guacamole daemon host and port |
 | `rdp.host`, `rdp.user`, `rdp.password` | RDP hostname, user and password |
 | `labManager.url`, `labManager.key` | (optional) [Lab manager](https://github.com/keijokapp/lab-manager) URL and access token (optional) |
 | `virtualbox.url`, `virtualbox.key` | (optional) [VirtualBox API service](https://github.com/keijokapp/i-tee-virtualbox) URL and access token (optional) |


# Overview

Application has two use cases:

 * Connection to given VirtualBox machine - e.g. `https://remote.example.com/my-fancy-machine-name`. Note that it's up to user to secure the endpoint - e.g. by using authenticating proxy.
 * Connection to machine referenced indirectly by lab instance public token and machine ID - e.g. `https://remote.example.com/b03108db-65f2-4d7c-b884-bb908d111400:desktop`. This endpoint (note the colon in pathname) should be accessible to end user without explicit authentication.

Both of these features can be turned off by not specifying `virtualbox` or `labManager` configuration options respectively.

# Licence

MIT


