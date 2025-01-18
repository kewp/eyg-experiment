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
    // Newlines (handle both \n and \r\n)
    new TokenRule(/[\n\r]+/, TokenTypes.NEWLINE),

    // Whitespace (but not newlines)
    new TokenRule(/[ \t]+/, null),  // null means don't create a token

    // Numbers
    new TokenRule(/[0-9]+/, TokenTypes.NUMBER),

    // Identifiers and keywords
    new TokenRule(/[a-zA-Z_][a-zA-Z0-9_]*/, TokenTypes.IDENTIFIER, (value) => {
        // Special handling for keywords
        if (value === 'let') {
            return { type: TokenTypes.LET, value };
        }
        return { type: TokenTypes.IDENTIFIER, value };
    }),

    // Operators
    new TokenRule(/\+/, TokenTypes.PLUS),
    new TokenRule(/=/, TokenTypes.EQUALS),
];