import { Tokenizer } from './lib/tokenizer.js';
import { rules } from './languages/myeyg/tokens.js';
import { MyEYGParser } from './languages/myeyg/parser.js';
import { eval_ } from './lib/interpreter.js';
import { debugNode, debugState } from './lib/debug.js';

function evaluate(code) {
  // Create language-specific tokenizer
  const tokenizer = new Tokenizer(rules);
  
  // Create language-specific parser
  const parser = new MyEYGParser();
  
  console.log('  Input:', code);
//   console.log('-'.repeat(50));
  
  // Tokenize
  const tokens = tokenizer.tokenize(code);
//   console.log('Tokens:', JSON.stringify(tokens, null, 2));
  
  // Parse
  console.log('  Parsing...');
  const ast = parser.parse(tokens);
//   console.log('\nFinal AST:');
//   debugNode(ast);
  
  // Evaluate step by step
  console.log('  Evaluating...');
  const state = eval_(ast);
  
  // Show state at each evaluation step
  state.debug = true;  // Enable debug mode in interpreter
  state.debugState = debugState;  // Provide debug function
  
  return state.control;
}

// Test cases
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

// Run tests
tests.forEach((test) => {
//   console.log('\n='.repeat(50));
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