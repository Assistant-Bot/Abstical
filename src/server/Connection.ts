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
import { v4 } from "https://deno.land/std@0.86.0/uuid/mod.ts";
import { OpPayload, ReservedOp } from "../OP.ts";
import AbsticalRequest from "./Request.ts";
import Server from "./Server.ts";

export default class Connection {
	public readonly ip: string;
	public readonly port: number;
	public ws: WebSocket;
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
		this.handleWs();
		this.task = setInterval(this.tick, this.heartInterval, this);
		this.send(ReservedOp.HEARTBEAT, { interval: this.heartInterval });
		this.send(ReservedOp.OP_MAP, this.#server.generateOpMap());
	}

	private async handleWs() {
		for await (const message of this.ws) {
			if (message instanceof Uint8Array) {
				const payload = JSON.parse(new TextDecoder().decode(message));
				if (!payload.op || !payload.id) {
					this.send(ReservedOp.BAD_REQUEST, { id: payload.id || v4.generate(), payload: payload })
					continue;
				}

				if (payload.op === ReservedOp.HEARTBEAT) {
					if (payload.d.interval !== this.heartInterval) {
						this.close();
						return;
					}
				}
				this.#server.emit('message', new AbsticalRequest(this.#server, this, payload));
			} else if (isWebSocketCloseEvent(message)) {
				const { code, reason } = message;
				this.close(true);
				return;
			}
		}
	}

	public send(opName: string | number, data?: any, id?: string) {
		if (!this.#server.hasAnyOp(opName)) {
			return;
		} else {
			const _num = this.#server.getAnyOp(opName) as [number, Function] | number;
			const op: number = _num instanceof Array ? _num[0] : _num;
			const payload: OpPayload = {
				op,
				id: id ? id : v4.generate()
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

	public close(doNotClose: boolean = false): void {
		this.#server.emit('close', this);
		clearInterval(this.task);
		if (!doNotClose) {
			try {
				this.ws.close();
			} catch {}
		}
		this.#server.connections.delete(this.ip + ':' + this.port);
	}

	private async tick(instance: this) {
		instance.send(ReservedOp.HEARTBEAT_ACK, { interval: this.heartInterval });

		if (this.lastHeartBeat + this.heartInterval + 10000 < Date.now()) {
			// timed out
			instance.#server.emit("timeout", this);
			instance.close();
		}
	}
}