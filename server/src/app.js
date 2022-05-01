const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const rfs = require("rotating-file-stream");

const api = require('./routes/api');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
}));

const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // rotate daily
    path: path.join(__dirname, 'log')
  })
   
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/v1', api);

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
})

module.exports = app;
