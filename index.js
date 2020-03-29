'use strict';

const {WebClient} = require('@slack/web-api');

const got = require('got');

const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const token = process.env.SLACK_TOKEN;
const web = new WebClient(token);

process.on('unhandledRejection', console.error);

exports.slashCommand = async (req, res) => {
    console.log(webhookUrl);
    res.set('Access-Control-Allow-Origin', '*');

    try {
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
            const endTimestamp = Math.round((Date.now() / 1000) + (1 * 60 * 60));
            const endDate = new Date(endTimestamp * 1000);
            await Promise.all([
                web.users.profile.set({
                    profile: {
                        status_text: "Out to lunch",
                        status_emoji: emojis[Math.trunc(Math.random() * emojis.length)],
                        status_expiration: endTimestamp,
                    }
                }),
                got.post(webhookUrl, {json: {text: `_${req.body.user_name} is out to lunch until ${endDate.toTimeString()}_`}})
            ]).then(() => {
                res.status(200).send("Cool, I've updated your status.👍");
            });
        } else {
            res.status(204).send('');
        }
    } catch (e) {
        console.error(e);
    }

};
