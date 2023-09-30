export default class Reader {
    constructor(buffer, offset) {
        this.buffer = buffer;
        this.offset = offset;
    }

    readByte() {
        const byte = this.buffer.readUInt8(this.offset);
        this.offset += 1;
        return byte;
    }

    readByteAsChar() {
        return String.fromCharCode(this.readByte());
    }

    readShort() {
        const short = this.buffer.readUInt16LE(this.offset);
        this.offset += 2;
        return short;
    }

    readLong() {
        const long = this.buffer.readBigUInt64LE(this.offset).toString();
        this.offset += 8;
        return long;
    }

    readFloat() {
        const float = this.buffer.readFloatLE(this.offset);
        this.offset += 4;
        return float;
    }

    readString() {
        const namebuf = [];

        for (let i = this.offset; i < this.buffer.length; i++) {
            if (this.buffer[i] === 0x00) {
                this.offset = i + 1;
                break;
            }

            namebuf.push(String.fromCharCode(this.buffer[i]));
        }

        return Buffer.from(namebuf.join(""), "ascii").toString("utf-8");
    }
}
