import request = require('request');
import _ = require('lodash');

const dataUrl = 'https://ng2-app.firebaseio.com/authorization.json';
const MESSAGES = {
  ERROR: 'Ошибка :(',
  UNAUTH: 'Ты кто такой, <%=username%>?'
}

function handleError(session, error, name?) {
  name ?
    session.send(_.template(error)({username: name})) :
    session.send(error);
}

function authorization(session) {
  return new Promise((resolve, reject) => {
    if (!session) {
      resolve();
      return;
    }

    if (session.message && session.message && session.message.user && session.message.user.name) {
      const fromName = session.message.user.name;

      request({
        url: dataUrl
      }, function (error, response, body) {
        if (error || (response && response.statusCode !== 200)) {
          handleError(session, MESSAGES.ERROR);
          return;
        }

        const data = JSON.parse(body);

        if (data && data.list && data.list.length) {
          if (data.list.indexOf(fromName) > -1) {
            resolve(fromName);
            return;
          } else {
            handleError(session, MESSAGES.UNAUTH, fromName);
            return;
          }
        } else {
          handleError(session, MESSAGES.ERROR);
          return;
        }
      });
    } else {
      resolve();
      return;
    }
  });
}

export default authorization;