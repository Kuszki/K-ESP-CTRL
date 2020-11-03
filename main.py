import time, json, micropython

from machine import Pin, Timer
from driver import driver
from server import server

p = Pin(2, Pin.OUT)
t = Timer(-1)

d = driver(p)
s = server(80)

s.set_slite('temps.json', lambda v: json.dumps(d.get_temps()))
s.set_slite('system.json', lambda v: json.dumps(d.get_status()))
s.set_slite('outdor.json', lambda v: json.dumps(d.get_envinfo()))

s.set_callback('config', lambda v: d.set_params(v))
s.set_callback('tempup', lambda v: d.set_temps(v))

cb = lambda t: micropython.schedule(d.on_loop, t)
t.init(period=10000, mode=Timer.PERIODIC, callback=cb)

s.start()

# http://api.openweathermap.org/data/2.5/weather?q=B%C4%99dzin&units=metric&appid=c6b8836a613969bab6d312b2182a6522&lang=pl
