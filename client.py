import machine, micropython

from sensor import sensor
from client import client

w = machine.Pin(0, machine.Pin.IN, machine.Pin.PULL_UP)
l = machine.Pin(2, machine.Pin.OUT, value=0)
i = machine.I2C(scl=machine.Pin(5), sda=machine.Pin(4))
s = sensor(i, 0x77)

c = client(s)
print("SEND: %s" % c.on_send())

if c.is_sleep() and w.value():

	rtc = machine.RTC()

	rtc.irq(trigger=rtc.ALARM0, wake=machine.DEEPSLEEP)
	rtc.alarm(rtc.ALARM0, c.get_sleep())

	machine.deepsleep()

else:

	tim = machine.Timer(-1)

	wc = lambda x: c.on_send()
	cb = lambda t: micropython.schedule(wc, None)

	tim.init(period=c.get_sleep(), mode=machine.Timer.PERIODIC, callback=cb)
