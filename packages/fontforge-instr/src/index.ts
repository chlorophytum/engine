import { InstrSink, TTI } from "@chlorophytum/hltt-next-backend";

const FF_INSTR_NAMES = [
	"SVTCA[y-axis]",
	"SVTCA[x-axis]",
	"SPVTCA[y-axis]",
	"SPVTCA[x-axis]",
	"SFVTCA[y-axis]",
	"SFVTCA[x-axis]",
	"SPVTL[parallel]",
	"SPVTL[orthog]",
	"SFVTL[parallel]",
	"SFVTL[orthog]",
	"SPVFS",
	"SFVFS",
	"GPV",
	"GFV",
	"SFVTPV",
	"ISECT",
	"SRP0",
	"SRP1",
	"SRP2",
	"SZP0",
	"SZP1",
	"SZP2",
	"SZPS",
	"SLOOP",
	"RTG",
	"RTHG",
	"SMD",
	"ELSE",
	"JMPR",
	"SCVTCI",
	"SSWCI",
	"SSW",
	"DUP",
	"POP",
	"CLEAR",
	"SWAP",
	"DEPTH",
	"CINDEX",
	"MINDEX",
	"ALIGNPTS",
	"Unknown28",
	"UTP",
	"LOOPCALL",
	"CALL",
	"FDEF",
	"ENDF",
	"MDAP[no-rnd]",
	"MDAP[rnd]",
	"IUP[y]",
	"IUP[x]",
	"SHP[rp2]",
	"SHP[rp1]",
	"SHC[rp2]",
	"SHC[rp1]",
	"SHZ[rp2]",
	"SHZ[rp1]",
	"SHPIX",
	"IP",
	"MSIRP[no-rp0]",
	"MSIRP[rp0]",
	"ALIGNRP",
	"RTDG",
	"MIAP[no-rnd]",
	"MIAP[rnd]",
	"NPUSHB",
	"NPUSHW",
	"WS",
	"RS",
	"WCVTP",
	"RCVT",
	"GC[cur]",
	"GC[orig]",
	"SCFS",
	"MD[grid]",
	"MD[orig]",
	"MPPEM",
	"MPS",
	"FLIPON",
	"FLIPOFF",
	"DEBUG",
	"LT",
	"LTEQ",
	"GT",
	"GTEQ",
	"EQ",
	"NEQ",
	"ODD",
	"EVEN",
	"IF",
	"EIF",
	"AND",
	"OR",
	"NOT",
	"DELTAP1",
	"SDB",
	"SDS",
	"ADD",
	"SUB",
	"DIV",
	"MUL",
	"ABS",
	"NEG",
	"FLOOR",
	"CEILING",
	"ROUND[Grey]",
	"ROUND[Black]",
	"ROUND[White]",
	"ROUND[Undef4]",
	"NROUND[Grey]",
	"NROUND[Black]",
	"NROUND[White]",
	"NROUND[Undef4]",
	"WCVTF",
	"DELTAP2",
	"DELTAP3",
	"DELTAC1",
	"DELTAC2",
	"DELTAC3",
	"SROUND",
	"S45ROUND",
	"JROT",
	"JROF",
	"ROFF",
	"Unknown7B",
	"RUTG",
	"RDTG",
	"SANGW",
	"AA",
	"FLIPPT",
	"FLIPRGON",
	"FLIPRGOFF",
	"Unknown83",
	"Unknown84",
	"SCANCTRL",
	"SDPVTL[parallel]",
	"SDPVTL[orthog]",
	"GETINFO",
	"IDEF",
	"ROLL",
	"MAX",
	"MIN",
	"SCANTYPE",
	"INSTCTRL",
	"Unknown8F",
	"Unknown90",
	"GETVARIATION",
	"Unknown92",
	"Unknown93",
	"Unknown94",
	"Unknown95",
	"Unknown96",
	"Unknown97",
	"Unknown98",
	"Unknown99",
	"Unknown9A",
	"Unknown9B",
	"Unknown9C",
	"Unknown9D",
	"Unknown9E",
	"Unknown9F",
	"UnknownA0",
	"UnknownA1",
	"UnknownA2",
	"UnknownA3",
	"UnknownA4",
	"UnknownA5",
	"UnknownA6",
	"UnknownA7",
	"UnknownA8",
	"UnknownA9",
	"UnknownAA",
	"UnknownAB",
	"UnknownAC",
	"UnknownAD",
	"UnknownAE",
	"UnknownAF",
	"PUSHB_1",
	"PUSHB_2",
	"PUSHB_3",
	"PUSHB_4",
	"PUSHB_5",
	"PUSHB_6",
	"PUSHB_7",
	"PUSHB_8",
	"PUSHW_1",
	"PUSHW_2",
	"PUSHW_3",
	"PUSHW_4",
	"PUSHW_5",
	"PUSHW_6",
	"PUSHW_7",
	"PUSHW_8",
	"MDRP[grey]",
	"MDRP[black]",
	"MDRP[white]",
	"MDRP03",
	"MDRP[rnd,grey]",
	"MDRP[rnd,black]",
	"MDRP[rnd,white]",
	"MDRP07",
	"MDRP[min,grey]",
	"MDRP[min,black]",
	"MDRP[min,white]",
	"MDRP0b",
	"MDRP[min,rnd,grey]",
	"MDRP[min,rnd,black]",
	"MDRP[min,rnd,white]",
	"MDRP0f",
	"MDRP[rp0,grey]",
	"MDRP[rp0,black]",
	"MDRP[rp0,white]",
	"MDRP13",
	"MDRP[rp0,rnd,grey]",
	"MDRP[rp0,rnd,black]",
	"MDRP[rp0,rnd,white]",
	"MDRP17",
	"MDRP[rp0,min,grey]",
	"MDRP[rp0,min,black]",
	"MDRP[rp0,min,white]",
	"MDRP1b",
	"MDRP[rp0,min,rnd,grey]",
	"MDRP[rp0,min,rnd,black]",
	"MDRP[rp0,min,rnd,white]",
	"MDRP1f",
	"MIRP[grey]",
	"MIRP[black]",
	"MIRP[white]",
	"MIRP03",
	"MIRP[rnd,grey]",
	"MIRP[rnd,black]",
	"MIRP[rnd,white]",
	"MIRP07",
	"MIRP[min,grey]",
	"MIRP[min,black]",
	"MIRP[min,white]",
	"MIRP0b",
	"MIRP[min,rnd,grey]",
	"MIRP[min,rnd,black]",
	"MIRP[min,rnd,white]",
	"MIRP0f",
	"MIRP[rp0,grey]",
	"MIRP[rp0,black]",
	"MIRP[rp0,white]",
	"MIRP13",
	"MIRP[rp0,rnd,grey]",
	"MIRP[rp0,rnd,black]",
	"MIRP[rp0,rnd,white]",
	"MIRP17",
	"MIRP[rp0,min,grey]",
	"MIRP[rp0,min,black]",
	"MIRP[rp0,min,white]",
	"MIRP1b",
	"MIRP[rp0,min,rnd,grey]",
	"MIRP[rp0,min,rnd,black]",
	"MIRP[rp0,min,rnd,white]",
	"MIRP1f"
];

export class FontForgeTextInstrSink implements InstrSink<string> {
	constructor(private readonly fOffset = false) {}
	private s = "";
	private size = 0;
	private indent = 0;
	getLength() {
		return this.size;
	}

	getResult() {
		return this.s.trim();
	}
	reset() {
		this.s = "";
		this.size = 0;
	}
	addOp(x: TTI) {
		if (
			FF_INSTR_NAMES[x] === "ENDF" ||
			FF_INSTR_NAMES[x] === "EIF" ||
			FF_INSTR_NAMES[x] === "ELSE"
		) {
			this.indent -= 1;
		}
		this.s +=
			"\n" +
			(this.fOffset ? this.size + " : " : "") +
			"\t".repeat(this.indent) +
			FF_INSTR_NAMES[x] +
			" ";
		this.size++;
		if (
			FF_INSTR_NAMES[x] === "FDEF" ||
			FF_INSTR_NAMES[x] === "IF" ||
			FF_INSTR_NAMES[x] === "ELSE"
		) {
			this.indent += 1;
		}
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

export const FontForgeTextInstr = {
	createSink(): InstrSink<string> {
		return new FontForgeTextInstrSink();
	}
};
