import time, json, micropython, machine

from driver import driver
from server import server

p = machine.Pin(2, machine.Pin.OUT)
t = machine.Timer(-1)

d = driver(p)
s = server(80)

s.set_slite('temps.json', lambda v: json.dumps(d.get_temps()))
s.set_slite('system.json', lambda v: json.dumps(d.get_status()))
s.set_slite('outdor.json', lambda v: json.dumps(d.get_envinfo()))

s.set_callback('config', lambda v: d.set_params(v))
s.set_callback('tempup', lambda v: d.set_temps(v))

t.init(period=10000, mode=machine.Timer.PERIODIC, callback=lambda t: micropython.schedule(d.on_loop, t))

s.start()
