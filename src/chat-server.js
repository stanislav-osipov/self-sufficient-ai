const wss = new require('ws');

let clients = {};

const webSocketServer = new wss.Server({
  port: 30130
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