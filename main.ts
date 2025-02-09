import { Tokenizer } from './lib/tokenizer.ts';
import { rules } from './languages/myeyg/tokens.ts';
import { MyEYGParser } from './languages/myeyg/newparser.ts';
import { eval_ } from './lib/interpreter.ts';
import { debugNode, debugState } from './lib/debug.ts';
import { ASTNode } from './lib/grammar.ts';

interface Test {
    name: string;
    code: string;
    expected: number;
}

function evaluate(code: string): any {
    const debug = true;

    const tokenizer = new Tokenizer(rules);
    const parser = new MyEYGParser(debug);

    console.log('  Input:', code);
    const tokens = tokenizer.tokenize(code);

    console.log('  Parsing...');
    const ast = parser.parse(tokens);

    console.log('  Evaluating...');
    const state = eval_(ast);

    state.debug = debug;  // Enable debug mode in interpreter
    state.debugState = debugState;  // Provide debug function

    return state.control;
}

const tests: Test[] = [
    {
        name: "Simple number",
        code: "42",
        expected: 42
    },
    {
        name: "Addition",
        code: "2 + 3",
        expected: 5
    },
    {
        name: "Let binding",
        code: `let x = 5
           x + 3`,
        expected: 8
    }
];

tests.forEach((test) => {
    console.log(`\nTesting: ${test.name}`);

    try {
        const result = evaluate(test.code);
        console.log('  Result:', result);
        console.log('  Expected:', test.expected);
        console.log(result === test.expected ? '  PASSED ✅' : '  FAILED ❌');
    } catch (error) {
        console.log('ERROR:', error instanceof Error ? error.message : String(error));
        console.error(error);
    }
});
