import { Map, Stack } from "npm:immutable";
import { ASTNode } from "../grammar.ts";
import { Continuation, Arg, Apply, Call, Assign, Delimit } from "./continuations.ts";
import { DebugInfo } from "./types.ts";
import { getVariable, cons, extend, select, tag, case_, nocases, perform, handle, builtin } from "./functions.ts";

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
        let expression = this.control;
        switch (expression.type) {
            case "variable":
                this.setValue(getVariable(this.env, expression.name));
                break;
            case "lambda":
                this.setValue(new Closure(expression, this.env));
                break;
            case "apply":
                this.push(new Arg(expression.argument, this.env));
                this.setExpression(expression.function);
                break;
            case "let":
                this.push(new Assign(expression.name, expression.then, this.env));
                this.setExpression(expression.value);
                break;
            case "vacant":
                this.break = new Error("not implemented");
                break;
            case "integer":
                this.setValue(expression.value);
                break;
            case "string":
                this.setValue(expression.value);
                break;
            case "tail":
                this.setValue(Stack());
                break;
            case "cons":
                this.setValue(partial(expression, cons));
                break;
            case "empty":
                this.setValue(Map());
                break;
            case "extend":
            case "overwrite":
                this.setValue(partial(expression, extend(expression.name)));
                break;
            case "select":
                this.setValue(partial(expression, select(expression.name)));
                break;
            case "tag":
                this.setValue(partial(expression, tag(expression.name)));
                break;
            case "case":
                this.setValue(partial(expression, case_(expression.name)));
                break;
            case "nocases":
                this.setValue(partial(expression, nocases));
                break;
            case "perform":
                this.setValue(partial(expression, perform(expression.name)));
                break;
            case "handle":
                this.setValue(partial(expression, handle(expression.name)));
                break;
            case "builtin":
                this.setValue(partial(expression, builtin(expression.name)));
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
                this.env = closure.captured.set(closure.lambda.name, arg);
                this.setExpression(closure.lambda.then);
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
                    const kont = reversed.first();
                    if (kont !== undefined) {
                        this.push(kont);
                    }
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

export function eval_(src: ASTNode): State {
    let state = new State(src);
    state.loop();
    return state;
}
