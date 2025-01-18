import { Parser } from '../../lib/parser.js';
import { TokenTypes } from './tokens.js';
import { nodeTypes } from './nodes.js';
import { debugNode } from '../../lib/debug.js';

export class MyEYGParser extends Parser {
  constructor() {
    super(nodeTypes);
  }
  
  parseNode() {
    // Skip newlines at start
    while (this.peek()?.type === TokenTypes.NEWLINE) {
      this.next();
    }
    
    const token = this.peek();
    if (!token) return null;
    
    let node;
    switch (token.type) {
      case TokenTypes.NUMBER:
        node = this.parseNumber();
        break;
      case TokenTypes.IDENTIFIER:
        node = this.parseIdentifier();
        break;
      case TokenTypes.LET:
        node = this.parseLet();
        break;
      default:
        throw new Error(`Unexpected token: ${token.type}`);
    }
    
    // console.log('\nParsed node:');
    // debugNode(node);
    return node;
  }
  
  parseNumber() {
    const token = this.next();
    const node = this.createNode('i', { value: parseInt(token.value) });
    return this.parseInfixOperator(node);
  }
  
  parseIdentifier() {
    const token = this.next();
    const node = this.createNode('v', { name: token.value });
    return this.parseInfixOperator(node);
  }
  
  parseLet() {
    this.next(); // consume 'let'
    
    const nameToken = this.next();
    if (nameToken.type !== TokenTypes.IDENTIFIER) {
      throw new Error('Expected identifier after let');
    }
    
    const equalsToken = this.next();
    if (equalsToken.type !== TokenTypes.EQUALS) {
      throw new Error('Expected = after variable name');
    }
    
    const value = this.parseNode();
    
    // Skip newlines
    while (this.peek()?.type === TokenTypes.NEWLINE) {
      this.next();
    }
    
    const then = this.parseNode();
    
    return this.createNode('l', {
      name: nameToken.value,
      value,
      then
    });
  }
  
  parseInfixOperator(left) {
    // Skip newlines
    while (this.peek()?.type === TokenTypes.NEWLINE) {
      this.next();
    }
    
    const token = this.peek();
    if (!token || token.type !== TokenTypes.PLUS) {
      return left;
    }
    
    // Consume the plus
    this.next();
    
    // Get right operand
    const right = this.parseNode();
    
    // Build addition node correctly this time:
    // For a + b, we want:
    // { "0": "a", f: { "0": "a", f: { "0": "b", l: "int_add" }, a: a }, a: b }
    const addFunc = this.createNode('b', { name: 'int_add' });
    
    // First apply: int_add to left argument
    const firstApply = this.createNode('a', {
      func: addFunc,
      arg: left
    });
    
    // Second apply: result to right argument
    const node = this.createNode('a', {
      func: firstApply,
      arg: right
    });
    
    // console.log('\nBuilt addition node:');
    // debugNode(node);
    
    return node;
  }
}