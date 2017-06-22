import logging
import sys
sys.path.append("./Pyro4/src")

import Pyro4
Pyro4.config.SERIALIZER = 'json'
import Pyro4.core as c

logging.basicConfig(level=logging.DEBUG)

def main():
    uri = "PYRO:BasicServer@localhost:50001"
    proxy = Pyro4.Proxy(uri)
    # proxy._pyroBind()
    proxy.square(100)

if __name__ == '__main__':
    main()
