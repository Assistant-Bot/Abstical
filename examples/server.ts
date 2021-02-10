import * as Abstical from '../mod.ts';

const server = new Abstical.Server();

server.registerOp("test", 1, (req: Abstical.Request) => {
	req.respond({ result: req.x + req.y });
});

server.registerOp("serverTime", 2, (req: Abstical.Request) => {
	req.respond({ date: new Date().getUTCDate() });
});

server.listen(2090);