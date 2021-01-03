from micropython import schedule
from machine import Pin, Timer
from driver import driver
from server import server
from ntptime import settime
from json import dumps

p = Pin(25, Pin.OUT, value = 0)

d = driver(p)
s = server(80)

s.set_slite('temps.json', lambda v: dumps(d.get_temps()))
s.set_slite('system.json', lambda v: dumps(d.get_status()))
s.set_slite('prefs.json', lambda v: dumps(d.get_params()))
s.set_slite('scheds.json', lambda v: dumps(d.get_scheds()))
s.set_slite('tasks.json', lambda v: dumps(d.get_tasks()))
s.set_slite('history.json', lambda v: dumps(d.get_hist()))
s.set_slite('genid.var', lambda v: d.get_uids(v))

s.set_callback('config', lambda v: d.set_params(v))
s.set_callback('tempup', lambda v: d.set_temps(v))
s.set_callback('schedup', lambda v: d.set_scheds(v))
s.set_callback('taskup', lambda v: d.set_tasks(v))

s.start()

while True:

	s.accept()
	d.on_loop()
