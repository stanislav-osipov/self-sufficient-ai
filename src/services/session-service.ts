import { Session } from 'botbuilder';
import _ = require('lodash');
import uuidv4 = require('uuid/v4');

class SessionService {
  private sessions: { [key: string]: Session }

  constructor() {
    this.sessions = {};
  }

  public storeSession(session: Session): string {
    let newSessionId: string;
    _.some(_.keys(this.sessions), (sessionId: string) => {
      if (this.sessions[sessionId] === session) {
        newSessionId = sessionId;
        return true;
      }
    });

    if (newSessionId) {
      return newSessionId;
    }

    newSessionId = uuidv4();
    this.sessions[newSessionId] = session;
    return newSessionId;
  }

  public getSession(sessionId: string): Session|null {
    return this.sessions[sessionId] || null;
  }

  public removeSession(sessionId: string): void {
    delete this.sessions[sessionId];
  }
}

const sessionService = new SessionService();

export default sessionService;