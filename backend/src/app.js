const http = require('http');
const express = require('express');
const { body } = require('express-validator');
const bodyParser = require('body-parser');
const uploadNewDataController = require('controllers/uploadNewData.controller');
const io = require('socket');
const app = express();
const server = http.createServer(app);

io.attach(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));

app.post('/api/updateData', body('data').isArray(), uploadNewDataController);

const port = process.env.PORT || 8080;
const host = process.env.HOST || 'localhost';

server.listen(port, host, () => {
    console.log(`Listening ${host}:${port}`);
});

// import { JSDOM } from 'jsdom';
// import fetch from 'node-fetch';
// import * as fs from 'fs';
// import path from 'path';
// let tmr = 0;
// setInterval(() => {
//     tmr++;
// }, 1000);

// function getRandomInt(min, max) {
//     min = Math.ceil(min);
//     max = Math.floor(max);
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }
// if (!fs.existsSync(path.join(__dirname, 'files'))) fs.mkdirSync('files');
// const A = [
//     'HGS8655UC',
//     'DVG45T6000V',
//     'WM3400CW',
//     'HBN5651UC',
//     'SHEM3AY55N',
//     'MGD6630HW',
//     'WFC315S0JW',
//     'HBL5551UC',
//     'FFEW2726TW',
//     'GLR12BS2K16',
// ];

// const getData = async () => {
//     for (let i = 0; i < 5000; i++) {
//         await fetch(`https://www.homedepot.com/s/HGS8655UC`)
//             .then((data) => data.text())
//             .then((data) => data.split('<body>')[1].replace('</body>', ''))
//             .then((data) => {
//                 return new JSDOM(data).window.document.body.querySelector(
//                     '.price>div>span:nth-of-type(2)'
//                 )?.textContent;
//             })
//             .then((price) => {
//                 console.log(price, `time ${tmr}`);
//                 tmr = 0;
//             })
//             .catch((err) => {
//                 console.log(err)
//                 console.log('failed', `time ${tmr}`);
//                 tmr = 0;
//             });
//     }
// };
// getData();
