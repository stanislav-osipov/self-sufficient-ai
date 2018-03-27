import request = require('request-promise-native');

function jsonRequest (options: request.OptionsWithUrl): Promise<any> {
  options.json = true;
  return request(options);
}

type IRequestOptions = request.OptionsWithUrl;

export { jsonRequest, IRequestOptions };