import path from 'path';
import express from 'express';


const app = express();
export default app;

app.use(express.static(path.join(__dirname, '..', 'static')));
app.use((req, res) => {
	res.sendFile('index.html', { root: __dirname + '/../static' });
});
