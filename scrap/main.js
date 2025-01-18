
import State from './interpreter.js';

const addExample = {
  "0": "a",        // apply
  "f": {           // function (add)
    "0": "b",      // builtin
    "l": "int_add" // builtin function name
  },
  "a": {           // first argument
    "0": "i",      // integer
    "v": 2         // value
  }
};

let state = new State(addExample);

const debug = state.getDebug();

console.log(debug);

state.eval();

console.log(state.getDebug());