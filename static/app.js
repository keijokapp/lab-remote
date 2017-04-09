'use strict';

const token = window.location.href.slice(window.location.href.lastIndexOf('/') + 1);
const width = window.innerWidth;
const height = window.innerHeight;
const density = window.devicePixelRatio || 1;
const tunnel = new Guacamole.WebSocketTunnel(token);
const guac = new Guacamole.Client(tunnel);
const display = guac.getDisplay();
const displayElement = guac.getDisplay().getElement();
const root = React.createRef();

console.log('Token: %s; Width: %d; Height: %d; Density: %d', token, width, height, density);

// Keys to release on clipboard close
const controlKeyCodes = [0xFE03, // ISO Level 3 Shift (AltGr)
0xFFE1, // Left shift
0xFFE2, // Right shift
0xFFE3, // Left ctrl
0xFFE4, // Right ctrl
0xFFE5, // Caps Lock
0xFFE7, // Left meta
0xFFE8, // Right meta
0xFFE9, // Left alt
0xFFEA, // Right alt
0xFFEB, // Left hyper
0xFFEC // Right hyper
];

let clipboardData = '';

function setClipboardData(cd) {
	if (clipboardData !== cd) {
		clipboardData = cd;
		const stream = guac.createClipboardStream('text/plain');
		stream.sendBlob(btoa(cd));
		stream.sendEnd();
	}
}

function sendControlAltDelete() {
	guac.sendKeyEvent(1, 0xffe3); // control
	guac.sendKeyEvent(1, 0xffe9); // alt
	guac.sendKeyEvent(1, 0xffff); // delete
	// releasing them in reverse order does not seem to work as well
	guac.sendKeyEvent(0, 0xffe3); // control
	guac.sendKeyEvent(0, 0xffe9); // alt
	guac.sendKeyEvent(0, 0xffff); // delete
}

function releaseControlKeys() {
	for (const keyCode of controlKeyCodes) {
		guac.sendKeyEvent(0, keyCode);
	}
}

class Display extends React.Component {

	constructor() {
		super();
		this.state = {
			sidepane: false,
			connecting: false
		};

		this._onKeyEvent = e => {
			if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
				this._wereAllControlKeysUp = true;
			} else if (this._wereAllControlKeysUp && e.shiftKey && e.ctrlKey && e.altKey) {
				if (this.state.sidepane) {
					this.closeClipboard();
				} else {
					this.openClipboard();
				}
				this._wereAllControlKeysUp = false;
			}
		};
		this._wereAllControlKeysUp = true;
	}

	componentDidMount() {
		const displayElement = display.getElement();
		displayElement.style.margin = 'auto';
		this.refs['display-container'].appendChild(displayElement);
		window.addEventListener('keydown', this._onKeyEvent);
		window.addEventListener('keyup', this._onKeyEvent);
	}

	componentWillUnmount() {
		this.refs['display-container'].removeChild(display.getElement());
		window.removeEventListener('keydown', this._onKeyEvent);
		window.removeEventListener('keyup', this._onKeyEvent);
	}

	openClipboard() {
		this.setState({
			sidepane: true
		});
		releaseControlKeys();
	}

	closeClipboard() {
		setClipboardData(this.refs.clipboard.value);
		this.setState({
			sidepane: false
		});
		releaseControlKeys();
	}

	render() {
		let clipboard;
		if (this.state.sidepane) {
			clipboard = React.createElement(
				'div',
				{ id: 'clipboard-container' },
				React.createElement(
					'h4',
					null,
					React.createElement(
						'label',
						{ htmlFor: 'clipboard' },
						'Clipboard:'
					)
				),
				React.createElement('textarea', { autoFocus: true, id: 'clipboard', ref: 'clipboard', onBlur: e => setClipboardData(e.target.value), style: { height: '100%', width: '100%' }, defaultValue: clipboardData }),
				React.createElement(
					'button',
					{ style: { width: '100%', padding: '10px', marginTop: '10px' }, onClick: e => sendControlAltDelete() },
					'Control + Alt + Delete'
				)
			);
		}

		let connecting;
		if (this.state.connecting) {
			connecting = React.createElement(
				'div',
				{ className: 'overlay' },
				React.createElement(
					'div',
					{ className: 'modal' },
					React.createElement(
						'p',
						{ style: { fontSize: '40px', textTransform: 'uppercase', fontWeight: 'bold' } },
						'connecting'
					)
				)
			);
		}

		return React.createElement(
			'div',
			null,
			React.createElement('div', { ref: 'display-container' }),
			clipboard,
			connecting
		);
	}
}

ReactDOM.render(React.createElement(Display, { ref: root }), document.querySelector('#app'));

guac.onstatechange = function (state) {
	console.log('State: ', state);

	if (state === 3) {
		root.current.setState({
			connecting: false
		});
	} else {
		root.current.setState({
			connecting: true
		});
	}
};

guac.onerror = function (e) {
	console.error('Guacamole error: ', e);
};

guac.onclipboard = function (stream) {
	const blobs = [];
	stream.onblob = function (blobB64) {
		blobs.push(atob(blobB64));
	};
	stream.onend = function () {
		root.current.setState({
			clipboardData: blobs.join('')
		});
	};
};

function connect() {
	if (tunnel.state === Guacamole.Tunnel.State.OPEN) {
		guac.disconnect();
	}
	guac.connect('width=' + width + '&height=' + height + '&density=' + density);
}

connect();

tunnel.onstatechange = function (state) {
	if (state === Guacamole.Tunnel.State.CLOSED) {
		setTimeout(connect, 1000);
	}
};

window.onunload = function () {
	guac.disconnect();
};

const mouse = new Guacamole.Mouse(displayElement);

mouse.onmousedown = mouse.onmouseup = function (mouseState) {
	if (root.current.state.sidepane) {
		root.current.closeClipboard();
	}
	guac.sendMouseState(mouseState);
};

mouse.onmousemove = function (mouseState) {
	guac.sendMouseState(mouseState);
};

display.showCursor(false);
display.oncursor = function (cursor, x, y) {
	mouse.setCursor(cursor, x, y);
};

const keyboard = new Guacamole.Keyboard(document);

keyboard.onkeydown = function (keysym) {
	if (root.current.state.sidepane) {
		return true;
	}
	guac.sendKeyEvent(1, keysym);
	return false;
};

keyboard.onkeyup = function (keysym) {
	if (root.current.state.sidepane) {
		return true;
	}
	guac.sendKeyEvent(0, keysym);
	return false;
};
