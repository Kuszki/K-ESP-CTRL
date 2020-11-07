# coding=UTF-8

import time, ntptime, json, requests

class driver:

	REQ = 'http://api.openweathermap.org/data/2.5/weather?units=metric&lang=pl&q=%s&appid=%s'
	OBL = 'Obliczona'

	POWER = { False: 'Wyłączony', True: 'Włączony' }
	DRIVER = { False: 'Ręczne', True: 'Automatyczne' }

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
			1: 'Ustawiono sterowanie automatyczne'
		}
	}

	def __init__(self, out):

		try: settings = json.load(open('/etc/driver.json', 'r'))
		except: settings = dict()

		try: self.schedules = json.load(open('/etc/plan.json', 'r'))
		except: self.schedules = dict()
		finally: self.lasts = 0

		try: self.tasks = json.load(open('/etc/jobs.json', 'r'))
		except: self.tasks = dict()
		finally: self.lastt = 0

		for k in self.schedules:
			if int(k) >= self.lasts:
				self.lasts = int(k) + 1

		for k in self.tasks:
			if int(k) >= self.lastt:
				self.lastt = int(k) + 1

		self.temperatures = dict()

		self.curr_temp = None
		self.out_temp = None
		self.ht_temp = None
		self.power = False

		self.tar_temp = settings['status']['target']
		self.driver = settings['status']['driver']
		self.funct = settings['status']['funct']
		self.tzone = settings['status']['tzone']

		self.hplus = settings['hyster']['plus']
		self.hminus = settings['hyster']['minus']

		self.psize = settings['history']['size']
		self.page = settings['history']['age']

		self.lsize = settings['logs']['size']
		self.lage = settings['logs']['age']

		self.wtref = settings['outdor']['time']
		self.wtok = settings['outdor']['token']
		self.wpla = settings['outdor']['place']

		self.tp_save = 0
		self.tl_save = 0
		self.tw_save = 0

		self.out = out

	def save_settings(self):

		with open('/etc/driver.json', 'w') as f:
			json.dump(self.get_conf(), f)

	def save_scheds(self):

		with open('/etc/plan.json', 'w') as f:
			json.dump(self.get_scheds(), f)

	def save_tasks(self):

		with open('/etc/jobs.json', 'w') as f:
			json.dump(self.get_tasks(), f)

	def save_history(self, t):

		try: hist = json.load(open('/etc/history.json', 'r'))
		except: hist = list()

		try: now = ntptime.time()
		except: now = time.time()

		p_dt = self.page / self.psize
		cur = set()

		for v in hist:

			if v['label'] in t and now - v['last'] >= p_dt:
				v['data'].append({ 't': now, 'y': t[v['label']] })
				v['last'] = now

			for h in v['data']:
				if now - h['t'] >= self.page:
					v['data'].remove(h)

			while len(v['data']) > self.psize:
				v['data'].pop(0)

			if not len(v['data']): hist.remove(v)
			else: cur.add(v['label'])

		for k, v in t.items():
			if not k in cur:
				hist.append( \
				{
					'label': k, 'last': now,
					'data': [{'t': now, 'y': v}]
				})

		with open('/etc/history.json', 'w') as f:
			json.dump(hist, f)

	def save_logs(self, msg):

		try: logs = json.load(open('/etc/log.json', 'r'))
		except: logs = list()

		try: now = ntptime.time()
		except: now = time.time()

		for v in logs:
			if now - v['t'] >= self.lage:
				logs.remove(v)

		while len(logs) >= self.lsize: logs.pop(0)

		logs.append({ 't': now, 'msg': msg })

		with open('/etc/log.json', 'w') as f:
			json.dump(logs, f)

	def set_power(self, p):

		power = bool(int(p))

		if self.power != power:

			self.on_log('pwr', power)
			self.power = power
			self.out.value(not power)

	def set_driver(self, p):

		driver = bool(int(p))

		if self.driver != driver:

			self.on_log('drv', driver)
			self.driver = driver

	def set_temps(self, v):

		if not len(v): return False
		for k in v: v[k] = float(v[k])

		self.temperatures.update(v)
		self.curr_temp = self.get_calc()

		v[self.OBL] = self.curr_temp
		self.save_history(v)

		return True

	def set_scheds(self, v):

		print('set_scheds: %s, len: %s' % (v, len(v)))

		if not len(v): return False

		ok = True; num = 0

		for k in v:

			s = v[k].split(',')
			num = num + 1

			print('set: %s' % s)

			if len(s) == 4:

				if not k in self.schedules:
					self.schedules[k] = dict()

				self.schedules[k]['days'] = int(s[0])
				self.schedules[k]['from'] = int(s[1])
				self.schedules[k]['to'] = int(s[2])
				self.schedules[k]['act'] = float(s[3])

			elif v[k] == 'del':

				del self.schedules[k]

			else:

				ok = False
				num -= 1

		if ok and num: self.save_scheds()

		return ok and num

	def set_params(self, v):

		ok = True; num = 0

		if 'hplus' in v:

			val = float(v['hplus'])

			if 1.0 <= val <= 3.0:
				self.hplus = val
				num = num + 1
			else: ok = False

		if 'hminus' in v:

			val = float(v['hminus'])

			if 1.0 <= val <= 3.0:
				self.hminus = val
				num = num + 1
			else: ok = False

		if 'target' in v:

			val = float(v['target'])

			if 15.0 <= val <= 25.0:
				self.tar_temp = val
				num = num + 1
			else: ok = False

		if 'psize' in v:

			val = int(v['psize'])

			if 30 <= val <= 150:
				self.psize = val
				num = num + 1
			else: ok = False

		if 'page' in v:

			val = int(v['page'])

			if 1 <= val <= 5:
				self.page = val * 86400
				num = num + 1
			else: ok = False

		if 'lsize' in v:

			val = int(v['lsize'])

			if 10 <= val <= 100:
				self.lsize = val
				num = num + 1
			else: ok = False

		if 'lage' in v:

			val = int(v['lage'])

			if 1 <= val <= 10:
				self.lage = val * 86400
				num = num + 1
			else: ok = False

		if 'wtref' in v:

			val = int(v['wtref'])

			if 30 <= val <= 360:
				self.wtref = val * 60
				num = num + 1
			else: ok = False

		if 'tzone' in v:

			val = int(v['tzone'])

			if -12 <= val <= 14:
				self.tzone = val
				num = num + 1
			else: ok = False

		if 'wtok' in v:

			val = str(v['wtok'])
			self.wtok = val
			num = num + 1

		if 'wpla' in v:

			val = str(v['wpla'])
			self.wpla = val
			self.tw_save = 0
			num = num + 1

		if 'funct' in v:

			self.funct = int(v['funct'])
			self.curr_temp = self.get_calc()
			num = num + 1

		if 'power' in v:

			self.set_driver(int(0))
			self.set_power(v['power'])
			num = num + 1

		if 'driver' in v:

			self.set_driver(v['driver'])
			num = num + 1

		if 'save' in v:

			self.save_settings()
			num = num + 1

		return ok and num

	def get_calc(self):

		if not len(self.temperatures): return None
		elif self.funct == 0: t = self.temperatures.values()
		else: t = sorted(self.temperatures.values())

		l = len(self.temperatures)

		if self.funct == 1:

			i = (l - 1) // 2

			if (l % 2): return t[i]
			else: return (t[i] + t[i+1])/2

		elif self.funct == 2: return t[-1]
		elif self.funct == 3: return t[0]
		else: return sum(t) / l

	def get_temps(self):

		tmp = { self.OBL: self.curr_temp }
		tmp.update(self.temperatures)

		return tmp

	def get_status(self):

		return \
		{
			'Status': self.POWER[bool(self.power)],
			'Sterowanie': self.DRIVER[self.driver],
			'Temperatura wody': '%s %s' % (self.ht_temp, '℃')
		}

	def get_envinfo(self):

		t = time.localtime()[0:6]

		return \
		{
			'Godzina (UTC)': '%d:%02d:%02d' % (t[3], t[4], t[5]),
			'Data (UTC)': '%02d.%02d.%d' % (t[2], t[1], t[0]),
			'Temperatura zewnętrzna': '%s %s' % (self.out_temp, '℃')
		}

	def get_params(self):

		return \
		{
			'driver': self.driver,
			'target': self.tar_temp,
			'funct': self.funct,
			'tzone': self.tzone,
			'hplus': self.hplus,
			'hminus': self.hminus,
			'psize': self.psize,
			'lsize': self.lsize,
			'wtok': self.wtok,
			'wpla': self.wpla,

			'page': int(self.page / 86400),
			'lage': int(self.lage / 86400),
			'wtref': int(self.wtref / 60)
		}

	def get_conf(self):

		return \
		{
			'history':
			{
				'size': self.psize,
				'age': self.page
			},
			'logs':
			{
				'size': self.lsize,
				'age': self.lage
			},
			'status':
			{
				'driver': self.driver,
				'target': self.tar_temp,
				'funct': self.funct,
				'tzone': self.tzone
			},
			'hyster':
			{
				'plus': self.hplus,
				'minus': self.hminus
			},
			'outdor':
			{
				'time': self.wtref,
				'token': self.wtok,
				'place': self.wpla
			}
		}

	def get_scheds(self):

		return self.schedules

	def get_tasks(self):

		return self.tasks

	def get_uids(self, v):

		if 'sched' in v:
			self.lasts += 1
			return self.lasts

		if 'task' in v:
			self.lastt += 1
			return self.lastt

		return None

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

	def on_hist(self, now):

		try: hist = json.load(open('/etc/history.json', 'r'))
		except: hist = list()

		for v in hist:

			for h in v['data']:
				if now - h['t'] >= self.page:
					v['data'].remove(h)

			while len(v['data']) > self.psize:
				v['data'].pop(0)

			if not len(v['data']): hist.remove(v)

		with open('/etc/history.json', 'w') as f:
			json.dump(hist, f)

	def on_logs(self, now):

		try: logs = json.load(open('/etc/log.json', 'r'))
		except: logs = list()

		for v in logs:
			if now - v['t'] >= self.lage:
				logs.remove(v)

		while len(logs) > self.lsize: logs.pop(0)

		with open('/etc/log.json', 'w') as f:
			json.dump(logs, f)

	def on_loop(self):

		try: now = ntptime.time()
		except: now = time.time()

		driver = self.driver
		power = self.power
		target = self.tar_temp

		if self.driver != 0:
			driver, power, target = self.on_schedule()

		if self.driver != driver:
			self.set_driver(driver)

		if self.driver:
			power = self.get_drive()

		if self.power != power:
			self.set_power(power)

		if now - self.tp_save >= self.page:
			self.on_hist(now)
			self.tp_save = now

		if now - self.tl_save >= self.lage:
			self.on_logs(now)
			self.tl_save = now

		if now - self.tw_save >= self.wtref:
			self.on_outdor()
			self.tw_save = now

	def on_outdor(self):

		if not self.wtok or not self.wpla:
			self.out_temp = None; return

		try:

			req = self.REQ % (self.wpla, self.wtok)
			ans = requests.get(req).json()['main']['temp']

			self.out_temp = ans
			self.save_history({ 'Zewnętrzna': ans })

		except: self.out_temp = None

	def on_log(self, cat, stat = None):

		if cat in self.LOGS and stat in self.LOGS[cat]:
			self.save_logs(self.LOGS[cat][stat])
		else: self.save_logs(cat)

