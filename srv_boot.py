import gc, ntptime, network, time

net = network.WLAN(network.STA_IF)

while not net.isconnected():
	time.sleep(5)

try:	ntptime.settime()
except: pass

gc.enable()
gc.collect()
