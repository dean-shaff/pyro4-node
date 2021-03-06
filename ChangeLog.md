### v1.2.0

- Got rid of custom logging.js, instead opting for `winston`.
- Got rid of `py-format` dependency, instead opting for ecmascript 2015 string
formatting: `var name = "Dean"; console.log(`My name is ${name}`)`.
- Switched to ecmascript 2015 classes instead of traditional prototypes.
- Simplified `Proxy` code. Explicitly using a Queue (just an `Array` I use
    in a specific manner), and got rid of remoteMethodCall object that was present
    in v1.0.0.
- Added `locateNS` function.
- Instead of trying to do synchronous function calls, dived direct into
asynchronous, by using `handler` arguments for `remoteMethod` calls.  
- Added `configuration.js` that specifies the loglevel for each of the modules.

### v1.3.0

- Support for recursive calls to `Proxy` functions.
- Added "batched" calls which all use the same client connection, instead of
recreating the connection between each call.
- Added some basic error handling. Still can't really identify when the user
has correct host/port/objName.

### v2.0.0

- using Promises instead of callbacks. Making heavy use of async functions and await statements. Proxy code is much easier to read.
- Message class uses async methods.
- implemented URIs. Proxy instances take URIs.
- added mocha tests
- updated examples to reflect API changes.
- basic_pyro4_example.py now has oneway methods and a few properties to play around with.

### v2.1.0

- Implemented my own PromiseSocket class that essentially does the same thing that
the npm promise-socket does in the context of this library.
    - npm promise-socket package is not a required dependency.
- I changed the way getters and setters work. One has to manually call `get`
and `set`. I think this is more straight forward than using the `Object.defineProperty`
because it makes it more clear that we're dealing with Promises, not just accessing
object attributes.


### v2.2.0

- Added Daemons, which means that we can spin up JavaScript objects, and access
them remotely from Python and JavaScript!
- Added defaultLogger function that creates a logger
- Added tests for daemons, and utility functions.
- Rearranged some of the example and test code. For example, I move the basic
Python server to the test directory.
- changed some of the configuration names to match up better with Python Pyro.
- Added nameserver (naming.js) and associated tests (naming.spec.js)
- implemented uriFor method in Daemon class
- Fixed bug in Message protocol. I learned an important lesson: Never convert `Buffer`s to strings and then send across a TCP
connection. *Always* send the raw `Buffer` object, and then unpack it on the receiving side.

### v2.2.1

- Figured out why remote method calls took about twice as long as equivalent
Python calls. Remote method calls have less overhead (~0.3ms less) than before.
It turns out that making calls to winston loggers is relatively expensive,
especially if you're `stringify`-ing objects and such.
- `Message`, `Daemon` and `Proxy` had many methods that didn't need to be
async methods that were. I changed unnecessary `async` methods into normal
methods

### v2.3.0

- Remote method calls can be "batched". As each remote method returns a promise,
we can resolve these with `Promise.all`. This is not (surprisingly), faster than
doing each call individually.


### v2.3.1

- Added another example.

### v2.4.0

- Added support for calling Python oneway methods.
