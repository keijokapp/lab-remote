'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const app = (0, _express2.default)();
exports.default = app;


app.use(_express2.default.static(_path2.default.join(__dirname, '..', 'static')));
app.use((req, res) => {
	res.sendFile('index.html', { root: __dirname + '/../static' });
});