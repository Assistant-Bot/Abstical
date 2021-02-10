/***
 *                    _     _              _
 *      /\           (_)   | |            | |
 *     /  \   ___ ___ _ ___| |_ __ _ _ __ | |_
 *    / /\ \ / __/ __| / __| __/ _` | '_ \| __|
 *   / ____ \\__ \__ \ \__ \ || (_| | | | | |_
 *  /_/    \_\___/___/_|___/\__\__,_|_| |_|\__|
 *
 * Copyright (C) 2020 Bavfalcon9
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 3
 * of the License, or (at your option) any later version.
 */
import { EventEmitter, GenericFunction, WrappedFunction } from 'https://deno.land/std@0.85.0/node/events.ts';
import { serve, Server as HTTPServer } from "https://deno.land/std@0.85.0/http/server.ts";
import { acceptWebSocket, WebSocket } from "https://deno.land/std@0.85.0/ws/mod.ts";
import { OpPayload, ReservedOp } from "../OP.ts";
import Connection from "./Connection.ts";
import Request from "./Request.ts";

export type ServerReciever = (connection: Connection, payload?: any) => any;
export type ServerDispatch = (connection: Connection, payload: OpPayload) => any;
export type ServerListener = ServerReciever | ServerDispatch;
export type ServerEvent = "close" | "timeout" | "message" | "send";

export default class Server extends EventEmitter {
	public connections: Map<string, Connection>;
	#opMap: Map<string, number | [number, Function]>;
	#ws!: WebSocket;
	#fakeServer!: HTTPServer;

	public constructor(opMap: Map<string, number> = new Map()) {
		super();
		this.connections = new Map();
		this.#opMap = opMap;
		this.validateOpMap();
	}

	public registerOp(name: string, number: number, fn?: Function): boolean {
		if (this.hasOpName(name) || this.hasOp(number)) {
			return false;
		} else {
			if (fn) {
				this.#opMap.set(name, [number, fn]);
			} else {
				this.#opMap.set(name, number);
			}
			return true;
		}
	}

	public resolveOpName(op: number): string | false {
		let opName = [...this.#opMap.entries()].find((v) => {
			if (v[1] instanceof Array) {
				return v[1][0] === op;
			} else {
				return v[1] === op;
			}
		})?.[0];
		return opName || false;
	}

	public getOpBC(op: number) {
		return [...this.#opMap.values()].find((v) => {
			if (v instanceof Array) {
				return v[0] === op;
			} else {
				return v === op;
			}
		});
	}

	public getOp(op: string) {
		return this.#opMap.get(op);
	}

	public getAnyOp(op: string | number) {
		if (typeof op === 'string') {
			return this.getOp(op);
		} else {
			return this.getOpBC(op);
		}
	}

	public hasOpName(name: string): boolean {
		return this.#opMap.has(name);
	}

	public hasOp(op: number): boolean {
		return [...this.#opMap.values()].includes(op);
	}

	public hasAnyOp(op: string | number): boolean {
		if (typeof op === 'string') {
			return this.hasOpName(op);
		} else {
			return this.hasOp(op);
		}
	}

	public generateOpMap(): any {
		// todo: Send a map with "schemas" of each op
		let opsMap: any = {};
		for (let [k, v] of this.#opMap) {
			let resolvedNum: number = v instanceof Array ? v[0] : v;
			opsMap[resolvedNum] = {
				name: k,
				op: resolvedNum,
				reserved: Object.values(ReservedOp).includes(resolvedNum)
			}
		}
		return opsMap;
	}

	public async listen(port: number) {
		this.#fakeServer = serve({ port });
		for await (const req of this.#fakeServer) {
			const { conn, r: bufReader, w: bufWriter, headers } = req;
			try {
				const w = await acceptWebSocket({
					conn,
					bufReader,
					bufWriter,
					headers
				});
				this.shakeSocket(w);
			} catch (e) {
				req.respond({ status: 500 });
			}
		}
	}

	private validateOpMap(): void {
		let reservedOps: number[] = Object.values(ReservedOp) as number[];
		for (let op of reservedOps) {
			if (this.hasOp(op)) {
				throw new Error(
					// @ts-ignore
					`OP Code: ${op} is reserved for "${Object.keys(ReservedOp).find((k: string) => ReservedOp[k] === op)}"`
				);
			} else {
				// @ts-ignore
				this.registerOp(Object.keys(ReservedOp).find((k: string) => ReservedOp[k] === op) || 'UNKNOWN_OP', op);
			}
		}
	}

	private async shakeSocket(socket: WebSocket) {
		const address = (socket.conn.remoteAddr as Deno.NetAddr);
		if (!this.connections.has(`${address.hostname}:${address.port}`)) {
			this.connections.set(`${address.hostname}:${address.port}`, new Connection(socket, this, address));
		} else {
			socket.close();
		}
	}

	public on(ev: ServerEvent, listener: ServerListener): this {
		return super.on(ev, listener);
	}

	public once(ev: ServerEvent, listener: ServerListener): this {
		return super.once(ev, listener);
	}

	public emit(ev: string, ...args: any[]): boolean {
		return super.emit(ev, ...args);
	}

	async *[Symbol.asyncIterator](): AsyncGenerator<Request> {
		while (!this.#ws.isClosed) {
			yield this.awaitRequest();
		}
	}

	private async awaitRequest(): Promise<Request> {
		return new Promise((resolve, reject) => {
			this.once('message', (conn: Connection, payload: any) => {
				const req = new Request(this, conn, payload);
				resolve(req);
			});
		});
	}
}