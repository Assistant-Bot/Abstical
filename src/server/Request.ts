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
	[key: string]: any;
	#server: Server;
	#connection: Connection;

	public constructor(server: Server, conn: Connection, payload: OpPayload) {
		this.#server = server;
		this.#connection = conn;
		this.oPay = payload;

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

	public respond(opOrd: any, d?: any) {
		if (d) {
			return this.#connection.send(opOrd, d);
		} else {
			return this.#connection.send(this.oPay.op, d);
		}
	}
}