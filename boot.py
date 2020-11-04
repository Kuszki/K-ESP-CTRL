import gc, ntptime, machine, network, time

net = network.WLAN(network.STA_IF)
machine.freq(160000000)

while not net.isconnected():
	time.sleep(5)

try:	ntptime.settime()
except: pass

gc.enable()
gc.collect()
