// Our simple AST will only handle:
// - Numbers (like 2, 3)
// - Addition (like 2 + 3)

class State {
    constructor(expression) {
        this.value = false;         // Are we in value mode?
        this.control = expression;  // Current expression we're evaluating
        this.stack = [];           // Stack of things to do next
    }

    // For debugging - show current state
    debug() {
        console.log({
            value: this.value,
            control: this.control,
            stack: this.stack
        });
    }

    // Main evaluation step
    step() {
        if (this.value) {
            // We have a value, use it
            console.log('step: we have a value', this.value, 'applying');
            this.apply();
        } else {
            console.log('step: we have an expression', this.control, 'evaluating');
            // We have an expression, evaluate it
            this.eval();
        }
    }

    // Evaluate an expression
    eval() {
        const expression = this.control;

        // What kind of expression is it?
        switch (expression.type) {
            case "number":
                // Just return the number as a value
                this.value = true;
                this.control = expression.value;
                break;

            case "add":
                // Push argument to stack and evaluate function
                this.stack.push({
                    type: "arg",
                    arg: expression.right  // Remember right argument
                });
                this.control = expression.left;  // Evaluate left argument first
                break;
        }
    }

    // Apply a value
    apply() {
        const value = this.control;  // Current value

        // Nothing left to do?
        if (this.stack.length === 0) {
            return;
        }

        // Get next thing to do
        const next = this.stack.pop();

        switch (next.type) {
            case "arg":
                // We have first value, remember it and evaluate argument
                this.stack.push({
                    type: "add",
                    left: value
                });
                this.value = false;
                this.control = next.arg;
                break;

            case "add":
                // We have both values, add them
                this.control = next.left + value;
                break;
        }
    }

    // Run until we're done
    run() {
        while (true) {
            this.debug();

            // Are we done? (Have a value and nothing left to do)
            if (this.value && this.stack.length === 0) {
                return this.control;
            }

            this.step();
        }
    }
}

// Helper to create number expressions
function number(n) {
    return { type: "number", value: n };
}

// Helper to create add expressions
function add(left, right) {
    return { type: "add", left, right };
}

// Let's try it with 2 + 3
const expression = add(number(2), number(3));
const state = new State(expression);
console.log("Final result:", state.run());