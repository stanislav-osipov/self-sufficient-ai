import { Session, Message } from 'botbuilder';

export default abstract class MessageHandler {
  private botNameRegex: RegExp;

  constructor() {
    this.botNameRegex = new RegExp('^(?:@SelfSufficientAI\\s)?(.*)$');
  }

  public handleMessage(session: Session) {
    this.stripBotName(session);

    this.handleBotMessage(session)
      .then(response => {
        if (response) {
          session.send(response);
        }
      });
  }

  public stripBotName(session: Session): void {
    session.message.text = session.message.text.replace(this.botNameRegex, '$1');
  }

  protected abstract handleBotMessage(session: Session): Promise<Message|string>
}