import time
import contextlib

import Pyro4


@contextlib.contextmanager
def timeit(name, formatter=None):
    t0 = time.time()
    yield
    print("{}: {:.3f}ms".format(name, (time.time()-t0)*1000))


n_calls = 100

uri = "PYRO:TestServer@localhost:50001"
p = Pyro4.Proxy(uri)

t0 = time.time()
with timeit("calls"):
    for i in range(100):
        with timeit("call"):
            p.square(2)
