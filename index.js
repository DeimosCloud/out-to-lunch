'use strict';

const { WebClient } = require('@slack/web-api');

const token = process.env.SLACK_TOKEN;
const web = new WebClient(token);

exports.slashCommand = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
  } else if (req.method === 'POST') {
    let time = req.body.text;

    const emojis = [
      ":yum:", ":hamburger:", ":shallow_pan_of_food:", ":sandwich:", ":bread:",
    ];
    await Promise.all([
      web.users.profile.set({
        profile: {
          status_text: "Out to lunch",
          status_emoji: emojis[Math.trunc(Math.random() * emojis.length)],
          status_expiration: Math.round((Date.now() / 1000) + (1 * 60 * 60)),
        }
      })
    ]).then(() => {
      res.status(200).send("Cool, I've set your status.👍");
    });
  } else {
    res.status(204).send('');
  }

};
