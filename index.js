'use strict';

const {WebClient} = require('@slack/web-api');
const { IncomingWebhook } = require('@slack/webhook');
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const webhook = new IncomingWebhook(webhookUrl);

const got = require('got');

const token = process.env.SLACK_TOKEN;
const chrono = require('chrono-node');

const emojis = [
    ":yum:", ":hamburger:", ":shallow_pan_of_food:", ":sandwich:", ":bread:",
];

const messages = [
    "Cool, I've updated your status.👍",
    "Got it! I've set your status to \"Out to lunch\".😛",
];

exports.slashCommand = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    try {
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.set('Access-Control-Max-Age', '3600');
            res.status(204).send('');
        } else if (req.method === 'POST') {
            const web = new WebClient(token);
            console.log(req.body);

            let timeInformation = req.body.text; // all the text after the slash command
            let timestampToEndStatusAt;
            let dateToEndStatusAt = chrono.parseDate(timeInformation, new Date, {forwardDate: true});
            if (dateToEndStatusAt == null) {
                // default to 1 hour
                timestampToEndStatusAt = Math.round((Date.now() / 1000) + (60 * 60));
                dateToEndStatusAt = new Date(timestampToEndStatusAt * 1000);
            } else {
                timestampToEndStatusAt = Math.round(dateToEndStatusAt.getTime() / 1000);
            }

            await Promise.all([
                web.users.profile.set({
                    profile: {
                        status_text: "Out to lunch",
                        status_emoji: emojis[Math.trunc(Math.random() * emojis.length)],
                        status_expiration: timestampToEndStatusAt,
                    }
                }),
                // See https://api.slack.com/reference/surfaces/formatting
                // for Slack formatting help
                webhook.send({
                    text:
                        `_<@${req.body.user_id}> is out to lunch until <!date^${timestampToEndStatusAt}^{time}|${dateToEndStatusAt.toTimeString()}>_`
                }                )
            ]).then(() => {
                res.status(200).send(messages[Math.trunc(Math.random() * messages.length)]);
            });
        } else {
            res.status(415).send('');
        }
    } catch (e) {
        console.error(e);
    }

};

exports.install = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');

    try {
        if (req.method !== 'GET') {
            res.status(415).send('');
        }

        res.set('Content-Type', 'text/html');
        const html = `
        <a href="https://slack.com/oauth/v2/authorize?scope=commands,users:profile:write&client_id=${process.env.SLACK_CLIENt_ID}"><img alt=""Add to Slack"" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
        `;
        res.status(200).send(html);
    } catch (e) {
        console.error(e);
    }
};
