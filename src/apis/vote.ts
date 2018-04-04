import _ = require('lodash');
import request = require('request');

import { Session, HeroCard, CardImage, CardAction, Message, TextFormat, AttachmentLayout, UniversalBot, IActionRouteData} from 'botbuilder';
import MessageHandler from '../utils/message-handler';

type VoteResults = {
  [user: string]: string
}

type VoteItem = {
  title: string,
  subtitle: string,
  text: string,
  imageUrl: string,
  buttonText: string,
  option: string
}

type VoteResponse = {
  list: VoteItem[]
}

export default class Vote extends MessageHandler {
  static readonly prefix: string = '__vote-option-';
  static readonly dataUrl: string = 'https://ng2-app.firebaseio.com/vote.json';

  private isStarted: boolean = false;
  private results: VoteResults;

  protected handleBotMessage(session: Session): Promise<string|Message> {
    return new Promise((resolve, reject) => {
      const match = /^vote$/.exec(session.message.text);

      if (!match) {
        resolve(null);
        return;
      }

      if (this.isStarted) {
        this.isStarted = false;

        resolve(this.getResults());
        return;
      }

      this.results = {};

      request({
        url: Vote.dataUrl
      }, (error: Error, response: request.RequestResponse, body: string) => {
        if (error || (response && response.statusCode !== 200)) {
          resolve(null);
          return;
        }

        const data: VoteResponse = JSON.parse(body);

        if (data && data.list && !!data.list.length) {
          let cards: HeroCard[] = [];

          _.forEach(data.list, (item) => {
            cards.push(
              new HeroCard(session)
                .title(item.title)
                .subtitle(item.subtitle)
                .text(item.text)
                .images([
                  CardImage.create(session, item.imageUrl)
                ])
                .buttons([
                  CardAction.postBack(session, `${Vote.prefix}${item.option}`, item.buttonText)   
                ])
            );
          });

          const msg = new Message(session)
            .textFormat(TextFormat.xml)
            .attachmentLayout(AttachmentLayout.carousel)
            .attachments(cards);
        
          resolve(msg);

          this.isStarted = true;
        }
      });
    });
  }

  private getResults(): string {
    let result: string = '';
    const counted = _.countBy(_.values(this.results));

    _.forEach(counted, (value, option) => {
      result += `Option ${option}: ${value} \n\n`;
    });

    return result;
  }

  private processChoise(user: string, option: string): void  {
    if (this.isStarted) {
      if (user in this.results) {
        return;
      }
      
      this.results[user] = option;
    }
  }

  public setCustomActions(bot: UniversalBot): void {
    bot.customAction({
      matches: new RegExp(`^(?:${Vote.prefix})(\\d)$`),
      onSelectAction: (session: Session, args: IActionRouteData) => {
        this.processChoise(session.message.user.name, args.intent.matched[1]);
        session.endConversation();
        session.endDialog();
      }
    })
  }
}