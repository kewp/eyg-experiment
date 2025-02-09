import { Rule, Sequence, Alternative, Optional, Many, TokenPattern, ASTNode } from '../../lib/grammar.ts';
import { TokenTypes, TokenType } from './tokens.ts';

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error('Assertion failed: ' + message);
    }
}

// Validator for AST nodes
function validateNode(node: ASTNode, context: string): ASTNode {
    assert(node !== null, `Node cannot be null in ${context}`);
    assert(typeof node === 'object', `Node must be object in ${context}`);
    assert('0' in node, `Node must have '0' property in ${context}`);

    switch (node['0']) {
        case 'i':
            assert(typeof node.v === 'number', `Integer node must have number value in ${context}`);
            break;
        case 'v':
            assert(typeof node.l === 'string', `Variable node must have string name in ${context}`);
            break;
        case 'a':
            assert('f' in node, `Apply node must have f property in ${context}`);
            assert('a' in node, `Apply node must have a property in ${context}`);
            validateNode(node.f, `${context}.f`);
            validateNode(node.a, `${context}.a`);
            break;
        case 'b':
            assert(typeof node.l === 'string', `Builtin node must have string name in ${context}`);
            break;
        case 'l':
            assert('l' in node, `Let node must have l property in ${context}`);
            assert('v' in node, `Let node must have v property in ${context}`);
            assert('t' in node, `Let node must have t property in ${context}`);
            validateNode(node.v, `${context}.v`);
            validateNode(node.t, `${context}.t`);
            break;
    }
    return node;  // Return the node for chaining
}

// Define the grammar rules for MyEYG
export const rules: Rule[] = [
    new Rule('program',
        'expression'
    ),

    new Rule('expression',
        'additive'  // All expressions start as potential additive expressions
    ),

    new Rule('additive',
        new Alternative(
            new Sequence(
                'atomic',
                new TokenPattern(TokenTypes.PLUS),
                'additive'  // Allow chaining of additions
            ),
            'atomic'  // Base case - just an atomic expression
        )
    ),

    new Rule('atomic',
        new Alternative(
            'number',
            'identifier',
            'letBinding'
        )
    ),

    new Rule('number',
        new TokenPattern(TokenTypes.NUMBER)
    ),

    new Rule('identifier',
        new TokenPattern(TokenTypes.IDENTIFIER)
    ),

    new Rule('letBinding',
        new Sequence(
            new TokenPattern(TokenTypes.LET),
            new TokenPattern(TokenTypes.IDENTIFIER),
            new TokenPattern(TokenTypes.EQUALS),
            'expression',
            'expression'
        )
    )
];

// Define the semantic actions that convert parse trees to AST nodes
export const actions = {
    program: (expr: ASTNode): ASTNode => {
        return validateNode(expr, 'program');
    },

    expression: (expr: ASTNode): ASTNode => {
        return validateNode(expr, 'expression');
    },

    additive: (expr: ASTNode | [ASTNode, any, ASTNode]): ASTNode => {
        // If it's a sequence (addition), create an addition node
        if (Array.isArray(expr)) {
            const [left, _, right] = expr;
            const node = {
                "0": "a",
                "f": {
                    "0": "a",
                    "f": {
                        "0": "b",
                        "l": "int_add"
                    },
                    "a": left
                },
                "a": right
            };
            return validateNode(node, 'additive');
        }
        // Otherwise just pass through the atomic expression
        return validateNode(expr, 'additive');
    },

    atomic: (expr: ASTNode): ASTNode => {
        return validateNode(expr, 'atomic');
    },

    number: (token: { value: string }): ASTNode => {
        const node = {
            "0": "i",
            "v": parseInt(token.value)
        };
        return validateNode(node, 'number');
    },

    identifier: (token: { value: string }): ASTNode => {
        const node = {
            "0": "v",
            "l": token.value
        };
        return validateNode(node, 'identifier');
    },

    letBinding: ([_let, name, _eq, value, then]: [any, { value: string }, any, ASTNode, ASTNode]): ASTNode => {
        const node = {
            "0": "l",
            "l": name.value,
            "v": value,
            "t": then
        };
        return validateNode(node, 'letBinding');
    }
};
