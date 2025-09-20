// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage() {
  const message = await client.messages.create({
    contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e",
    contentVariables: JSON.stringify({ 1: "22 July 2026", 2: "3:15pm" }),
    from: "whatsapp:+19867587155",
    to: "whatsapp:+5585991486998",
  });

  console.log(message.body);
}

createMessage();