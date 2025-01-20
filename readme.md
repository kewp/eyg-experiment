# eyg experiment

i'm trying to understand eyg. https://github.com/CrowdHailer/eyg-lang

it's a language / ast that seems really
interesting.

## edit 20 jan 2025

busy going through the video that started this off,
again https://www.youtube.com/watch?v=wuGx35UIKTk

it's an interview with kris jenkins and he asks
what the purpose of eyg is.

it seems to boil down to _effects_, and in particular,
being able to understand code and being able to say
"this code cannot access the network" or rather
"this _function_ cannot access the network.".

so as i understand it - eyg let's you, or rather
forces you, to specify for every function which
effects it has, or ... it knows that this piece of
code accesses the network, or accesses the console ...
and so it can see where in your program this _might_
occur ... bubbling up effects ...

my question is - why is this not already a thing?
can't existing languages and platforms do this?
it sounds so useful ...

### log messages

peter gives the example of log messages - if i see
a log message, let's say on the console, and i want
to know where it came from ... how do i do that?

well what if the language knew about accessing the
console ...

```js
function one() {
    console.log('error!')
}
function two() {
    return 1*2
}
function combined() {
    one();
    two();
}
```

we should know, in our editor, that `combined`
can log to the console! why can't we "mouse over"
(as peter says in the video) each function call / 
line of our program and see the effects!

of course, this would ... in javascript, say,
take a complete rewrite ... i think ... because
every library would have to declare what effects
it uses ...

although ... can't you just ... use the ast to
see what might happen?

### simple?

it seems like such a simple idea ... to just
know how each ... which parts of your code
go "outside" ... and to know how ... which means
having declared what "outside" means, like
"network access" or "file system" ...

and then, to go further, to abstract that away
and really make it simple ... to be able to
decide on your own set of "outside"s ... right?
it's so simple! aaah!

it's so elegant ... you have your core language ...
and then you just have a set of "things you can
do outside" ...

which makes this whole thing just super amazing -
you can define "platforms" (an idea from ...
can't remember his name, the big elm cheerleader
who's now furloughed this idea into his own
language, roc ...), where you just say "ok
these are the things you can do here" ...
and you can call them whatever you like!

> i ... i dunno, i just feel like ... this ...
> is such a profound and profoundly simple
> and obviously ... revolutionary way of looking
> at things / of writing code ... imagine if
> you had code libraries that said "hey i use
> this platform" which then specifies - ok,
> this have `console.log` and `fetch` ...
> _and_ you can see where it uses those, which
> function calls make use of them! which then
> bubbles through your code to show which parts
> of your code do them!

> or you could have another platform that's
> completely user defined like `user.update`
> or `account.get` ... !!! so you can then
> trace _those_ effects!

> ... this stuff makes me so excited, i can't
> even ...

## my understanding so far (previous readme)

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