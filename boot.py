from netconf import configure, sta_active
from ntptime import settime

import gc, micropython; gc.collect()

if not sta_active(): configure()

try:	settime()
except: pass
finally: gc.collect()
