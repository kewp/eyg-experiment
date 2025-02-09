import { Grammar } from '../../lib/grammar.ts';
import { rules, actions } from './grammar.ts';
import { Token } from '../../lib/tokenizer.ts';
import { ASTNode } from '../../lib/grammar.ts';

export class MyEYGParser {
  private grammar: Grammar;
  
  constructor(debug: boolean = false) {
    this.grammar = new Grammar(rules, actions, debug);
  }
  
  parse(tokens: Token[]): ASTNode {
    return this.grammar.parse(tokens);
  }
}
