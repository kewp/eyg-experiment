import { Rule, Sequence, Alternative, Optional, Many, Token } from '../../lib/grammar.js';
import { TokenTypes } from './tokens.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error('Assertion failed: ' + message);
    }
}

// Validator for AST nodes
function validateNode(node, context) {
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
export const rules = [
    new Rule('program',
        'expression'
    ),

    new Rule('expression',
        new Alternative(
            'additive',
            'atomic'
        )
    ),

    new Rule('additive',
        new Sequence(
            'atomic',
            new Token(TokenTypes.PLUS),
            'expression'
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
        new Token(TokenTypes.NUMBER)
    ),

    new Rule('identifier',
        new Token(TokenTypes.IDENTIFIER)
    ),

    new Rule('letBinding',
        new Sequence(
            new Token(TokenTypes.LET),
            new Token(TokenTypes.IDENTIFIER),
            new Token(TokenTypes.EQUALS),
            'expression',
            new Many(new Token(TokenTypes.NEWLINE)),
            'expression'
        )
    )
];

// Define the semantic actions that convert parse trees to AST nodes
export const actions = {
    program: (expr) => {
        return validateNode(expr, 'program');
    },

    expression: (expr) => {
        return validateNode(expr, 'expression');
    },

    additive: ([left, _, right]) => {
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
    },

    atomic: (expr) => {
        return validateNode(expr, 'atomic');
    },

    number: (token) => {
        const node = {
            "0": "i",
            "v": parseInt(token.value)
        };
        return validateNode(node, 'number');
    },

    identifier: (token) => {
        const node = {
            "0": "v",
            "l": token.value
        };
        return validateNode(node, 'identifier');
    },

    letBinding: ([_let, name, _eq, value, _nl, then]) => {
        const node = {
            "0": "l",
            "l": name.value,
            "v": value,
            "t": then
        };
        return validateNode(node, 'letBinding');
    }
};