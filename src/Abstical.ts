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
import { ReservedOp } from "./OP.ts";

export default class Abstical {
	#opMap: Map<string, number>;

	public constructor(opMap: Map<string, number> = new Map()) {
		this.#opMap = opMap;
		this.validateOpMap();
	}

	public registerOp(name: string, number: number): boolean {
		if (this.hasOpName(name) || this.hasOp(number)) {
			return false;
		} else {
			this.#opMap.get(name);
			return true;
		}
	}

	public hasOpName(name: string): boolean {
		return this.#opMap.has(name);
	}

	public hasOp(op: number): boolean {
		return [...this.#opMap.values()].includes(op);
	}

	private validateOpMap(): void {
		let reservedOps: number[] = Object.values(ReservedOp) as number[];
		for (let op of reservedOps) {
			if (this.hasOp(op)) {
				throw new Error(
					// @ts-ignore
					`OP Code: ${op} is reserved for "${Object.keys(ReservedOp).find((k: string) => ReservedOp[k] === op)}"`
				);
			}
		}
	}
}