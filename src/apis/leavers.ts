import authorization from './authorization';

import { Session, IConversationUpdate } from 'botbuilder';

type MESSAGES = {
  ERROR: string,
  SUCCESS_STOP: string,
  SUCCESS_STOP_NAMED: string
}

//TODO move to separate file and encapsulate common logic/handlers here if it will take root
abstract class MessageHandler {
  abstract handleMessage(session: Session): void;
}

class Leavers extends MessageHandler {
  private session: Session;
  public tracking = false;

  private start(): void {
    this.tracking = true;
    this.send('Start');
  }

  public handleEvent(event: IConversationUpdate) {
    const leavers = event.membersRemoved;
    
    if (leavers && leavers.length) {
      // const users = leavers.map(leaver => `${leaver.id} (${leaver.name || 'N/A'})`).join(' и ');
  
      this.send(`Кто-то вышел из старого чата. Задумайся, не выходи из старых чатов!`);
    }
  }

  private stop(): void {
    this.tracking = false;
    this.send('End');
  }

  private send(message: string): void {
    this.session.send(message);
  }

  public handleMessage(session: Session) {
    if (!session) {
      return;
    }

    this.session = session;

    const isStart: RegExpExecArray = /^track-leavers$/.exec(session.message.text);
    const isEnd: RegExpExecArray = /^stop-track-leavers$/.exec(session.message.text);
    
    if (!isStart && !isEnd) {
      return;
    }

    authorization(this.session)
      .then((name: string) => {
        isStart ? 
          this.start() : 
          this.stop();
      });
  }
}

export default Leavers;