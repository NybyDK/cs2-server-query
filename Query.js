import { createSocket } from "dgram";
import Reader from "./Reader.js";

const A2S_INFO_REQUEST = Buffer.from(
    "ffffffff54536f7572636520456e67696e6520517565727900",
    "hex",
);

const A2S_PLAYERS_REQUEST = Buffer.from("ffffffff55", "hex");

export default class Query {
    constructor(ip, port) {
        this.socket = createSocket("udp4");
        this.ip = ip;
        this.port = port;
        this.resolve;
        this.mainRequest;
        this.socket.on("message", async msg => {
            if (msg[4] === 0x41) this.handleChallengeResponse(msg);
            if (msg[4] === 0x44) this.handlePlayersResponse(msg);
            if (msg[4] === 0x49) this.handleInfoResponse(msg);
        });
    }

    send(data) {
        this.socket.send(data, this.port, this.ip, error => {
            if (!error) {
                console.log("Query is sent:", data);
            } else {
                console.error(error);
            }
        });
    }

    async requestInfo() {
        return new Promise(resolve => {
            this.resolve = resolve;
            this.mainRequest = A2S_INFO_REQUEST;
            this.send(A2S_INFO_REQUEST);
        });
    }

    async requestPlayers() {
        return new Promise(resolve => {
            this.resolve = resolve;
            this.mainRequest = A2S_PLAYERS_REQUEST;
            this.send(
                Buffer.concat([
                    A2S_PLAYERS_REQUEST,
                    Buffer.from("ffffffff", "hex"),
                ]),
            );
        });
    }

    handleChallengeResponse(msg) {
        console.log(`Received challenge response: ${msg.toString("hex")}`);

        const REQUEST_WITH_CHALLENGE = Buffer.concat([
            this.mainRequest,
            Buffer.from(msg.toString("hex", 5), "hex"),
        ]);

        this.send(REQUEST_WITH_CHALLENGE);
    }

    handlePlayersResponse(msg) {
        const reader = new Reader(msg, 5);

        const response = {};

        const playerCount = reader.readByte();

        for (let i = 1; i < playerCount; i++) {
            response[i] = {
                index: reader.readByte(),
                name: reader.readString(),
                score: reader.readLong(),
                duration: reader.readFloat(),
            };
        }

        this.resolve(response);
    }

    handleInfoResponse(msg) {
        console.log("Received A2S_INFO:");

        const reader = new Reader(msg, 5);

        const response = {};

        response.protocol = reader.readByte();
        response.name = reader.readString();
        response.map = reader.readString();
        response.folder = reader.readString();
        response.game = reader.readString();
        response.id = reader.readShort();
        response.players = reader.readByte();
        response.maxplayers = reader.readByte();
        response.bots = reader.readByte();
        response.servertype = reader.readByteAsChar();
        response.environment = reader.readByteAsChar();
        response.visibility = reader.readByte();
        response.vac = reader.readByte();
        response.version = reader.readString();
        response.edf = reader.readByte();
        if (response.edf & 0x80) {
            response.port = reader.readShort();
        }
        if (response.edf & 0x10) {
            response.steamid = reader.readLong();
        }
        if (response.edf & 0x40) {
            response.sourcetvport = reader.readShort();
            response.sourcetvname = reader.readString();
        }
        if (response.edf & 0x20) {
            response.keywords = reader.readString().split(",");
        }
        if (response.edf & 0x01) {
            response.gameid = reader.readLong();
        }

        this.resolve(response);
    }
}
