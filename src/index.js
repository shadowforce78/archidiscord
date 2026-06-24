require('dotenv').config();
const { Agent, setGlobalDispatcher } = require("undici");
setGlobalDispatcher(new Agent({
    headersTimeout: 300000, // 5 minutes
    bodyTimeout: 300000,
    connectTimeout: 300000
}));
const fs = require('fs');
const DiscordBot = require('./client/DiscordBot');

fs.writeFileSync('./terminal.log', '', 'utf-8');
const client = new DiscordBot();

module.exports = client;

client.connect();

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);