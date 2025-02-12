import { Map, Stack } from "npm:immutable";
import { ASTNode } from "../grammar.ts";
import { Continuation, Arg, Apply, Call, Assign, Delimit } from "./continuations.ts";
import { DebugInfo } from "./types.ts";
import { evaluate } from "./evaluators.ts";

interface Caller {
    call(state: State, func: any, arg: any): void;
}

class ClosureCaller implements Caller {
    call(state: State, func: Closure, arg: any): void {
        state.env = func.captured.set(func.lambda.name, arg);
        state.setExpression(func.lambda.then);
    }
}

class PartialCaller implements Caller {
    call(state: State, func: Partial, arg: any): void {
        let applied = func.applied.push(arg);

        if (applied.size === func.impl.length) {
            func.impl.apply(state, applied.reverse().toArray());
        } else {
            state.setValue(new Partial(func.exp, applied, func.impl));
        }
    }
}

class ResumeCaller implements Caller {
    call(state: State, func: Resume, arg: any): void {
        let reversed = func.reversed;
        while (reversed.size > 0) {
            const kont = reversed.first();
            if (kont !== undefined) {
                state.push(kont);
            }
            reversed = reversed.pop();
        }
        state.setValue(arg);
    }
}

// Create callers map after all classes are defined
const callers: Map<string, Caller> = Map<string, Caller>().withMutations(map => {
    map.set('Closure', new ClosureCaller());
    map.set('Partial', new PartialCaller());
    map.set('Resume', new ResumeCaller());
});

export class Closure {
    lambda: any;
    captured: Map<string, any>;

    constructor(lambda: any, captured: Map<string, any>) {
        this.lambda = lambda;
        this.captured = captured;
    }
}

export class Partial {
    exp: any;
    applied: Stack<any>;
    impl: Function;

    constructor(exp: any, applied: Stack<any>, impl: Function) {
        this.exp = exp;
        this.applied = applied;
        this.impl = impl;
    }
}

export function partial(exp: any, impl: Function): Partial {
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

export class Resume {
    reversed: Stack<Continuation>;

    constructor(reversed: Stack<Continuation>) {
        this.reversed = reversed;
    }
}

export class Effect extends Error {
    label: string;
    lift: any;

    constructor(label: string, lift: any) {
        super(`Effect: ${label}`);
        this.label = label;
        this.lift = lift;
    }
}

export class State {
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
        evaluate(this, this.control);
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
        const caller = callers.get(func.constructor.name);
        if (!caller) {
            console.log(func, "FUUNC");
            this.break = new Error("not a function");
            return;
        }
        caller.call(this, func, arg);
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

export function eval_(src: ASTNode): State {
    let state = new State(src);
    state.loop();
    return state;
}
