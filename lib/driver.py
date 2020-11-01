# coding=UTF-8

import time, json

class driver:

	POWER = { False: 'Wyłączony', True: 'Włączony' }
	DRIVER = { 0: 'Ręczne', 1: 'Automatyczne' }

	def __init__(self):

		settings = json.load(open('/etc/driver.json', 'r'))

		self.curr_temp = None
		self.out_temp = None
		self.ht_temp = None

		self.driver = settings['status']['driver']
		self.power = settings['status']['power']
		self.time = time.localtime()[0:6]

		self.temperatures = dict()

		self.plot_dt = settings['timers']['plot']
		self.loop_dt = settings['timers']['loop']

	def set_power(self, p):

		self.power = int(p)
		self.driver = 0

	def set_driver(self, p):

		self.driver = p != 0
		self.on_loop()

	def set_temps(self, v):

		self.temperatures.update(v)

	def set_params(self, v):

		if 'power' in v:
			self.set_power(v['power'])

		if 'driver' in v:
			self.set_driver(v['driver'])

		return True

	def get_temps(self):

		tmp = { 'Zmierzona': self.curr_temp }
		tmp.update(self.temperatures)

		return tmp

	def get_status(self):

		return \
		{
			'Status': self.POWER[bool(self.power)],
			'Sterowanie': self.DRIVER[self.driver],
			'Temperatura wody': self.ht_temp
		}

	def get_envinfo(self):

		t = time.localtime()[0:6]

		return \
		{
			'Godzina': '%d:%02d:%02d' % (t[3]+1, t[4], t[5]),
			'Data': '%02d.%02d.%d' % (t[2], t[1], t[0]),
			'Temperatura otoczenia': self.out_temp
		}

	def on_loop(self):

		t = time.localtime()[0:6]
