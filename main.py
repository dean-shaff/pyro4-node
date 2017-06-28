import logging
import sys
sys.path.append("./Pyro4/src")

import Pyro4
Pyro4.config.SERIALIZER = 'json'
import Pyro4.core as c

logging.basicConfig(level=logging.DEBUG)

def main():
    # ns = Pyro4.locateNS('localhost', 9090)
    uri = "PYRO:BasicServer@localhost:50001"
    proxy = Pyro4.Proxy(uri)
    for i in xrange(100):
        proxy.square(2)
        proxy.cube(100)

if __name__ == '__main__':
    main()
