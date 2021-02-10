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
import { OpPayload, ReservedOp } from "../OP.ts";

export default class Response {
	public readonly id: string;
	public readonly data?: any;
	public readonly request: OpPayload;
	public readonly timedout: boolean;
	#failed: boolean = false;
	[key: string]: any;

	public constructor(payload: OpPayload, request: OpPayload, timedout: boolean = false) {
		this.id = payload.id;
		this.data = payload.d;
		this.request = request;
		this.timedout = timedout;

		if (payload.op === ReservedOp.BAD_REQUEST) {
			this.#failed = true;
			this.payload = this.data?.payload || { id: "unknown", op: ReservedOp.BAD_REQUEST };
		} else {
			for (let k of Object.keys(payload.d || {})) {
				this[k] = payload.d?.[k];
			}
		}
	}

	public isEmpty(): boolean {
		return !!this.data;
	}

	public get hasFailed(): boolean {
		return !!this.#failed;
	}

	public static timedOut(req: OpPayload): Response {
		return new this({ id: "Timed Out", op: ReservedOp.DISCONNECT }, req, true);
	}
}