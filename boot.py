import gc, ntptime, time, network
from netconf import netconf

if not network.WLAN(network.STA_IF).active():
	nc = netconf()
	nc.configure()

try:	ntptime.settime()
except: pass

gc.enable()
gc.collect()
