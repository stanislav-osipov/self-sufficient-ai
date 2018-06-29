import request = require('request');
import _ = require('lodash');
import authorization from './authorization';

import { Session } from 'botbuilder';

abstract class MessageHandler {
  abstract handleMessage(session: Session): void;
}

class Albion extends MessageHandler {
  static readonly dataUrl: string = 'https://gameinfo.albiononline.com/api/gameinfo/events/';
  static readonly MESSAGES = {
    ERROR: 'Ошибка :(',
    SUCCESS_STOP: 'Успешно остановлено!',
    SUCCESS_STOP_NAMED: 'Успешно остановлено, <%=username%>!'
  };

  private interval: NodeJS.Timer;
  private session: Session;
  private name: string;
  private data = [];

  private start(): void {
    this.stop(true);
    
    this.interval = setInterval(() => {
      request({
        url: Albion.dataUrl
      }, this.onRequestEnd.bind(this)) 
    }, 30000);
  }

  private stop(isOnStart?: boolean): void {
    clearInterval(this.interval);

    if (isOnStart) {
      return;
    }

    const message: string = this.name ? 
      _.template(Albion.MESSAGES.SUCCESS_STOP_NAMED)({username: this.name}) : 
      Albion.MESSAGES.SUCCESS_STOP;

    this.send(message);
  }

  private onRequestEnd(error: Error, response: request.RequestResponse, body: string): void {
    if (error || (response && response.statusCode !== 200)) {
      this.send(Albion.MESSAGES.ERROR);
      return;
    }

    const data = JSON.parse(body);

    if (data) {
      const diff = _.differenceBy<any>(data, this.data, 'EventId');

      if (diff.length) {
        this.data = data;
        const msg = diff.map(event => `${event.Killer.Name} killed ${event.Victim.Name}`).join('\n\n');

        this.send(msg);
      }
    } else {
      this.send(Albion.MESSAGES.ERROR);
    }
  }

  private send(message: string): void {
    this.session.send(message);
  }

  public handleMessage(session: Session) {
    if (!session) {
      return;
    }

    this.session = session;

    const isStartMsg: RegExpExecArray = /^(?:@SelfSufficientAI\s)?(a-start)(?:\s(\d))?$/.exec(session.message.text);
    const isEndMsg: RegExpExecArray = /^(?:@SelfSufficientAI\s)?(a-stop)(?:\s(\d))?$/.exec(session.message.text);
    
    if (!isStartMsg && !isEndMsg) {
      return;
    }

    authorization(this.session)
      .then((name: string) => {
        if (name) {
          this.name = name;
        }

        isStartMsg ? 
          this.start() : 
          this.stop();
      });
  }
}

export default Albion;