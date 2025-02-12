import { Map, Stack } from "npm:immutable";
import { State, Tagged, Effect, Resume, Partial, partial } from "./core-classes.ts";
import { Delimit, Continuation, Call } from "./continuations.ts";

export function getVariable(env: Map<string, any>, label: string): any {
    let value = env.get(label);
    if (value === undefined) throw new Error("missing variable: " + label);
    return value;
}

export function cons(this: State, item: any, tail: Stack<any>): void {
    this.setValue(tail.push(item));
}

export function extend(label: string) {
    return function(this: State, value: any, rest: Map<string, any>): void {
        this.setValue(rest.set(label, value));
    }
}

export function select(label: string) {
    return function(this: State, record: Map<string, any>): void {
        let value = record.get(label);
        if (value === undefined) this.break = new Error("missing label: " + label);
        this.setValue(value);
    }
}

export function tag(label: string) {
    return function(this: State, value: any): void {
        this.setValue(new Tagged(label, value));
    }
}

export function case_(label: string) {
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

export function nocases(this: State, value: any): void {
    console.log(value);
    this.break = new Error("no cases matched");
}

export function perform(label: string) {
    return function(this: State, lift: any): void {
        let stack = this.stack;
        let reversed = Stack<Continuation>();
        let found: Delimit | undefined;
        while (stack.size > 0) {
            let kont = stack.first();
            stack = stack.pop();
            if (kont !== undefined) {
                reversed = reversed.push(kont);
                if (kont instanceof Delimit && kont.label === label) {
                    found = kont;
                    break;
                }
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

export function handle(label: string) {
    return function(this: State, handle: any, exec: any): void {
        this.push(new Delimit(label, handle));
        this.call(exec, Map());
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

export function builtin(identifier: string): Function {
    let value = builtins[identifier];
    if (value === undefined) throw new Error("unknown builtin: " + identifier);
    return value;
}
