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
import { OpPayload } from "../OP.ts";
import Connection from "./Connection.ts";
import Server from "./Server.ts";

export default class Request {
	public readonly oPay: OpPayload;
	public readonly op: number;
	public connection: Connection;
	#_responded: boolean;
	#server: Server;
	// This is not cool but ignore it.
	[key: string]: any;

	public constructor(server: Server, conn: Connection, payload: OpPayload) {
		this.#server = server;
		this.connection = conn;
		this.#_responded = false;
		this.oPay = payload;
		this.op = payload.op;

		if (!this.#server.hasOp(payload.op)) {
			// bad request
			this.respond("BAD_REQUEST", { payload });
		} else {
			if (payload.d) {
				for (let k of Object.keys(payload.d)) {
					this[k] = payload.d[k];
				}
			}
		}
	}

	public is(op: string | number): boolean {
		if (!this.#server.hasAnyOp(op)) {
			return false;
		}
		let opr = this.#server.getAnyOp(op);
		let absolute: number = opr instanceof Array
			? opr[0]
			: opr as number;
		return this.oPay.op === absolute;
	}

	public respond(opOrd: any, d?: any) {
		if (this.#_responded === true) {
			throw new Error("Can not respond to a request twice");
		} else {
			this.#_responded = true;
		}
		if (d) {
			return this.connection.send(opOrd, d, this.oPay.id);
		} else {
			return this.connection.send(this.oPay.op, opOrd, this.oPay.id);
		}
	}

	public get responded(): boolean {
		return !!this.#_responded;
	}

	public get requestId(): string {
		return this.oPay.id;
	}
}