// this is taken straight
// from https://github.com/CrowdHailer/eyg-lang/tree/main

import { Map, Stack } from "npm:immutable";
import { ASTNode } from "./grammar.ts";

// Node types
const VAR = "v"
const LAMBDA = "f"
const APPLY = "a"
const LET = "l"
const VACANT = "z"
const INT = "i"
const STRING = "s"
const TAIL = "ta"
const CONS = "c"
const EMPTY = "u"
const EXTEND = "e"
const SELECT = "g"
const OVERWRITE = "o"
const TAG = "t"
const CASE = "m"
const NOCASES = "n"
const PERFORM = "p"
const HANDLE = "h"
const BUILTIN = "b"

const tail = Stack()
const empty = Map()

interface DebugInfo {
    value: boolean;
    control: any;
    env: Map<string, any>;
    stack: Stack<Continuation>;
}

type Continuation = Assign | Arg | Apply | Call | Delimit;

export default class State {
    value: boolean = false;
    env: Map<string, any> = Map();
    stack: Stack<Continuation> = Stack();
    control: any;
    break?: Error;
    debug?: boolean;
    debugState?: (state: DebugInfo) => void;

    constructor(src: ASTNode) {
        this.control = src;
    }

    getDebug(): DebugInfo {
        return {
            value: this.value,
            control: this.control,
            env: this.env,
            stack: this.stack
        }
    }

    setValue(value: any): void {
        this.value = true;
        this.control = value;
    }

    setExpression(expression: any): void {
        this.value = false;
        this.control = expression;
    }

    push(kont: Continuation): void {
        this.stack = this.stack.push(kont);
    }

    step(): void {
        this.value ? this.apply() : this.eval();
    }

    eval(): void {
        let expression = this.control;
        switch (expression[0]) {
            case VAR:
                this.setValue(getVariable(this.env, expression.l));
                break;
            case LAMBDA:
                this.setValue(new Closure(expression, this.env));
                break;
            case APPLY:
                this.push(new Arg(expression.a, this.env));
                this.setExpression(expression.f);
                break;
            case LET:
                this.push(new Assign(expression.l, expression.t, this.env));
                this.setExpression(expression.v);
                break;
            case VACANT:
                this.break = new Error("not implemented");
                break;
            case INT:
                this.setValue(expression.v);
                break;
            case STRING:
                this.setValue(expression.v);
                break;
            case TAIL:
                this.setValue(tail);
                break;
            case CONS:
                this.setValue(partial(expression, cons));
                break;
            case EMPTY:
                this.setValue(empty);
                break;
            case EXTEND:
            case OVERWRITE:
                this.setValue(partial(expression, extend(expression.l)));
                break;
            case SELECT:
                this.setValue(partial(expression, select(expression.l)));
                break;
            case TAG:
                this.setValue(partial(expression, tag(expression.l)));
                break;
            case CASE:
                this.setValue(partial(expression, case_(expression.l)));
                break;
            case NOCASES:
                this.setValue(partial(expression, nocases));
                break;
            case PERFORM:
                this.setValue(partial(expression, perform(expression.l)));
                break;
            case HANDLE:
                this.setValue(partial(expression, handle(expression.l)));
                break;
            case BUILTIN:
                this.setValue(partial(expression, builtin(expression.l)));
                break;
            default:
                this.break = new Error("unrecognised expression");
        }
    }

    apply(): any {
        let value = this.control;
        let kont = this.stack.first();
        if (kont === undefined) return value;
        this.stack = this.stack.pop();

        switch (kont.constructor) {
            case Assign:
                const assign = kont as Assign;
                this.env = this.env.set(assign.label, value);
                this.setExpression(assign.then);
                break;
            case Arg:
                const arg = kont as Arg;
                this.push(new Apply(value));
                this.env = arg.env;
                this.setExpression(arg.arg);
                break;
            case Apply:
                const apply = kont as Apply;
                this.call(apply.func, value);
                break;
            case Call:
                const call = kont as Call;
                this.call(value, call.arg);
                break;
            case Delimit:
                break;
            default:
                this.break = new Error("invalid continuation popped from stack");
        }
    }

    call(func: Closure | Partial | Resume, arg: any): void {
        switch (func.constructor) {
            case Closure:
                const closure = func as Closure;
                this.env = closure.captured.set(closure.lambda.l, arg);
                this.setExpression(closure.lambda.b);
                break;
            case Partial:
                const partial = func as Partial;
                let applied = partial.applied.push(arg);

                if (applied.size === partial.impl.length) {
                    partial.impl.apply(this, applied.reverse().toArray());
                } else {
                    this.setValue(new Partial(partial.exp, applied, partial.impl));
                }
                break;
            case Resume:
                const resume = func as Resume;
                let reversed = resume.reversed;
                while (reversed.size > 0) {
                    this.push(reversed.first());
                    reversed = reversed.pop();
                }
                this.setValue(arg);
                break;
            default:
                console.log(func, "FUUNC");
                this.break = new Error("not a function");
        }
    }

    loop(): any {
        while (true) {
            this.step();
            if (this.break || (this.value && this.stack.size === 0)) return this.control;
        }
    }

    resume(value: any): void {
        this.setValue(value);
        this.break = undefined;
        this.loop();
    }
}

class Closure {
    lambda: any;
    captured: Map<string, any>;

    constructor(lambda: any, captured: Map<string, any>) {
        this.lambda = lambda;
        this.captured = captured;
    }
}

class Partial {
    exp: any;
    applied: Stack<any>;
    impl: Function;

    constructor(exp: any, applied: Stack<any>, impl: Function) {
        this.exp = exp;
        this.applied = applied;
        this.impl = impl;
    }
}

function partial(exp: any, impl: Function): Partial {
    return new Partial(exp, Stack(), impl);
}

export class Tagged {
    tag: string;
    inner: any;

    constructor(tag: string, inner: any) {
        this.tag = tag;
        this.inner = inner;
    }
}

class Resume {
    reversed: Stack<Continuation>;

    constructor(reversed: Stack<Continuation>) {
        this.reversed = reversed;
    }
}

class Arg {
    arg: any;
    env: Map<string, any>;

    constructor(arg: any, env: Map<string, any>) {
        this.arg = arg;
        this.env = env;
    }
}

class Apply {
    func: any;

    constructor(func: any) {
        this.func = func;
    }
}

class Call {
    arg: any;

    constructor(arg: any) {
        this.arg = arg;
    }
}

class Assign {
    label: string;
    then: any;
    env: Map<string, any>;

    constructor(label: string, then: any, env: Map<string, any>) {
        this.label = label;
        this.then = then;
        this.env = env;
    }
}

class Delimit {
    label: string;
    handle: any;

    constructor(label: string, handle: any) {
        this.label = label;
        this.handle = handle;
    }
}

export function eval_(src: ASTNode): State {
    let state = new State(src);
    state.loop();
    return state;
}

function getVariable(env: Map<string, any>, label: string): any {
    let value = env.get(label);
    if (value === undefined) throw new Error("missing variable: " + label);
    return value;
}

function cons(this: State, item: any, tail: Stack<any>): void {
    this.setValue(tail.push(item));
}

function extend(label: string) {
    return function(this: State, value: any, rest: Map<string, any>): void {
        this.setValue(rest.set(label, value));
    }
}

function select(label: string) {
    return function(this: State, record: Map<string, any>): void {
        let value = record.get(label);
        if (value === undefined) this.break = new Error("missing label: " + label);
        this.setValue(value);
    }
}

function tag(label: string) {
    return function(this: State, value: any): void {
        this.setValue(new Tagged(label, value));
    }
}

function case_(label: string) {
    return function(this: State, branch: any, otherwise: any, value: any): void {
        if (!(value instanceof Tagged)) this.break = new Error("Not a Tagged value");
        let { tag, inner } = value as Tagged;
        if (tag === label) {
            this.call(branch, inner);
        } else {
            this.call(otherwise, value);
        }
    }
}

function nocases(this: State, value: any): void {
    console.log(value);
    this.break = new Error("no cases matched");
}

function perform(label: string) {
    return function(this: State, lift: any): void {
        let stack = this.stack;
        let reversed = Stack<Continuation>();
        let found: Delimit | undefined;
        while (stack.size > 0) {
            let kont = stack.first();
            stack = stack.pop();
            reversed = reversed.push(kont);
            if (kont instanceof Delimit && kont.label === label) {
                found = kont;
                break;
            }
        }
        if (found) {
            this.stack = stack;
            this.push(new Call(new Resume(reversed)));
            this.call(found.handle, lift);
        } else {
            this.break = new Effect(label, lift);
        }
    }
}

export class Effect {
    label: string;
    lift: any;

    constructor(label: string, lift: any) {
        this.label = label;
        this.lift = lift;
    }
}

function handle(label: string) {
    return function(this: State, handle: any, exec: any): void {
        this.push(new Delimit(label, handle));
        this.call(exec, empty);
    }
}

interface Builtins {
    [key: string]: (this: State, ...args: any[]) => void;
}

const builtins: Builtins = {
    int_add(this: State, a: number, b: number): void { 
        this.setValue(a + b);
    },
    int_subtract(this: State, a: number, b: number): void { 
        this.setValue(a - b);
    }
}

function builtin(identifier: string): Function {
    let value = builtins[identifier];
    if (value === undefined) throw new Error("unknown builtin: " + identifier);
    return value;
}
