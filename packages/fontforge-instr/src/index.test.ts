import { TTI } from "@chlorophytum/hltt-next-backend";
import test from "ava";

import { FontForgeTextInstr } from "./index";

test("FontForge instruction test", t => {
	const sink = FontForgeTextInstr.createSink();
	sink.reset();
	sink.addOp(TTI.PUSHB_1);
	sink.addByte(1);
	sink.addOp(TTI.CALL);
	t.is(sink.getResult(), `PUSHB_1 1 \nCALL`);
});
