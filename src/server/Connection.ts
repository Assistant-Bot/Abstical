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
import { isWebSocketCloseEvent, OpCode, WebSocket } from "https://deno.land/std@0.85.0/ws/mod.ts";
import { OpPayload, ReservedOp } from "../OP.ts";
import Server from "./Server.ts";

export default class Connection {
	public readonly ip: string;
	public readonly port: number;
	public readonly ws: WebSocket;
	public lastMessage: number;
	public lastHeartBeat: number;
	public heartInterval: number;
	public task: number;
	#connectedSince: number;
	#server: Server;

	public constructor(ws: WebSocket, server: Server, address: Deno.NetAddr) {
		this.ip = address.hostname;
		this.port = address.port;
		this.ws = ws;
		this.lastMessage = Date.now();
		this.heartInterval = 5000;
		this.lastHeartBeat = Date.now();
		this.#server = server;
		this.#connectedSince = Date.now();
		this.task = setInterval(this.tick, this.heartInterval, this);
		this.send(ReservedOp.OP_MAP, this.#server.generateOpMap());
		this.handleWs();
	}

	private async handleWs() {
		try {
			for await (const message of this.ws) {
				if (message instanceof Uint8Array) {
					this.#server.emit('message', this, JSON.parse(new TextDecoder().decode(message)));
				} else if (isWebSocketCloseEvent(message)) {
					const { code, reason } = message;
					this.#server.emit('close', this);
				}
			}
			this.#server.connections.delete(this.ip + ':' + this.port);
		} catch {}
	}

	public send(opName: string | number, data?: any) {
		if (!this.#server.hasAnyOp(opName)) {
			return;
		} else {
			const _num = this.#server.getAnyOp(opName) as [number, Function] | number;
			const op: number = _num instanceof Array ? _num[0] : _num;
			const payload: OpPayload = {
				op
			};
			if (data) {
				payload.d = data;
			}
			payload.t = this.#server.resolveOpName(op) as string;
			this.#server.emit('send', this, payload);
			try {
				this.ws.send(JSON.stringify(payload));
			} catch {}
		}
	}

	private async tick(instance: this) {
		this.send(ReservedOp.HEARTBEAT_ACK, { interval: this.heartInterval });

		if (this.lastHeartBeat + this.heartInterval + 10000 < Date.now()) {
			// timed out
			this.#server.emit("timeout", this);
		}
	}
}