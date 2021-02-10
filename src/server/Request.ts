/***
 *                    _     _              _
 *      /\           (_)   | |            | |
 *     /  \   ___ ___ _ ___| |_ __ _ _ __ | |
 *    / /\ \ / __/ __| / __| __/ _` | '_ \| __|
 *   / ____ \\__ \__ \ \__ \ || (_| | | | | |
 *  /_/    \_\___/___/_|___/\__\__,_|_| |_|\__|
 *
 * Copyright (C) 2020 Bavfalcon9
 *
 * This is private software, you cannot redistribute and/or modify it in any way
 * unless given explicit permission to do so. If you have not been given explicit
 * permission to view or modify this software you should take the appropriate actions
 * to remove this software from your device immediately.
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