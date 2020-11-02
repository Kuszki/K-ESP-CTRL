# coding=UTF-8

import time, json, gc, machine

class driver:

	POWER = { False: 'Wyłączony', True: 'Włączony' }
	DRIVER = { 0: 'Ręczne', 1: 'Automatyczne', 2: 'Harmonogram' }

	LOGS = \
	{
		'pwr': \
		{
			0: 'Wyłączono ogrzewanie',
			1: 'Włączono ogrzewanie'
		},
		'drv': \
		{
			0: 'Ustawiono sterowanie ręczne',
			1: 'Ustawiono sterowanie automatyczne',
			2: 'Ustalono harmonogram sterowania'
		}
	}

	def __init__(self, out):

		settings = json.load(open('/etc/driver.json', 'r'))

		self.curr_temp = None
		self.out_temp = None
		self.ht_temp = None
		self.power = False

		self.tar_temp = settings['status']['target']
		self.driver = settings['status']['driver']
		self.hplus = settings['hyster']['plus']
		self.hminus = settings['hyster']['minus']

		self.psize = settings['history']['size']
		self.page = settings['history']['age']

		self.lsize = settings['logs']['size']
		self.lage = settings['logs']['age']

		self.t_save = 0

		self.temperatures = dict()
		self.schedules = dict()

		self.out = out

	def save_settings(self):

		conf = \
		{
			"history":
			{
				"size": self.psize,
				"age": self.page
			},
			"logs":
			{
				"size": self.lsize,
				"age": self.lage
			},
			"status":
			{
				"driver": self.driver,
				"target": self.tar_tmp
			},
			"hyster":
			{
				"plus": self.hplus,
				"minus": self.hminus
			}
		}

		with open('/etc/driver.json', 'w') as f:
			json.dump(conf, f)

	def save_history(self):

		try: hist = json.load(open('/var/history.json', 'r'))
		except: hist = list()

		now = time.time()
		cur = set()

		for v in hist:
			for h in v['data']:
				if now - h['t'] >= self.page:
					v['data'].remove(h)

		for v in hist:
			while len(v['data']) >= self.psize:
				v['data'].pop(0)

		for v in hist:
			if not len(v['data']):
				hist.remove(v)

		for v in hist:
			cur.add(v['label'])

		for k, v in self.temperatures.items():
			if not k in cur: hist.append( \
				{
					'label': k,
					'data': [ {'t': now, 'y': v} ]
				})
			else:
				for h in hist:
					if h['label'] == k:
						h['data'].append( \
							{ 't': now, 'y': v })

		with open('/var/history.json', 'w') as f:
			json.dump(hist, f)

	def save_logs(self, msg):

		try: logs = json.load(open('/var/log.json', 'r'))
		except: logs = list()

		now = time.time()

		for v in logs:
			if now - v['t'] >= self.lage:
				logs.remove(v)

		while len(logs) >= self.lsize: logs.pop(0)

		logs.append({ 't': time.time(), 'msg': msg })

		with open('/var/log.json', 'w') as f:
			json.dump(logs, f)

	def set_power(self, p):

		power = bool(int(p));

		if self.power != power:

			self.on_log('pwr', power)
			self.power = power
			self.out.value(not power)

	def set_driver(self, p):

		driver = int(p)

		if self.driver != driver:

			self.on_log('drv', driver)
			self.driver = driver

	def set_temps(self, v):

		for k in v: v[k] = float(v[k])

		self.temperatures.update(v)
		self.curr_temp = sum(self.temperatures.values())
		self.curr_temp /= len(self.temperatures)

	def set_params(self, v):

		if 'hplus' in v:
			self.hplus = float(v['hplus'])

		if 'hminus' in v:
			self.hminus = float(v['hminus'])

		if 'target' in v:
			self.tar_temp = float(v['target'])

		if 'power' in v:
			self.set_driver(int(0))
			self.set_power(v['power'])

		if 'driver' in v:
			self.set_driver(v['driver'])

		if 'save' in v:
			self.save_settings()

		return bool(len(v))

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
			'Godzina (UTC)': '%d:%02d:%02d' % (t[3], t[4], t[5]),
			'Data (UTC)': '%02d.%02d.%d' % (t[2], t[1], t[0]),
			'Temperatura otoczenia': self.out_temp
		}

	def get_drive(self):

		if self.curr_temp == None: return self.power

		tplus = self.tar_temp + self.hplus
		tminus = self.tar_temp - self.hminus

		if self.curr_temp >= tplus: return False;
		if self.curr_temp <= tminus: return True;

		return self.power

	def on_schedule(self):

		# TODO implement me
		return self.driver, self.power, self.tar_temp

	def on_loop(self, tim):

		p_dt = self.page / self.psize
		now = time.time()

		driver = self.driver
		power = self.power
		target = self.tar_temp

		if now - self.t_save >= p_dt:
			self.save_history()
			self.t_save = now

		if self.driver != 0:
			driver, power, target = self.on_schedule()

		if self.driver != driver:
			self.set_driver(driver)

		if self.driver == 1:
			power = self.get_drive()

		if self.power != power:
			self.set_power(power)

		gc.collect()

	def on_log(self, cat, stat = None):

		if cat in self.LOGS and stat in self.LOGS[cat]:
			self.save_logs(self.LOGS[cat][stat])
		else: self.save_logs(cat)

