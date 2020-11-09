import time, json, micropython, ntptime

from machine import Pin, Timer
from driver import driver
from server import server

p = Pin(2, Pin.OUT)

t = Timer(-1)
n = Timer(-1)

d = driver(p)
s = server(80)

s.set_slite('temps.json', lambda v: json.dumps(d.get_temps()))
s.set_slite('system.json', lambda v: json.dumps(d.get_status()))
s.set_slite('outdor.json', lambda v: json.dumps(d.get_envinfo()))
s.set_slite('prefs.json', lambda v: json.dumps(d.get_params()))
s.set_slite('scheds.json', lambda v: json.dumps(d.get_scheds()))

s.set_slite('genid.html', lambda v: d.get_uids(v))

s.set_callback('config', lambda v: d.set_params(v))
s.set_callback('tempup', lambda v: d.set_temps(v))
s.set_callback('schedup', lambda v: d.set_scheds(v))
s.set_callback('taskup', lambda v: d.set_tasks(v))

wc = lambda x: d.on_loop()
cb = lambda t: micropython.schedule(wc, None)
t.init(period=30000, mode=Timer.PERIODIC, callback=cb)

ws = lambda x: ntptime.settime()
sn = lambda t: micropython.schedule(ws, None)
n.init(period=600000, mode=Timer.PERIODIC, callback=sn)

s.start()
