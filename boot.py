from netconf import configure
from ntptime import settime
from gc import collect

try:

	collect()
	configure()
	settime()

except: pass
finally:

	collect()
