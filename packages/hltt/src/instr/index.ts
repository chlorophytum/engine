export enum TTI {
	SVTCA_y,
	SVTCA_x,
	SPVTCA_y,
	SPVTCA_x,
	SFVTCA_y,
	SFVTCA_x,
	SPVTL_parallel,
	SPVTL_orthog,
	SFVTL_parallel,
	SFVTL_orthog,
	SPVFS,
	SFVFS,
	GPV,
	GFV,
	SFVTPV,
	ISECT,
	SRP0,
	SRP1,
	SRP2,
	SZP0,
	SZP1,
	SZP2,
	SZPS,
	SLOOP,
	RTG,
	RTHG,
	SMD,
	ELSE,
	JMPR,
	SCVTCI,
	SSWCI,
	SSW,
	DUP,
	POP,
	CLEAR,
	SWAP,
	DEPTH,
	CINDEX,
	MINDEX,
	ALIGNPTS,
	Unknown28,
	UTP,
	LOOPCALL,
	CALL,
	FDEF,
	ENDF,
	MDAP_noRnd,
	MDAP_rnd,
	IUP_y,
	IUP_x,
	SHP_rp2,
	SHP_rp1,
	SHC_rp2,
	SHC_rp1,
	SHZ_rp2,
	SHZ_rp1,
	SHPIX,
	IP,
	MSIRP_noRp0,
	MSIRP_rp0,
	ALIGNRP,
	RTDG,
	MIAP_noRnd,
	MIAP_rnd,
	NPUSHB,
	NPUSHW,
	WS,
	RS,
	WCVTP,
	RCVT,
	GC_cur,
	GC_orig,
	SCFS,
	MD_grid,
	MD_orig,
	MPPEM,
	MPS,
	FLIPON,
	FLIPOFF,
	DEBUG,
	LT,
	LTEQ,
	GT,
	GTEQ,
	EQ,
	NEQ,
	ODD,
	EVEN,
	IF,
	EIF,
	AND,
	OR,
	NOT,
	DELTAP1,
	SDB,
	SDS,
	ADD,
	SUB,
	DIV,
	MUL,
	ABS,
	NEG,
	FLOOR,
	CEILING,
	ROUND_Grey,
	ROUND_Black,
	ROUND_White,
	ROUND_Undef4,
	NROUND_Grey,
	NROUND_Black,
	NROUND_White,
	NROUND_Undef4,
	WCVTF,
	DELTAP2,
	DELTAP3,
	DELTAC1,
	DELTAC2,
	DELTAC3,
	SROUND,
	S45ROUND,
	JROT,
	JROF,
	ROFF,
	Unknown7B,
	RUTG,
	RDTG,
	SANGW,
	AA,
	FLIPPT,
	FLIPRGON,
	FLIPRGOFF,
	Unknown83,
	Unknown84,
	SCANCTRL,
	SDPVTL_parallel,
	SDPVTL_orthog,
	GETINFO,
	IDEF,
	ROLL,
	MAX,
	MIN,
	SCANTYPE,
	INSTCTRL,
	Unknown8F,
	Unknown90,
	GETVARIATION,
	Unknown92,
	Unknown93,
	Unknown94,
	Unknown95,
	Unknown96,
	Unknown97,
	Unknown98,
	Unknown99,
	Unknown9A,
	Unknown9B,
	Unknown9C,
	Unknown9D,
	Unknown9E,
	Unknown9F,
	UnknownA0,
	UnknownA1,
	UnknownA2,
	UnknownA3,
	UnknownA4,
	UnknownA5,
	UnknownA6,
	UnknownA7,
	UnknownA8,
	UnknownA9,
	UnknownAA,
	UnknownAB,
	UnknownAC,
	UnknownAD,
	UnknownAE,
	UnknownAF,
	PUSHB_1,
	PUSHB_2,
	PUSHB_3,
	PUSHB_4,
	PUSHB_5,
	PUSHB_6,
	PUSHB_7,
	PUSHB_8,
	PUSHW_1,
	PUSHW_2,
	PUSHW_3,
	PUSHW_4,
	PUSHW_5,
	PUSHW_6,
	PUSHW_7,
	PUSHW_8,
	MDRP_grey,
	MDRP_black,
	MDRP_white,
	MDRP03,
	MDRP_rnd_grey,
	MDRP_rnd_black,
	MDRP_rnd_white,
	MDRP07,
	MDRP_min_grey,
	MDRP_min_black,
	MDRP_min_white,
	MDRP0b,
	MDRP_min_rnd_grey,
	MDRP_min_rnd_black,
	MDRP_min_rnd_white,
	MDRP0f,
	MDRP_rp0_grey,
	MDRP_rp0_black,
	MDRP_rp0_white,
	MDRP13,
	MDRP_rp0_rnd_grey,
	MDRP_rp0_rnd_black,
	MDRP_rp0_rnd_white,
	MDRP17,
	MDRP_rp0_min_grey,
	MDRP_rp0_min_black,
	MDRP_rp0_min_white,
	MDRP1b,
	MDRP_rp0_min_rnd_grey,
	MDRP_rp0_min_rnd_black,
	MDRP_rp0_min_rnd_white,
	MDRP1f,
	MIRP_grey,
	MIRP_black,
	MIRP_white,
	MIRP03,
	MIRP_rnd_grey,
	MIRP_rnd_black,
	MIRP_rnd_white,
	MIRP07,
	MIRP_min_grey,
	MIRP_min_black,
	MIRP_min_white,
	MIRP0b,
	MIRP_min_rnd_grey,
	MIRP_min_rnd_black,
	MIRP_min_rnd_white,
	MIRP0f,
	MIRP_rp0_grey,
	MIRP_rp0_black,
	MIRP_rp0_white,
	MIRP13,
	MIRP_rp0_rnd_grey,
	MIRP_rp0_rnd_black,
	MIRP_rp0_rnd_white,
	MIRP17,
	MIRP_rp0_min_grey,
	MIRP_rp0_min_black,
	MIRP_rp0_min_white,
	MIRP1b,
	MIRP_rp0_min_rnd_grey,
	MIRP_rp0_min_rnd_black,
	MIRP_rp0_min_rnd_white,
	MIRP1f
}

export interface InstrFormat<R> {
	createSink(): InstrSink<R>;
}
export interface InstrSink<R> {
	getResult(): R;
	getLength(): number;
	reset(): void;
	addOp(x: TTI): void;
	addByte(x: number): void;
	addWord(x: number): void;
}

export class BinaryInstrSink implements InstrSink<Uint8Array> {
	private xs: number[] = [];
	getLength() {
		return this.xs.length;
	}
	getResult() {
		return new Uint8Array(this.xs);
	}
	reset() {
		this.xs.length = 0;
	}
	addOp(x: TTI) {
		this.xs.push(x);
	}
	addByte(x: number) {
		this.xs.push(x & 0xff);
	}
	addWord(x: number) {
		const highByte = (x & 0xff00) >>> 8;
		const lowByte = x & 0xff;
		this.xs.push(highByte, lowByte);
	}
}

export class TextInstrSink implements InstrSink<string> {
	constructor(private readonly fOffset = false) {}
	private s = "";
	private size = 0;
	getLength() {
		return this.size;
	}
	static rectify(s: string) {
		return s
			.trim()
			.replace(/\s+$/gm, "")
			.replace(/^\s+/gm, "");
	}
	getResult() {
		return TextInstrSink.rectify(this.s);
	}
	reset() {
		this.s = "";
		this.size = 0;
	}
	addOp(x: TTI) {
		this.s += "\n" + (this.fOffset ? this.size + " : " : "") + TTI[x] + " ";
		this.size++;
	}
	addByte(x: number) {
		this.s += (x & 0xff) + " ";
		this.size++;
	}
	addWord(x: number) {
		this.s += ((x << 16) >> 16) + " ";
		this.size += 2;
	}
}

export const TextInstr = {
	createSink(): InstrSink<string> {
		return new TextInstrSink();
	},
	rectify(s: string) {
		return TextInstrSink.rectify(s);
	}
};
