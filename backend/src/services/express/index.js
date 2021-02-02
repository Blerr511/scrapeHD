const express = require('express');
const { body } = require('express-validator');
const bodyParser = require('body-parser');
const cors = require('cors');

const path = require('path');

const uploadNewDataController = require('controllers/uploadNewData.controller');
const app = express();

app.use(cors({ origin: 'localhost:3000' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));
app.use(express.static('build'));

app.post('/api/updateData', body('data').isArray(), uploadNewDataController);
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../build', 'index.html'));
});
module.exports = app;
