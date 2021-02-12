const http = require('http');
const app = require('services/express');
const io = require('services/socket');
const server = http.createServer(app);
const fs = require('fs');

require('services/scrapper');
if (!fs.existsSync('./static')) {
    fs.mkdirSync('./static');
}

io.attach(server);
const port = process.env.PORT || 8080;
server.listen(port, () => {
    console.log(`Listening ${port}`);
});

module.exports = server;
