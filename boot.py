import ntptime, time, network, gc
from netconf import netconf

if not network.WLAN(network.STA_IF).active():
	nc = netconf()
	nc.configure()

try:	ntptime.settime()
except: pass
finally: gc.collect()
