# eyg experiment

i'm trying to understand eyg. https://github.com/CrowdHailer/eyg-lang

it's a language / ast that seems really
interesting.

## my understanding so far

the insight peter, the creator, mentioned
is that the abstract syntax tree is the
most important part of a language. in fact,
it's not correct to even call it a 'language'
- you can have multiple languages that create
the same ast.

and what i'm trying to understand is how ...
an ast, like the one he has produced ...
(i put the spec into `docs/eyg_spec.md`)
does what it can do ... really narly
functional haskell-esque stuff ...

so i'm just ... using claude.ai to try to ...
work through carefully, what is this thing,
how does it work ... i'm watching youtube
videos on ast's ... parsers ... it's difficult,
trying to understand the interpreter peter
wrote (i put that into `lib/interpreter.js`) ...
man, it's been tough.

but here is what i get so far ...

### what is an ast

well you can look it up, but in eyg's case
it really is a tree - a root node, which
has children, and those children have children.
that's it.

now if you think about it ... that's kind
of wild. think about it - how on earth would
you represent this:

```js
let x = 10
let y = x * 2
print(`y = ${y}`)
```

as a tree?

pretty much all the ast tutorials you see
just use the example of `x + 2 * y` or
sometimes `2 + 3 * 4` and, ok, that's
a tree: `+` is at the root, and on the
left down it's `2` and on the right
down it's `*` with children `3` and `4`.
fine.

but `let ...` ?

### value and expression

the interpreter peter wrote does something
quite remarkable ... take a look at this
part:

```js
step() {
    this.value ? this.apply() : this.eval();
}
```

that's how you step through the ast,
evaluating it ... that's ... it? i mean,
huh? what does _apply_ mean? eval i 
get ...

after much discussing with claude it's
quite profound - apply means 'i have
a value' and eval means 'i have an
expression'. and ... well, everything
either is a value or an expression ...
and all expressions become values ...

i'm sure a lot of functional people know
this but ... running a program ... is just ...
reducing it to a value ... that's it,
that's what you are doing - expressions,
and the whole program is just a big
expression, all reduce to values ...
a value is just an expression that cannot
be reduced ... i think ...

i'm suddenly realising this is not going
to mean much to anyone ...

### tokenizer and parser

ok this one is easier to understand - 
all software, whether interpreted
or compiled, goes through two main
steps - a tokenizer, and a parser.
the tokenizer is pretty basic, it's
not that smart at all. it just produces
a list of tokens, that's it. and tokens
are really basic. it's like, number,
or, open brackets. all done with regex.

the parser is the hard part - it takes
a list of tokens (and that's it)
and produces the ast.

then once you have the ast, well ... then
you can do a lot - convert it to another
language, run it, compile it to machine
code ... analyse it ... use it for
syntax highlighting, code analysis ...
stuff like "hey the types here don't
match!", tie that into vs code ...
get a pop-up that shows these errors ...
it's amazing.

i've made a start (using claude) of
these in `lib/tokenzier.js` and
`lib/parser.js`

## grammar rules

1. simple number `42`

```
program
└── expression
    └── atomic
        └── number
            └── 42
```

2. Addition `2+3`

```
program
└── expression
    └── additive
        ├── atomic
        │   └── number
        │       └── 2
        ├── PLUS
        └── expression
            └── atomic
                └── number
                    └── 3
```

3. Let binding `let x = 5\nx+3`

```
program
└── expression
    └── atomic
        └── letBinding
            ├── LET
            ├── identifier (x)
            ├── EQUALS
            ├── expression
            │   └── atomic
            │       └── number
            │           └── 5
            ├── NEWLINE
            └── expression
                └── additive
                    ├── atomic
                    │   └── identifier
                    │       └── x
                    ├── PLUS
                    └── expression
                        └── atomic
                            └── number
                                └── 3
```