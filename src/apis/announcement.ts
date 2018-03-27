import request = require('request');
import _ = require('lodash');
import authorization from './authorization';

import { Session } from 'botbuilder';

type MESSAGES = {
  ERROR: string,
  SUCCESS_STOP: string,
  SUCCESS_STOP_NAMED: string
}

type AnnouncementData = {
  text: string,
  interval: number  
}

//TODO move to separate file and encapsulate common logic/handlers here if it will take root
abstract class MessageHandler {
  abstract handleMessage(session: Session): void;
}

class Announcement extends MessageHandler {
  static readonly dataUrl: string = 'https://ng2-app.firebaseio.com/announcement.json';
  static readonly MESSAGES: MESSAGES = {
    ERROR: 'Ошибка :(',
    SUCCESS_STOP: 'Успешно остановлено!',
    SUCCESS_STOP_NAMED: 'Успешно остановлено, <%=username%>!'
  };

  private interval: NodeJS.Timer;
  private session: Session;
  private name: string;

  private start(): void {
    this.stop(true);
    
    request({
      url: Announcement.dataUrl
    }, this.onRequestEnd.bind(this));
  }

  private stop(isOnStart?: boolean): void {
    clearInterval(this.interval);

    if (isOnStart) {
      return;
    }

    const message: string = this.name ? 
      _.template(Announcement.MESSAGES.SUCCESS_STOP_NAMED)({username: this.name}) : 
      Announcement.MESSAGES.SUCCESS_STOP;

    this.send(message);
  }

  private onRequestEnd(error: Error, response: request.RequestResponse, body: string): void {
    if (error || (response && response.statusCode !== 200)) {
      this.send(Announcement.MESSAGES.ERROR);
      return;
    }

    const data: AnnouncementData = JSON.parse(body);

    if (data && data.text && data.interval) {
      this.send(data.text);
      
      this.interval = setInterval(() => {
        this.send(data.text);
      }, data.interval);
    } else {
      this.send(Announcement.MESSAGES.ERROR);
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

    const isAnnouncementStart: RegExpExecArray = /^(?:@SelfSufficientAI\s)?(announcement)(?:\s(\d))?$/.exec(session.message.text);
    const isAnnouncementEnd: RegExpExecArray = /^(?:@SelfSufficientAI\s)?(stop)(?:\s(\d))?$/.exec(session.message.text);
    
    if (!isAnnouncementStart && !isAnnouncementEnd) {
      return;
    }

    authorization(this.session)
      .then((name: string) => {
        if (name) {
          this.name = name;
        }

        isAnnouncementStart ? 
          this.start() : 
          this.stop();
      });
  }
}

export default Announcement;