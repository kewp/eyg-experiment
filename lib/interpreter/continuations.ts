import { Map, Stack } from "npm:immutable";

export class Arg {
    arg: any;
    env: Map<string, any>;

    constructor(arg: any, env: Map<string, any>) {
        this.arg = arg;
        this.env = env;
    }
}

export class Apply {
    func: any;

    constructor(func: any) {
        this.func = func;
    }
}

export class Call {
    arg: any;

    constructor(arg: any) {
        this.arg = arg;
    }
}

export class Assign {
    label: string;
    then: any;
    env: Map<string, any>;

    constructor(label: string, then: any, env: Map<string, any>) {
        this.label = label;
        this.then = then;
        this.env = env;
    }
}

export class Delimit {
    label: string;
    handle: any;

    constructor(label: string, handle: any) {
        this.label = label;
        this.handle = handle;
    }
}

export type Continuation = Assign | Arg | Apply | Call | Delimit;
