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

	public constructor() {
		super();
		super.setMaxListeners(0);
	}

	public async connect(address: string) {
		this.#ws = new WebSocket(address);
		this.#ws.onmessage = this.wsMessage.bind(this);
		this.#ws.onerror = this.wsError.bind(this);
		this.#ws.onclose = async () => {
			clearInterval(this.#heartAck);
		}
		this.#ws.onopen = () => {
			this.emit('open');
		}
		// returns when connected
		return new Promise((res, rej) => {
			let lstnr = () => {
				this.removeListener('open', lstnr);
				res(Date.now());
			}
			this.on("open", lstnr);
		})
	}

	private wsError(err: Event | ErrorEvent) {
		// unknown.
	}

	private wsMessage(ev: MessageEvent) {
		const payload: OpPayload = JSON.parse(ev.data);
		if (payload.op === ReservedOp.OP_MAP) {
			this.#opMap = payload.d;
			this.emit("opmap");
			return;
		}

		if (payload.op === ReservedOp.HEARTBEAT) {
			this.#heartAck = setInterval(() => {
				this.send(ReservedOp.HEARTBEAT, { interval: payload.d?.interval });
			}, payload.d?.interval);
		}

		const request: any = this.#requestPool.get(payload.id) || { id: "unknown", op: ReservedOp.BAD_REQUEST };
		const response: AbsticalResponse = new AbsticalResponse(payload, request);
		this.#requestPool.delete(payload.id);
		this.emit('response', response);
	}

	public async send(op: string | number, d?: any): Promise<AbsticalResponse> {
		if (Object.keys(this.#opMap).length === 0) {
			await this.waitForOpMap();
		}
		const payload: OpPayload = {
			id: v4.generate(),
			d: d,
			op: this.resolveOp(op)
		};

		this.#requestPool.set(payload.id, payload);
		this.#ws.send(new TextEncoder().encode(JSON.stringify(payload)));

		return new Promise((resolve, reject) => {
			let start: number = Date.now();
			let lstnr = (res: AbsticalResponse) => {
				if (res.id === payload.id) {
					this.removeListener('response', lstnr);
					resolve(res);
				}
			}
			setTimeout(() => {
				this.removeListener('response', lstnr);
				resolve(AbsticalResponse.timedOut(payload));
			}, 10000);
			this.on("response", lstnr);
		})
	}

	public async close(): Promise<void> {
		this.send(ReservedOp.DISCONNECT);
		this.#ws.close();
	}

	private waitForOpMap(): Promise<boolean> {
		// this times out after 10 seconds
		return new Promise((resolve, reject) => {
			let tm = setTimeout(() => {reject(false)}, 10000);
			let lstnr = () => {
				clearTimeout(tm);
				resolve(true);
			};
			this.on("opmap", lstnr);
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