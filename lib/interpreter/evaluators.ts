import { Map, Stack } from "npm:immutable";
import { State, Closure, partial } from "./core-classes.ts";
import { Arg, Assign } from "./continuations.ts";
import { getVariable, cons, extend, select, tag, case_, nocases, perform, handle, builtin } from "./functions.ts";

interface Evaluator {
    evaluate(state: State, expression: any): void;
}

class VariableEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(getVariable(state.env, expression.name));
    }
}

class LambdaEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(new Closure(expression, state.env));
    }
}

class ApplyEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.push(new Arg(expression.argument, state.env));
        state.setExpression(expression.function);
    }
}

class LetEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.push(new Assign(expression.name, expression.then, state.env));
        state.setExpression(expression.value);
    }
}

class VacantEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.break = new Error("not implemented");
    }
}

class LiteralEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(expression.value);
    }
}

class TailEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(Stack());
    }
}

class ConsEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(partial(expression, cons));
    }
}

class EmptyEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(Map());
    }
}

class ExtendEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(partial(expression, extend(expression.name)));
    }
}

class SelectEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(partial(expression, select(expression.name)));
    }
}

class TagEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(partial(expression, tag(expression.name)));
    }
}

class CaseEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(partial(expression, case_(expression.name)));
    }
}

class NoCasesEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(partial(expression, nocases));
    }
}

class PerformEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(partial(expression, perform(expression.name)));
    }
}

class HandleEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(partial(expression, handle(expression.name)));
    }
}

class BuiltinEvaluator implements Evaluator {
    evaluate(state: State, expression: any): void {
        state.setValue(partial(expression, builtin(expression.name)));
    }
}

const evaluators: Map<string, Evaluator> = Map({
    "variable": new VariableEvaluator(),
    "lambda": new LambdaEvaluator(),
    "apply": new ApplyEvaluator(),
    "let": new LetEvaluator(),
    "vacant": new VacantEvaluator(),
    "integer": new LiteralEvaluator(),
    "string": new LiteralEvaluator(),
    "tail": new TailEvaluator(),
    "cons": new ConsEvaluator(),
    "empty": new EmptyEvaluator(),
    "extend": new ExtendEvaluator(),
    "overwrite": new ExtendEvaluator(),
    "select": new SelectEvaluator(),
    "tag": new TagEvaluator(),
    "case": new CaseEvaluator(),
    "nocases": new NoCasesEvaluator(),
    "perform": new PerformEvaluator(),
    "handle": new HandleEvaluator(),
    "builtin": new BuiltinEvaluator()
});

export function evaluate(state: State, expression: any): void {
    const evaluator = evaluators.get(expression.type);
    if (!evaluator) {
        state.break = new Error("unrecognised expression");
        return;
    }
    evaluator.evaluate(state, expression);
}
