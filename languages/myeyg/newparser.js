import { Grammar } from '../../lib/grammar.js';
import { rules, actions } from './grammar.js';

export class MyEYGParser {
  constructor(debug=false) {
    this.grammar = new Grammar(rules, actions, debug);
  }
  
  parse(tokens) {
    return this.grammar.parse(tokens);
  }
}