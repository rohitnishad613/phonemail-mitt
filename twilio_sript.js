import twilio from "twilio"

const client = twilio(
  'AC7216ffb15bf6b113604afd868c21d966',
  'b9c09fbac472bae8151fec1a1ac3e5e6',
);
const services = await client.verify.v2.services.list({ limit: 20 })

services.forEach(s => console.log(s.sid, '|', s.friendlyName))