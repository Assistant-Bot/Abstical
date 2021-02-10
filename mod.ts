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
export { default as Client } from "./src/client/Client.ts";
export { default as Connection } from "./src/server/Connection.ts";
export { default as Response } from "./src/client/Response.ts";
export { default as Request } from "./src/server/Request.ts";
export { default as Server } from "./src/server/Server.ts";

export * as OP from "./src/OP.ts";