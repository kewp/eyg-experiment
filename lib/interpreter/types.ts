import { Map, Stack } from "npm:immutable";
import { Continuation } from "./continuations.ts";

// Node types - using descriptive names
export const VARIABLE = "variable"
export const LAMBDA = "lambda"
export const APPLY = "apply"
export const LET = "let"
export const VACANT = "vacant"
export const INTEGER = "integer"
export const STRING = "string"
export const TAIL = "tail"
export const CONS = "cons"
export const EMPTY = "empty"
export const EXTEND = "extend"
export const SELECT = "select"
export const OVERWRITE = "overwrite"
export const TAG = "tag"
export const CASE = "case"
export const NOCASES = "nocases"
export const PERFORM = "perform"
export const HANDLE = "handle"
export const BUILTIN = "builtin"

export const tail = Stack()
export const empty = Map()

export interface DebugInfo {
    value: boolean;
    control: any;
    env: Map<string, any>;
    stack: Stack<Continuation>;
}
