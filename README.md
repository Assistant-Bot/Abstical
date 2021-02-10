# Abstical
A basic server websocket api implementation.

## Api
The api is designed to be simple and elegant to use.
### (Server) Creating OP's
```ts
const api = new Abstical();

// register an op and do not include a default function
api.registerOp("add", 1);

for await (let request of api) {
	if (request.is("add")) {
		// auto handle responses by sending the same OP back!
		request.respond({ result: request.x + request.y });
	}
}

// Or register an op with a default function
api.registerOp("add", 1, (req: Abstical.Request) => {
	return req.respond({ result: req.one + req.two });
});
```
### (Client) Handling/Sending OP's
```ts
const client = new AbsticalClient();
client.connect("someServer.dns");

// ops are defined on connection. Using the basic creating op example "add" for this
client.send('add', { x: 4, y: 1 }); // 5

// or

client.add(3, 1); // 4
```