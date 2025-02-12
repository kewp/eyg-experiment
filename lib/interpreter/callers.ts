import { Map } from "npm:immutable";
import { State, Closure, Partial, Resume } from "./core-classes.ts";

export interface Caller {
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
const callers: Map<string, Caller> = Map({
    'Closure': new ClosureCaller(),
    'Partial': new PartialCaller(),
    'Resume': new ResumeCaller()
});

export function callFunction(state: State, func: Closure | Partial | Resume, arg: any): void {
    const caller = callers.get(func.constructor.name);
    if (!caller) {
        console.log(func, "FUUNC");
        state.break = new Error("not a function");
        return;
    }
    caller.call(state, func, arg);
}
