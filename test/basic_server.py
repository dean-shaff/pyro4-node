import argparse
import threading
import socket
import sys

import Pyro4
import Pyro4.naming

Pyro4.config.SERIALIZER = 'json'


class BasicServer(object):

    def __init__(self):
        self._name = "BasicServer"

    @Pyro4.expose
    @property
    def name(self):
        # print("name.getter")
        return self._name

    @Pyro4.expose
    @name.setter
    def name(self, value):
        # print("name.setter: {}".format(value))
        self._name = value

    @Pyro4.expose
    @Pyro4.oneway
    def oneway_method(self, x):
        return x

    @Pyro4.expose
    def cube(self, x):
        """
        Cube argument
        """
        return x**3

    @Pyro4.expose
    def echo(self, arg):
        """
        Echo back argument
        """
        return arg

    @Pyro4.expose
    def square(self, x):
        """
        Square argument
        args:
            x (int/float): The argument to be square.
        returns:
            float: The result of the arguemnt squared
        """
        return x**2


def parse_args(init_description):
    parser = argparse.ArgumentParser(description=init_description)

    parser.add_argument(
        "--ns_host", "-nsn", dest='ns_host',
        action='store', default='localhost',
        help="Specify a host name for the Pyro name server. Default is localhost")

    parser.add_argument(
        "--ns_port", "-nsp", dest='ns_port',
        action='store', default=9090, type=int,
        help="Specify a port number for the Pyro name server. Default is 9090.")

    return parser.parse_args()


def startNSloop(*args):
    try:
        return Pyro4.naming.startNSloop(*args)
    except socket.error as err:
        pass


if __name__ == '__main__':
    parsed = parse_args("Start a basic server")
    bs = BasicServer()

    ns_thread = threading.Thread(
        target=startNSloop, args=(parsed.ns_host, parsed.ns_port))
    ns_thread.daemon = True
    ns_thread.start()

    with Pyro4.Daemon(host='localhost', port=50001) as daemon:
        server_uri = daemon.register(bs, objectId='BasicServer')
        with Pyro4.locateNS(port=parsed.ns_port, host=parsed.ns_host) as ns:
            ns.register('BasicServer', server_uri)
        print("Firing up daemon")
        sys.stdout.flush()
        daemon.requestLoop()
