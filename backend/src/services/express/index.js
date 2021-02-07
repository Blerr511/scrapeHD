const express = require('express');
const { body, oneOf } = require('express-validator');
const bodyParser = require('body-parser');
const cors = require('cors');

const path = require('path');
const controller = require('controllers');

const app = express();

app.enable('trust proxy');
app.use(cors({ origin: 'localhost:3000' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));
app.use(express.static('build'));
app.post('/api/updateData', body('data').isArray(), controller.updateModels);
app.post(
    '/api/options',
    oneOf([
        body('startTime').isString(),
        body('endTime').isString(),
        body('interval').isNumeric(),
        body('fileLimit').isNumeric(),
    ]),
    controller.updateOptions
);
app.get('/api/options', controller.getOptions);
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../build', 'index.html'));
});
module.exports = app;
