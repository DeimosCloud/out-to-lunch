'use strict';

const {WebClient} = require('@slack/web-api');
const {IncomingWebhook} = require('@slack/webhook');
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const webhook = new IncomingWebhook(webhookUrl);

const got = require('got');
const sheetyApi = got.extend({
    prefixUrl: process.env.SHEETY_API_URL,
    headers: {
        Authorization: `Bearer ${process.env.SHEETY_BEARER_TOKEN}`
    }
});

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
            // Get user's OAuth access token
            const accessTokenResponse = await sheetyApi.get(`?userId=${req.body.user_id}`).json();
            // Sheety API is currently buggy, so multiple filters don't work
            // This means we have to filter for team manually
            const row = accessTokenResponse.accessTokens.find(row => row.teamId = req.body.team_id);

            if (!row) {
                // Yep, it's a 200, telling SLack we were successful.
                // but we don't have the user's auth info
                res.status(200)
                    .send(`Oops, you need to authorize this app first.😕 You can do that by clicking here: https://${req.hostname}/${process.env.SLACK_AUTH_PATH}`);
            }

            const web = new WebClient(row.accessToken);

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
                })
            ]).then(() => {
                res.status(200).send(messages[Math.trunc(Math.random() * messages.length)]);
            });
        } else {
            res.status(405).send('');
        }
    } catch (e) {
        console.error(e);
        res.status(500).send(JSON.stringify(e));
    }

};

exports.install = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');

    try {
        if (req.method !== 'GET') {
            res.status(405).send('');
        }

        res.set('Content-Type', 'text/html');
        const html = `
        <a href="https://slack.com/oauth/authorize?scope=users.profile:write&client_id=${process.env.SLACK_CLIENT_ID}"><img alt="Sign in with Slack" height="40" width="172" src="https://platform.slack-edge.com/img/sign_in_with_slack.png" srcset="https://platform.slack-edge.com/img/sign_in_with_slack.png 1x, https://platform.slack-edge.com/img/sign_in_with_slack@2x.png 2x"/></a>
        `;
        res.status(200).send(html);
    } catch (e) {
        console.error(e);
        res.status(500).send(JSON.stringify(e));
    }
};

exports.completeInstall = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');

    try {
        if (req.method !== 'GET') {
            res.status(405).send('');
        }

        res.set('Content-Type', 'text/html');

        const web = new WebClient();
        const accessResponse = await web.oauth.access({
            client_id: process.env.SLACK_CLIENT_ID,
            client_secret: process.env.SLACK_CLIENT_SECRET,
            code: req.query.code,
        });
        console.log(accessResponse);

        if (accessResponse.error) {
            res.status(400).send("An error occured: " + accessResponse.error);
            return;
        }

        // Store user token so we can use it later to change their status
        // We're using a Google Spreadsheet, made into an API via sheety.co
        await sheetyApi.post({
            json: {
                accessToken: {
                    userId: accessResponse.user_id,
                    accessToken: accessResponse.access_token,
                    teamId: accessResponse.team_id,
                }
            }
        }).then(() => {
            res.status(200).send('Authorized!👍 To set your status in Slack to lunch at any time, use /lunch.');
        }).catch(e => {
            console.log(e);
            res.status(500).send('Something went wrong ' + e);
        });
    } catch (e) {
        console.error(e);
        res.status(500).send(JSON.stringify(e));
    }
};
