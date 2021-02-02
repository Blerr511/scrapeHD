const http = require('http');
const app = require('services/express');
const io = require('services/socket');
const server = http.createServer(app);
io.attach(server);
const port = process.env.PORT || 8080;

server.listen(port, () => {
    console.log(`Listening ${port}`);
});

module.exports = server;
