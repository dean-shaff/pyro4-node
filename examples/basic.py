import Pyro4

uri = "PYRO:BasicServer@localhost:50001"

p = Pyro4.Proxy(uri)
print(p.square(2))
print(p.name)
print(p.echo("hey there"))
