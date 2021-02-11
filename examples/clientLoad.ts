// Sends a lot of requests
import * as Abstical from '../mod.ts';

const client = new Abstical.Client();
await client.connect("ws://localhost:2090/");
client.on('response', (res) => {
	console.log(res.data);
});

// example with a bunch of requests at once
const responses = await Promise.all([
	client.send("serverTime"),
	client.send("add", { x: 10, y: 12 }),
	client.send("add", { x: 11, y: 12 }),
	client.send("add", { x: 12, y: 12 }),
	client.send("add", { x: 13, y: 12 }),
	client.send("add", { x: 14, y: 12 }),
	client.send("add", { x: 15, y: 12 }),
	client.send("add", { x: 16, y: 12 }),
	client.send("add", { x: 17, y: 12 }),
	client.send("add", { x: 18, y: 12 }),
	client.send("add", { x: 19, y: 12 }),
	client.send("add", { x: 20, y: 12 }),
	client.send("add", { x: 21, y: 12 }),
	client.send("add", { x: 22, y: 12 }),
	client.send("add", { x: 23, y: 12 }),
	client.send("add", { x: 24, y: 12 })
]);

// examples sequentially
for (let i = 0; i < 100; i++) {
	client.send("add", { x: i / 2, y: i});
}