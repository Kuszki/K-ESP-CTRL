import gc, ntptime, machine

machine.freq(160000000)

gc.enable()
gc.collect()

ntptime.settime()
