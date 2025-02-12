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
    assert('type' in node, `Node must have 'type' property in ${context}`);

    switch (node.type) {
        case 'integer':
            assert(typeof node.value === 'number', `Integer node must have number value in ${context}`);
            break;
        case 'variable':
            assert(typeof node.name === 'string', `Variable node must have string name in ${context}`);
            break;
        case 'apply':
            assert('function' in node, `Apply node must have function property in ${context}`);
            assert('argument' in node, `Apply node must have argument property in ${context}`);
            validateNode(node.function, `${context}.function`);
            validateNode(node.argument, `${context}.argument`);
            break;
        case 'builtin':
            assert(typeof node.name === 'string', `Builtin node must have string name in ${context}`);
            break;
        case 'let':
            assert('name' in node, `Let node must have name property in ${context}`);
            assert('value' in node, `Let node must have value property in ${context}`);
            assert('body' in node, `Let node must have body property in ${context}`);
            validateNode(node.value, `${context}.value`);
            validateNode(node.body, `${context}.body`);
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
                type: "apply",
                function: {
                    type: "apply",
                    function: {
                        type: "builtin",
                        name: "int_add"
                    },
                    argument: left
                },
                argument: right
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
            type: "integer",
            value: parseInt(token.value)
        };
        return validateNode(node, 'number');
    },

    identifier: (token: { value: string }): ASTNode => {
        const node = {
            type: "variable",
            name: token.value
        };
        return validateNode(node, 'identifier');
    },

    letBinding: ([_let, name, _eq, value, then]: [any, { value: string }, any, ASTNode, ASTNode]): ASTNode => {
        const node = {
            type: "let",
            name: name.value,
            value: value,
            body: then
        };
        return validateNode(node, 'letBinding');
    }
};
