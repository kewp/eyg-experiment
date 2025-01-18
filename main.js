import { Tokenizer } from './lib/tokenizer.js';
import { rules } from './languages/myeyg/tokens.js';
import { MyEYGParser } from './languages/myeyg/newparser.js';
import { eval_ } from './lib/interpreter.js';
import { debugNode, debugState } from './lib/debug.js';

function evaluate(code) {

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

const tests = [
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

        console.log('ERROR:', error.message);
        console.error(error);

    }

});