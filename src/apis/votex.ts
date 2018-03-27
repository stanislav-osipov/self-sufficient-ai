import _ = require('lodash');
import request = require('request');

import { Session, HeroCard, CardImage, CardAction, Message, TextFormat, AttachmentLayout, UniversalBot, IActionRouteData, IMessage, IAddress } from 'botbuilder';
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

export default class Votex extends MessageHandler {
  static readonly prefix: string = '__vote-optionx-';
  static readonly dataUrl: string = 'https://ng2-app.firebaseio.com/vote.json';

  private isStarted: boolean = false;
  private results: VoteResults;
  private voteAddress: IAddress;
  private countedResults;
  private data: VoteResponse;

  public handleMessage(session: Session) {
    this.stripBotName(session);

    this.handleBotMessage(session)
      .then(response => {
        if (response && _.isFunction(response.toMessage)) {
          const message = response.toMessage();

          session.connector.send([message], (err, addresses) => {
            if (err) {
              return;
            }
            
            if (this.isStarted) {
              this.voteAddress = addresses[0];
            }
          });
        }
      });
  }

  protected handleBotMessage(session: Session): Promise<Message> {
    return new Promise((resolve, reject) => {
      const match = /^votex$/.exec(session.message.text);

      if (!match) {
        resolve(null);
        return;
      }

      if (this.isStarted) {
        this.isStarted = false;

        resolve(this.getResults(session));
        return;
      }

      this.results = {};

      request({
        url: Votex.dataUrl
      }, (error: Error, response: request.RequestResponse, body: string) => {
        if (error || (response && response.statusCode !== 200)) {
          resolve(null);
          return;
        }

        const data: VoteResponse = JSON.parse(body);

        if (data && data.list && !!data.list.length) {
          const msg = this.createCardsMessage(session, data);
          
          this.data = data;
          this.isStarted = true;
          this.countedResults = null;
          resolve(msg);
        }
      });
    });
  }

  private createSubtitle(voteOption: string): string {
    const votes = this.countedResults ? (this.countedResults[voteOption] || '0') : '0';
    return `Votes: ${votes}`;
  }

  private createCardsMessage(session: Session, data: VoteResponse): Message {
    let cards: HeroCard[] = [];
    
    _.forEach(data.list, (item) => {
      cards.push(
        new HeroCard(session)
          .title(item.title)
          .subtitle(this.createSubtitle(item.option))
          .text(item.text)
          .images([
            CardImage.create(session, item.imageUrl)
          ])
          .buttons([
            CardAction.postBack(session, `${Votex.prefix}${item.option}`, item.buttonText)   
          ])
      );
    });

    const msg = new Message(session)
      .textFormat(TextFormat.xml)
      .attachmentLayout(AttachmentLayout.carousel)
      .attachments(cards);

    return msg;
  }

  private getResults(session: Session): Message {
    let result: string = '';

    this.countedResults = _.countBy(_.values(this.results));

    _.forEach(this.countedResults, (value, option) => {
      result += `Option ${option}: ${value} votes \n\n`;
    });

    return new Message(session).text(result);
  }

  private processChoise(session: Session, user: string, option: string): void  {
    if (this.isStarted) {
      if (user in this.results) {
        return;
      }

      this.results[user] = option;
      this.countedResults = _.countBy(_.values(this.results));

      let msg: IMessage = this.createCardsMessage(session, this.data).toMessage();
      msg.address = this.voteAddress;

      session.connector.update(msg, (err, address) => {
        if (err) {
          return;
        }

        if (address) {
          this.voteAddress = address;
        }
      });
    }
  }

  public setCustomActions(bot: UniversalBot): void {
    bot.customAction({
      matches: new RegExp(`^(?:${Votex.prefix})(\\d)$`),
      onSelectAction: (session: Session, args: IActionRouteData) => {
        this.processChoise(session, session.message.user.name, args.intent.matched[1]);
      }
    })
  }
}