import { TokenRule } from '../../lib/tokenizer.js';

// Token types
export const TokenTypes = {
  NUMBER: 'number',
  PLUS: 'plus',
  IDENTIFIER: 'identifier',
  EQUALS: 'equals',
  LET: 'let',
  NEWLINE: 'newline'
};

// Token rules for MyEYG language
export const rules = [
  // Newlines
  new TokenRule(/\n/, TokenTypes.NEWLINE),
  
  // Numbers
  new TokenRule(/[0-9]/, TokenTypes.NUMBER),
  
  // Identifiers and keywords
  new TokenRule(/[a-zA-Z_]/, TokenTypes.IDENTIFIER, (value) => {
    // Special handling for keywords
    if (value === 'let') {
      return { type: TokenTypes.LET, value };
    }
    return { type: TokenTypes.IDENTIFIER, value };
  }),
  
  // Operators
  new TokenRule(/\+/, TokenTypes.PLUS),
  new TokenRule(/=/, TokenTypes.EQUALS)
];