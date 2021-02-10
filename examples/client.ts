import * as Abstical from '../mod.ts';

const client = new Abstical.Client();
await client.connect("ws://localhost:2090/");
const res = await client.send("test", { x: 1, y: 2 });
console.log("Result of 1 + 2 is: " + res.result);

// get server time
const serverTime = await client.send('serverTime');
console.log("The server time is: " + new Date(new Date().setUTCDate(serverTime.date)).toLocaleTimeString());
client.close();