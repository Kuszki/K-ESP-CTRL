from machine import SPI, Pin, Timer; gc.collect()
from driver import driver; gc.collect()
from server import server; gc.collect()
from potent import potent; gc.collect()
from json import dumps; gc.collect()

c = Pin(27, Pin.OUT, value = 1)
p = Pin(25, Pin.OUT, value = 0)

b = SPI(1, \
	baudrate = 10000, \
	mosi = Pin(13), \
	sck = Pin(14), \
	miso = Pin(12))

t = potent(b, c); gc.collect()
d = driver(p, t); gc.collect()
s = server(); gc.collect()

t.set_potent(100000, 256)
t.set_term(10000, 3977)

s.defslite('temps.json', lambda v: dumps(d.get_temps()))
s.defslite('system.json', lambda v: dumps(d.get_status()))
s.defslite('prefs.json', lambda v: dumps(d.get_params()))
s.defslite('scheds.json', lambda v: dumps(d.get_scheds()))
s.defslite('tasks.json', lambda v: dumps(d.get_tasks()))
s.defslite('history.json', lambda v: dumps(d.get_hist()))
s.defslite('devinfo.json', lambda v: dumps(d.get_devinfo()))
s.defslite('genid.var', lambda v: d.get_uids(v))

s.defslite('config', lambda v: d.set_params(v))
s.defslite('tempup', lambda v: d.set_temps(v))
s.defslite('schedup', lambda v: d.set_scheds(v))
s.defslite('taskup', lambda v: d.set_tasks(v))

gc.threshold(25600)
gc.collect()

while True:

	s.accept()
	d.on_loop()
