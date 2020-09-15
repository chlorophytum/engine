# Chlorophytum/HlTT

HlTT is an embedded DSL for TrueType Instructions written in TypeScript.

TrueType instructions form a stack-oriented programming language, operating at a very low level.

```ttinstr
SVTCA[y-axis]
PUSHB_3 18 1 0
CALL
PUSHB_2 15 4
MIRP[min,black]
PUSHB_3 7 3 0
CALL
```

HlTT defines a convenient way to write those binaries by using an embedded DSL in TypeScript (as well as JavaScript):

```typescript
import CreateDSL, { TextInstr } from "@chlorophytum/HlTT"
const eg = CreateDSL()

// Define a function
const inc = eg.declareFunction("increase", function*(e) {
    const [x] = e.args(1);
    yield e.return(e.add(x, 1));
});

// Define a program
const glyph = eg.program(function*(e) {
    yield e.call(inc, e.call(inc, 1));
});

// Compile functions
const fpgm = eg.compileFunctions(TextInstr);
console.log(fpgm.get(inc));
// PUSHB_1 0
// FDEF
// DUP
// PUSHB_1 1
// ADD
// PUSHB_1 2
// MINDEX
// POP
// ENDF
console.log(eg.compileProgram(glyph, TextInstr))
// PUSHB_2 1 0
// CALL
// PUSHB_1 0
// CALL
```

## Global DSL

`CreateDSL()` crates a global DSL (type `Edsl.GlobalDsl`) that you can declare functions and programs (for glyphs, FPGM or PREP).

- `GlobalDsl::createFunction(f: string, b: () => Iterable<Statement>): Variable`
  - Define a function.
- `GlobalDsl::createProgram(b: () => Iterable<Statement>): ProgramRecord`
  - Define a glyph program, or program for FPGM and PREP.
- `GlobalDsl::compileFunctions<R>(format: InstrFormat<R>): Map<Variable, R>`
  - Compile the functions defined so far.
- `GlobalDsl::compileProgram<R>(pr: ProgramRecord, format: InstrFormat<R>): R`
  - Compile a glyph program, or program for FPGM and PREP.

## Program/Function DSL

Program/Function DSL (type `Edsl.ProgramDsl`) is used to define the body of a function or a program.

- Variables
  - `ProgramDsl::args(qty: number): Variable[]`
    - Declare argument variables, only usable in function DSLs
  - `ProgramDsl::local(size = 1): Variable`
    - Define a local variable, return the expression representing it.
    - Providing a size will define an array.
  - `ProgramDsl::twilight(): Variable`
    - Declare a local Twilight Zone point.
    - Only usable in program DSLs. Using it in a function DSL will cause an runtime error.
  - `ProgramDsl::set(a: Variable, x: number | Expression): Statement`
    - Assigns an expression to a variable.
    - Not all variables are assignable (for example arguments are not).
- Graphic statements
  - The following statements are used to create graphic states.
  - Type `NE` denotes either a number or an `Expression`, while `NPE` denotes either a number or a `PointerExpression`. `NPE`s are often used when referencing a CVT index.
  - All point numbers are interpreted as long points, i.e.:
    - Glyph point numbers are referenced as-is;
    - Twilight point numbers are referenced using bitwise negation.
  - `ProgramDsl::mdap(p: NE): Statement`
  - `ProgramDsl::miap(p: NE, cv: NPE): Statement`
  - `ProgramDsl::mdrp(rp0: NE, p: NE): Statement`
  - `ProgramDsl::mirp(rp0: NE, p: NE, cv: NPE): Statement`
  - `ProgramDsl::ip(rp1: NE, rp2: NE, ...p: NE[]): Statement`
  - `ProgramDsl::delta.p1(...a: [NE, NE][]): Statement`
  - `ProgramDsl::delta.p2(...a: [NE, NE][]): Statement`
  - `ProgramDsl::delta.p3(...a: [NE, NE][]): Statement`
  - `ProgramDsl::delta.c1(...a: [NPE, NE][]): Statement`
  - `ProgramDsl::delta.c2(...a: [NPE, NE][]): Statement`
  - `ProgramDsl::delta.c3(...a: [NPE, NE][]): Statement`
- Binary functions
  - `ProgramDsl::add(a: NE, b: NE): Expression`
  - `ProgramDsl::sub(a: NE, b: NE): Expression`
  - `ProgramDsl::mul(a: NE, b: NE): Expression`
  - `ProgramDsl::div(a: NE, b: NE): Expression`
  - `ProgramDsl::max(a: NE, b: NE): Expression`
  - `ProgramDsl::min(a: NE, b: NE): Expression`
  - `ProgramDsl::lt(a: NE, b: NE): Expression`
  - `ProgramDsl::lteq(a: NE, b: NE): Expression`
  - `ProgramDsl::gt(a: NE, b: NE): Expression`
  - `ProgramDsl::gteq(a: NE, b: NE): Expression`
  - `ProgramDsl::eq(a: NE, b: NE): Expression`
  - `ProgramDsl::neq(a: NE, b: NE): Expression`
  - `ProgramDsl::and(a: NE, b: NE): Expression`
  - `ProgramDsl::or(a: NE, b: NE): Expression`
- Unary functions
  - `ProgramDsl::abs(a: NE): Expression`
  - `ProgramDsl::neg(a: NE): Expression`
  - `ProgramDsl::floor(a: NE): Expression`
  - `ProgramDsl::ceiling(a: NE): Expression`
  - `ProgramDsl::even(a: NE): Expression`
  - `ProgramDsl::odd(a: NE): Expression`
  - `ProgramDsl::not(a: NE): Expression`
  - `ProgramDsl::round.gray(a: NE): Expression`
  - `ProgramDsl::round.black(a: NE): Expression`
  - `ProgramDsl::round.white(a: NE): Expression`
  - `ProgramDsl::round.mode3(a: NE): Expression`
  - `ProgramDsl::nRound.gray(a: NE): Expression`
  - `ProgramDsl::nRound.black(a: NE): Expression`
  - `ProgramDsl::nRound.white(a: NE): Expression`
  - `ProgramDsl::nRound.mode3(a: NE): Expression`
  - `ProgramDsl::getInfo(a: NE): Expression`
