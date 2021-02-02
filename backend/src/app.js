const http = require('http');
const app = require('services/express');
const io = require('services/socket');
const server = http.createServer(app);
io.attach(server);
const port = process.env.PORT || 8080;
const host = process.env.HOST || 'localhost';

server.listen(port, host, () => {
    console.log(`Listening ${host}:${port}`);
});

module.exports = server;
