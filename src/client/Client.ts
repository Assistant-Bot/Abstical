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
import { OpMap, OpPayload, ReservedOp } from "../OP.ts";
import { v4 } from "https://deno.land/std@0.86.0/uuid/mod.ts";
import { EventEmitter } from 'https://deno.land/std@0.85.0/node/events.ts';
import AbsticalResponse from "./Response.ts";

export default class Client extends EventEmitter {
	#ws!: WebSocket;
	#heartAck?: number;
	#opMap: OpMap = {};
	#requestPool: Map<string, any> = new Map();

	public connect(address: string) {
		this.#ws = new WebSocket(address);
		this.#ws.onmessage = this.wsMessage.bind(this);
		this.#ws.onerror = this.wsError.bind(this);
		this.#ws.onclose = async () => {
			clearInterval(this.#heartAck);
		}
	}

	private wsError(err: Event | ErrorEvent) {
		// unknown.
	}

	private wsMessage(ev: MessageEvent) {
		const payload: OpPayload = JSON.parse(ev.data);

		if (payload.op === ReservedOp.OP_MAP) {
			this.#opMap = this.#opMap;
		}

		if (payload.op === ReservedOp.HEARTBEAT) {
			this.#heartAck = setInterval(() => {
				this.send(ReservedOp.HEARTBEAT, { interval: payload.d?.interval });
			}, payload.d?.interval);
			return;
		}

		if (payload.op === ReservedOp.HEARTBEAT_ACK) {
			// server still alive, we can ignore this
			return;
		}

		const request: any = this.#requestPool.get(payload.id) || { id: "unknown", op: ReservedOp.BAD_REQUEST };
		const response: AbsticalResponse = new AbsticalResponse(payload, request);
		this.#requestPool.delete(payload.id);
		this.emit('response', response);
	}

	public send(op: string | number, d?: any): Promise<AbsticalResponse> {
		const payload: OpPayload = {
			id: v4.generate(),
			d: d,
			op: this.resolveOp(op)
		};

		this.#requestPool.set(payload.id, payload);

		return new Promise((resolve, reject) => {
			let lstnr = (res: AbsticalResponse) => {
				this.removeListener('response', lstnr);
				resolve(res);
			}
			this.on("response", lstnr);
		})
	}

	private resolveOp(op: string | number): number {
		if (typeof op === 'string') {
			return this.#opMap[op as any]?.op || ReservedOp.BAD_REQUEST;
		} else {
			return op;
		}
	}
}