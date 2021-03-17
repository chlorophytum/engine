import { TTI } from "@chlorophytum/hltt-next-backend";
import { TrGraphState0, TrIup } from "@chlorophytum/hltt-next-tr";

import { Stmt } from "../stmt";

export const Svtca = {
	x() {
		return new Stmt(new TrGraphState0(TTI.SVTCA_x));
	},
	y() {
		return new Stmt(new TrGraphState0(TTI.SVTCA_y));
	}
};

export const Iup = {
	x() {
		return new Stmt(new TrIup(TTI.IUP_x));
	},
	y() {
		return new Stmt(new TrIup(TTI.IUP_y));
	}
};
