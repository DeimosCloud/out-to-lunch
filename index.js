'use strict';

const { WebClient } = require('@slack/web-api');

const token = process.env.SLACK_TOKEN;
const web = new WebClient(token);

exports.slashCommand = (request, response) => {
  let time = req.body.text;

  Promise.all([
    web.users.profile.set({
      profile: {
        status_text: "Out to lunch",
        status_emoji: ":yum:",
        status_expiration: Math.round((Date.now() / 1000) + (1 * 60 * 60)),
      }
    })
  ]).then(() => {
    response.status(200).send('Hello World!');
  });
};
