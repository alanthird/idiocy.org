"use strict";

function lexer(input) {
  let pos = 0

  /* A couple of functions to help us grab the characters. */
  function next() {
    if (pos < input.length) {
      return input.charAt(pos++)
    }
    return null
  }

  function rewind() {
    pos--
  }

  /* Return a string.
   *
   * Strings are special because they can contain pretty much anything
   * except a double quote, so we can't break them on spaces. */
  function string() {
    let token = next()
    let c

    while ((c = next()) != null) {
      if (c == '"') {
        return token + c
      }
      // else
      token = token + c
    }

    /* If we get this far then the string wasn't terminated. I'll let
     * it slide this time. */
    return token
  }

  /* I've called this symbol, but it's actually anything that's not a
   * string or a bracket. */
  function symbol() {
    let token = ""
    let c

    while ((c = next()) != null) {
      /* Check that the character isn't whitespace or a closing
       * bracket. */
      if (/[\s\)]/.test(c)) {
        /* This character isn’t part of the token, so wind it back
         * into the input. */
        rewind()
        return token
      }
      // else
      token = token + c
    }

    /* Again, if we get here we've reached the end of the input. */
    return token
  }

  /* This is the main function. */
  return function() {
    let c

    while ((c = next()) != null) {
      if (/\s/.test(c)) {
        /* Whitespace, we don't care about this, so skip back to the
         * start of the loop. */
        continue
      }

      if (c == '"') {
        // It's a string!
        rewind()
        return string()
      }

      /* If it's a bracket, just return it as-is. */
      if (c == '(' || c == ')') {
        return c
      }

      /* It must be a symbol of some sort. We need to rewind otherwise
       * the first character will get lost. */
      rewind()
      return symbol()
    }

    // End of input.
    return null;
  }
}

/* Pass in a tokenizer function. */
function parser(nextToken) {
  function string(token) {
    /* Strip the quotes off. */
    return token.replace(/^"|"$/g, '')
  }

  function symbol(token) {
    return Symbol.for(token)
  }

  function number(token) {
    return parseInt(token, 10)
  }

  function list() {
    let val
    const list = []

    /* Parse each item in the list and put the result into the
     * array. */
    while ((val = parser(nextToken)) != null) {
      list.push(val)
    }

    return list
  }

  const t = nextToken()

  /* If the token is null we’ve reached the end of input. */
  if (t === null) {
    return null
  }

  const first = t.charAt(0)

  if (first == '(') {
    /* It's a list! */
    return list()
  }
  else if (first == ')') {
    /* End of the current list, so return null. */
    return null
  }
  else if (/\d/.test(first)) {
    /* Congratulations, it's a number! */
    return number(t) 
  }
  else if (first == '"') {
    /* And a string. */
    return string(t)
  }
  // else
  return symbol(t)
}

/* Make a new environment object. */
function newEnvironment(parent) {
  const e = {}
  e.parent = parent
  return e
}

/* A helper function for defining lisp variables. */
function lispDefine(env, name, value) {
  if (typeof name === "string") {
    env[Symbol.for(name)] = value
  }
  else if (typeof name === "symbol") {
    env[name] = value
  }
  else {
    throw "DEFINE: Unexpected type '" + typeof name
          + "' for '" + name + "'!"
  }
}

function lookupVariable(env, name) {
  if (env.hasOwnProperty(name)) {
    return env[name]
  }
  else if (env.parent !== null) {
    /* Look it up in the parent environment. */
    return lookupVariable(env.parent, name)
  }
  else {
    throw "LOOKUP: Unknown variable '" + Symbol.keyFor(name) + "'!"
  }
}

const global = newEnvironment(null)

function lambda(env, argnames, body) {
  return function(...args) {
    /* We need to build up a stack frame for this function where we
     * store local variables, eg. the arguments. */
    const localEnv = newEnvironment(env)

    args.forEach((a, i) => lispDefine(localEnv, argnames[i], a))
    /* And eval each expression in the body with our new environment.
     *
     * TODO: add a begin function and use it here. */
    return body.reduce((c, s) => lispEval(localEnv, s), null)
  }
}

function lispIf(env, args) {
  /* Test argument 0 and evaluate argument 1 or 2 as appropriate. */
  if (lispEval(env, args[0])) {
    return lispEval(env, args[1])
  }
  // else
  return lispEval(env, args[2])
}

function lispApply(env, f, args) {
  if (typeof f !== "function") {
    throw "APPLY: Unknown function!"
  }

  const a = args.map((a) => lispEval(env, a))
  return f.apply(null, a)
}

function lispEval(env, item) {
  if (typeof item === "symbol") {
    return lookupVariable(env, item)
  }
  else if (Array.isArray(item)) {
    /* Check if the function is an "if". */
    if (item[0] === Symbol.for('if')) {
      return lispIf(env, item.slice(1))
    }
    /* Or a "define". */
    else if (item[0] === Symbol.for('define')) {
      lispDefine(env, item[1], lispEval(env, item[2]))
    }
    /* Or "lambda"... */
    else if (item[0] === Symbol.for('lambda')) {
      return lambda(env, item[1], item.slice(2))
    }
    /* Or "quote". (Return the argument unmodified.) */
    else if (item[0] === Symbol.for('quote')) {
      return item[1]
    }
    else {
      /* We must always eval the function name element of the array as
       * we have no guarantee it's a function. */
      const f = lispEval(env, item[0])

      try {
        return lispApply(env, f, item.slice(1))
      }
      catch(err) {
        throw err + "\nEVAL: Calling '" + JSON.stringify(item[0]) + "'"
      }
    }
  }
  else {
    return item
  }
}

lispDefine(global, '+', (...args) => args.reduce((c, n) => c + n))
lispDefine(global, '-', (...args) => args.reduce((c, n) => c - n))
lispDefine(global, '*', (...args) => args.reduce((c, n) => c * n))
lispDefine(global, '/', (...args) => args.reduce((c, n) => c / n))
lispDefine(global, '=', function(...args) {
  return args.reduce((carry, x) => carry & (args[0] === x), true)
})
lispDefine(global, '>', (a, b) => a > b)
lispDefine(global, '%', (a, b) => a % b)

/* Arrays */
lispDefine(global, 'first', l => l[0])
lispDefine(global, 'rest',  l => l.slice(1))
lispDefine(global, 'push',  (l, i) => l.push(i))
lispDefine(global, 'pop',   l => l.pop())
lispDefine(global, 'unshift', (l, i) => l.unshift(i))
lispDefine(global, 'shift', l => l.shift())
lispDefine(global, 'array-ref', (l, i) => l[i])
lispDefine(global, 'concat', (l, i) => l.concat(i))

lispDefine(global, 'map', (f, l) => l.map(f))
lispDefine(global, 'reduce', (f, l, init) => l.reduce(f, init))

/* Strings */
lispDefine(global, 'split', (s, c) => s.split(c))

lispDefine(global, 'and', (...args) => args.reduce((a, b) => a && b))
lispDefine(global, 'or',  (...args) => args.reduce((a, b) => a || b))
lispDefine(global, 'not', p => !p)

lispDefine(global, 'null', null)
lispDefine(global, 'get-js-context', name => window[name])

const input = document.getElementById('input')
const output = document.getElementById('output')

/* Define a new display function for output. */
function display(...args) {
  const str = document.createTextNode(args.join(' ') + '\n')
  output.appendChild(str)

  /* Scroll to bottom of output when we write to it. */
  output.scrollTop = output.scrollHeight
}

lispDefine(global, 'display', display)

function lisp(input) {
  let sexp
  let result

  let l = lexer(input)

  try {
    while ((sexp = parser(l)) != null) {
      result = lispEval(global, sexp)
    }
  }
  catch (err) {
    display(err)
    return
  }

  if (result !== undefined) {
    display('=> ' + JSON.stringify(result))
  }
}

lisp(`
  (define < (lambda (a b) (> b a)))
  (define <= (lambda (a b) (or (< a b) (= a b))))
  (define >= (lambda (a b) (or (> a b) (= a b))))
  
  (define cons
    (lambda (a b)
      (define l (concat (quote ()) a))
      (push l b)
      l))
  (define car (lambda (l) (first l)))
  (define cdr (lambda (l) (array-ref l 1)))
  
  (display "A Metacircular-Evaluator written in JavaScript")
  (display "© 2016 Alan Third")
  (display "")
`)

let codeEditor = CodeMirror.fromTextArea(input, { theme: "zenburn" });

document.getElementById('runIt').addEventListener('click', function(event) {
  lisp(codeEditor.getValue())
})
