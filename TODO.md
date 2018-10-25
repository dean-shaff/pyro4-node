### v2.3.0

- Need to add a means of translating custom Python classes to comparable
JavaScript. A notable example is the `URI` class. As of right now, we cannot
register JavaScript objects on a Python nameserver, because Python doesn't
recognize the URI object sent to the nameserver `register` method.
