from machine import Pin, Timer; gc.collect()
from driver import driver; gc.collect()
from server import server; gc.collect()
from json import dumps; gc.collect()

p = Pin(25, Pin.OUT, value = 0)
d = driver(p); gc.collect()
s = server(); gc.collect()

s.defslite('temps.json', lambda v: dumps(d.get_temps()))
s.defslite('system.json', lambda v: dumps(d.get_status()))
s.defslite('prefs.json', lambda v: dumps(d.get_params()))
s.defslite('scheds.json', lambda v: dumps(d.get_scheds()))
s.defslite('tasks.json', lambda v: dumps(d.get_tasks()))
s.defslite('history.json', lambda v: dumps(d.get_hist()))
s.defslite('genid.var', lambda v: d.get_uids(v))

s.defslite('config', lambda v: d.set_params(v))
s.defslite('tempup', lambda v: d.set_temps(v))
s.defslite('schedup', lambda v: d.set_scheds(v))
s.defslite('taskup', lambda v: d.set_tasks(v))

gc.threshold(25600)
gc.collect()

while True:

	s.accept(); gc.collect()
	d.on_loop(); gc.collect()
