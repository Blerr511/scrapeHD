const express = require('express');
const { body } = require('express-validator');
const bodyParser = require('body-parser');
const cors = require('cors');
const uploadNewDataController = require('controllers/uploadNewData.controller');
const app = express();

app.use(cors({ origin: 'localhost:3000' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));

app.post('/api/updateData', body('data').isArray(), uploadNewDataController);

module.exports = app;
