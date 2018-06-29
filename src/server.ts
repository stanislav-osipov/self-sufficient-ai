import { fork }from 'child_process';
import {
  createServer,
  plugins as restifyPlugins,
  Server
} from 'restify';

import {
  UniversalBot,
  ChatConnector,
  Session
} from 'botbuilder';

import Announcement from './apis/announcement';
import Vote from './apis/vote';
import Votex from './apis/votex';
import Albion from './apis/albion';

const announcement: Announcement = new Announcement();
const vote: Vote = new Vote();
const votex: Votex = new Votex();
const albion: Albion = new Albion();

// Setup Restify Server
const server: Server = createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
// ID and PASSWORD have been moved to heroku config variables
const connector: ChatConnector = new ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

server.get(/.*/, restifyPlugins.serveStatic({
	'directory': '.',
	'default': '../index.html'
}));

const bot: UniversalBot = new UniversalBot(connector, (session: Session) => {
  announcement.handleMessage(session);
  vote.handleMessage(session);
  votex.handleMessage(session);
  albion.handleMessage(session);
});

vote.setCustomActions(bot);
votex.setCustomActions(bot);
