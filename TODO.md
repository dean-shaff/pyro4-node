## TODO

- Need to add a means of translating custom Python classes to comparable
JavaScript. A notable example is the `URI` class. As of right now, we cannot
register JavaScript objects on a Python nameserver, because Python doesn't
recognize the URI object sent to the nameserver `register` method.
- Figure out why method calls take about twice as long in node as in Python.
    - Looking into this, it seems like calls to the loggers are taking up a lot
    of time -- roughly half the time we spend 
