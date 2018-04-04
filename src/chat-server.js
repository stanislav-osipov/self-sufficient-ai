const wss = new require('ws');
const express = require('express');

const PORT = 30130;
const server = express()
  .use((req, res) => res.sendFile('index.html') )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));


let clients = {};

const webSocketServer = new wss.Server({
 server
});

webSocketServer.on('connection', webSocket => {
  const id = (+new Date()).toString(36);
  clients[id] = webSocket;

  console.log('+1: ' + id);

  webSocket.on('message', message => {
    for (var key in clients) {
      clients[key].send(message);
    }
  });

  webSocket.on('close', () => {
    delete clients[id];
    console.log('-1:' + id);
  });
});