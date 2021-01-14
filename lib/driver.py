# coding=UTF-8

import time, ntptime, json, requests, os, gc

class driver:

	REQ = 'http://api.openweathermap.org/data/2.5/weather?units=metric&lang=pl&q=%s&appid=%s'

	CUR = 'Obliczona'
	OUT = 'Zewnętrzna'

	POWER = { False: 'Wyłączony', True: 'Włączony' }
	DRIVER = { 0: 'Ręczne', 1: 'Automatyczne' }

	def __init__(self, out):

		try: self.schedules = json.load(open('/etc/plan.json', 'r'))
		except: self.schedules = dict()
		else: gc.collect()
		finally: self.lasts = 0

		try: self.tasks = json.load(open('/etc/jobs.json', 'r'))
		except: self.tasks = dict()
		else: gc.collect()
		finally: self.lastt = 0

		for k in self.schedules:
			if int(k) >= self.lasts:
				self.lasts = int(k) + 1

		for k in self.tasks:
			if int(k) >= self.lastt:
				self.lastt = int(k) + 1

		try: settings = json.load(open('/etc/driver.json', 'r'))
		except: settings = dict()
		else: gc.collect()

		try: self.def_temp = settings['main']['target']
		except: self.def_temp = 20.0

		try: self.tar_temp = settings['main']['target']
		except: self.tar_temp = 20.0

		try: self.driver = settings['main']['driver']
		except: self.driver = False

		try: self.funct = settings['main']['funct']
		except: self.funct = 0

		try: self.hplus = settings['main']['plus']
		except: self.hplus = 0.75

		try: self.hminus = settings['main']['minus']
		except: self.hminus = 0.75

		try: self.tzone = settings['time']['zone']
		except: self.tzone = 0

		try: self.loop = settings['time']['loop']
		except: self.loop = 30

		try: self.sync = settings['time']['sync']
		except: self.sync = 600

		try: self.minon = settings['time']['minon']
		except: self.minon = 3600

		try: self.minoff = settings['time']['minoff']
		except: self.minoff = 3600

		try: self.psize = settings['plot']['size']
		except: self.psize = 72

		try: self.page = settings['plot']['age']
		except: self.page = 259200

		try: self.lsize = settings['logs']['size']
		except: self.lsize = 25

		try: self.lage = settings['logs']['age']
		except: self.lage = 259200

		try: self.wtok = settings['outdor']['token']
		except: self.wtok = str()

		try: self.wpla = settings['outdor']['place']
		except: self.wpla = str()

		del settings; gc.collect()

		self.ptime = int(self.page / self.psize)
		self.ltime = int(self.lage / self.lsize)

		self.temperatures = dict()
		self.updates = dict()

		self.curr_temp = None
		self.out_temp = None
		self.out_wet = None
		self.power = False

		self.last_loop = 0
		self.last_sync = 0
		self.last_sw = 0

		self.tp_save = 0
		self.tl_save = 0
		self.tw_save = 0

		self.out = out
		self.out.off()

		self.save_logs('boot', 1)

		gc.collect()

	def save_settings(self):

		with open('/etc/driver.json', 'w') as f:
			json.dump(self.get_conf(), f)

	def save_scheds(self):

		with open('/etc/plan.json', 'w') as f:
			json.dump(self.get_scheds(), f)

	def save_tasks(self):

		with open('/etc/jobs.json', 'w') as f:
			json.dump(self.get_tasks(), f)

	def save_history(self, t, now = None):

		if now == None: now = self.get_time()

		for k in t: self.updates[k] = now
		for k, y in t.items():

			data = { 't': now, 'y': y }
			path = '/var/' + k
			v = dict()
			save = True

			try:
				with open(path, 'r') as f:
					v = json.load(f)

			except:
				v['label'] = k
				v['last'] = now
				v['data'] = [ data ]

			else:
				if now - v['last'] >= self.ptime:

					v['data'].append(data)
					v['last'] = now

				else: save = False

			if save:
				with open(path, 'w') as f:
					json.dump(v, f)

			del v, path, data

	def save_logs(self, k, s, now = None):

		if now == None: now = self.get_time()

		try: logs = json.load(open('/etc/log.json', 'r'))
		except: logs = list()

		for v in logs:
			if now - v['t'] >= self.lage:
				logs.remove(v)

		while len(logs) >= self.lsize: logs.pop(-1)

		logs.insert(0, { 't': now, 'k': k, 's': s })

		with open('/etc/log.json', 'w') as f:
			json.dump(logs, f)

	def set_power(self, p):

		power = bool(int(p))

		if self.power != power:

			self.last_sw = self.get_time()
			self.save_logs('pwr', power)
			self.power = power
			self.out.value(power)

	def set_driver(self, p):

		driver = int(p)

		if self.driver != driver:

			self.save_logs('drv', driver)
			self.driver = driver

	def set_temps(self, v):

		if self.CUR in v: del v[self.CUR]
		if self.OUT in v: del v[self.OUT]

		for k in v:

			try: v[k] = float(v[k])
			except: del v[k]
			else: v[k] = round(v[k], 2)

			if 5.0 <= v[k] <= 35.0: pass
			else: del v[k]

		if not len(v): return False
		else: now = self.get_time()

		self.temperatures.update(v)
		self.curr_temp = self.get_calc()
		self.save_history(v, now)

		return True

	def set_scheds(self, v):

		if not len(v): return False
		else: ok = True

		for k, s in v.items():

			if 'del' in s and s['del']:

				try: del self.schedules[k]
				except: ok = False

			elif len(s) == 5:

				if not k in self.schedules:
					self.schedules[k] = dict()

				try:

					self.schedules[k]['days'] = int(s['days'])
					self.schedules[k]['from'] = int(s['from'])
					self.schedules[k]['to'] = int(s['to'])
					self.schedules[k]['act'] = float(s['act'])
					self.schedules[k]['on'] = int(s['on'])

				except: ok = False

			else: ok = False

		if ok: self.save_scheds()

		return ok

	def set_tasks(self, v):

		if not len(v): return False
		else: ok = True

		for k, s in v.items():

			if 'del' in s and s['del']:

				try: del self.tasks[k]
				except: ok = False

			elif len(s) == 2:

				if not k in self.tasks:
					self.tasks[k] = dict()

				try:

					self.tasks[k]['when'] = int(s['when'])
					self.tasks[k]['job'] = int(s['job'])

				except: ok = False

			else: ok = False

		if ok: self.save_tasks()

		return ok

	def set_params(self, v):

		if not len(v): return False
		else: ok = True; num = 0

		try:

			if 'hplus' in v:

				val = float(v['hplus'])

				if 0.5 <= val <= 3.0:
					self.hplus = val
					num = num + 1
				else: ok = False

			if 'hminus' in v:

				val = float(v['hminus'])

				if 0.5 <= val <= 3.0:
					self.hminus = val
					num = num + 1
				else: ok = False

			if 'target' in v:

				val = float(v['target'])

				if 15.0 <= val <= 25.0:
					self.def_temp = val
					num = num + 1
				else: ok = False

			if 'psize' in v:

				val = int(v['psize'])

				if 30 <= val <= 150:
					self.psize = val
					self.ptime = int(self.page / self.psize)
					self.tp_save = 0
					num = num + 1
				else: ok = False

			if 'page' in v:

				val = int(v['page'])

				if 1 <= val <= 5:
					self.page = val * 86400
					self.psize = int(self.page / self.ptime)
					self.tp_save = 0
					num = num + 1
				else: ok = False

			if 'ptime' in v:

				val = int(v['ptime'])

				if 15 <= val <= 180:
					self.ptime = val * 60
					self.psize = int(self.page / self.ptime)
					self.tp_save = 0
					num = num + 1
				else: ok = False

			if 'lsize' in v:

				val = int(v['lsize'])

				if 10 <= val <= 100:
					self.lsize = val
					self.ltime = int(self.lage / self.lsize)
					self.tl_save = 0
					num = num + 1
				else: ok = False

			if 'lage' in v:

				val = int(v['lage'])

				if 1 <= val <= 10:
					self.lage = val * 86400
					self.ltime = int(self.lage / self.lsize)
					self.tl_save = 0
					num = num + 1
				else: ok = False

			if 'sync' in v:

				val = int(v['sync'])

				if 5 <= val <= 360:
					self.sync = val * 60
					num = num + 1
				else: ok = False

			if 'minon' in v:

				val = int(v['minon'])

				if 30 <= val <= 180:
					self.minon = val * 60
					num = num + 1
				else: ok = False

			if 'minoff' in v:

				val = int(v['minoff'])

				if 30 <= val <= 180:
					self.minoff = val * 60
					num = num + 1
				else: ok = False

			if 'tzone' in v:

				val = int(v['tzone'])

				if -12 <= val <= 14:
					self.tzone = val
					num = num + 1
				else: ok = False

			if 'loop' in v:

				val = int(v['loop'])

				if 5 <= val <= 60:
					self.loop = val
					num = num + 1
				else: ok = False

			if 'wtok' in v:

				val = str(v['wtok'])
				self.wtok = val
				self.tw_save = 0
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
				self.last_loop = 0
				num = num + 1

			if 'save' in v:

				self.save_settings()
				num = num + 1

			if 'rmlogs' in v:

				try: os.remove('/etc/log.json')
				except: ok = False

				num = num + 1

		finally: return ok and (num == len(v))

	def get_calc(self):

		if not len(self.temperatures): return None
		elif self.funct == 0: t = self.temperatures.values()
		else: t = sorted(self.temperatures.values())

		l = len(self.temperatures)
		i = (l - 1) // 2

		if self.funct == 1:

			if (l % 2): temp = t[i]
			else: temp = (t[i] + t[i+1])/2

		elif self.funct == 2: temp = t[-1]
		elif self.funct == 3: temp = t[0]
		else: temp = sum(t) / l

		return round(temp, 2)

	def get_temps(self):

		tmp = self.temperatures.copy()
		tmp[self.CUR] = self.curr_temp
		tmp[self.OUT] = self.out_temp

		return tmp

	def get_status(self):

		dt = time.time() + self.tzone * 3600
		t = time.localtime(dt)[0:6]

		if self.driver == 0: suf = self.DRIVER[0]
		else:
			if self.tar_temp == 100.0: suf = self.POWER[True]
			elif self.tar_temp == 0.0: suf = self.POWER[False]
			else: suf = '%s ℃' % self.tar_temp

		return \
		{
			'Godzina': '%d:%02d:%02d' % (t[3], t[4], t[5]),
			'Data': '%02d.%02d.%d' % (t[2], t[1], t[0]),
			'Status': self.POWER[bool(self.power)],
			'Sterowanie': suf,
			'Pogoda': self.out_wet
		}

	def get_params(self):

		return \
		{
			'driver': self.driver,
			'target': self.def_temp,
			'funct': self.funct,
			'tzone': self.tzone,
			'loop': self.loop,
			'hplus': self.hplus,
			'hminus': self.hminus,
			'psize': self.psize,
			'lsize': self.lsize,
			'wtok': self.wtok,
			'wpla': self.wpla,

			'page': int(self.page / 86400),
			'lage': int(self.lage / 86400),
			'ptime': int(self.ptime / 60),

			'sync': int(self.sync / 60),
			'minoff': int(self.minoff / 60),
			'minon': int(self.minon / 60)
		}

	def get_conf(self):

		return \
		{
			'main':
			{
				'driver': self.driver,
				'target': self.def_temp,
				'funct': self.funct,
				'plus': self.hplus,
				'minus': self.hminus
			},
			'time':
			{
				'zone': self.tzone,
				'loop': self.loop,
				'sync': self.sync,
				'minon': self.minon,
				'minoff': self.minoff
			},
			'outdor':
			{
				'token': self.wtok,
				'place': self.wpla
			},
			'plot':
			{
				'size': self.psize,
				'age': self.page
			},
			'logs':
			{
				'size': self.lsize,
				'age': self.lage
			}
		}

	def get_hist(self):

		return os.listdir('/var')

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

		if self.curr_temp == None: return False

		tplus = self.tar_temp + self.hplus
		tminus = self.tar_temp - self.hminus

		if self.curr_temp >= tplus: return False
		if self.curr_temp <= tminus: return True

		return self.power

	def get_time(self):

		now = time.time()
		timeout = now - self.last_sync >= self.sync
		firstsyn = self.last_sync == 0

		if timeout or firstsyn:

			try:

				ntptime.settime()
				now = time.time()

			except: self.last_sync = 0
			else: self.last_sync = now

		return now

	def on_task(self, t):

		v = self.tasks
		dt = self.loop
		save = False

		driver = self.driver
		power = self.power

		for k in v:

			when = v[k]['when']
			job = v[k]['job']

			if t - when > 3*dt:
				del v[k]; save = True

			elif t - when >= 0:

				if job == 0: power = 0; driver = 0
				elif job == 1: power = 1; driver = 0
				elif job == 2: driver = 1

				del v[k]; save = True

		if save: self.save_tasks()

		return driver, power

	def on_schedule(self, t):

		if not len(self.schedules):
			return self.def_temp

		t = t + self.tzone * 3600
		t = time.localtime(t)

		d = t[6]; m = 60*t[3] + t[4]
		dm = 6 if d == 0 else d - 1

		found = False; target = 0.0
		dis = False; en = False

		for k in self.schedules.values():

			if not k['on']: continue
			else:

				day = k['days']
				frt = k['from']
				tot = k['to']

			if tot > frt:

				ok = day & (1 << d)
				ok = ok and (frt <= m)
				ok = ok and (tot >= m)

			else:

				tn = tm = False

				if day & (1 << d):
					tn = frt <= m

				if day & (1 << dm):
					tm = tot >= m

				ok = tn or tm

			if ok:

				target = max(k['act'], target)

				dis = dis or k['act'] == 0.0
				en = en or k['act'] == 100.0

				found = True

		if dis: target = 0.0
		elif en: target = 100.0

		if found: return target
		else: return self.def_temp

	def on_hist(self, now):

		null = { 't': now, 'y': None }
		hist = os.listdir('/var')
		saves = dict()

		if self.curr_temp != None:
			saves[self.CUR] = self.curr_temp

		if self.out_temp != None:
			saves[self.OUT] = self.out_temp

		if len(saves):
			self.save_history(saves, now)

		for l in hist:

			path = '/var/' + l; save = False

			with open(path, 'r') as f:
				v = json.load(f)

			if l in self.updates:
				last = self.updates[l]
			else:
				last = v['last']

			if now - last >= self.ptime:

				if l in self.temperatures:
					del self.temperatures[l]

				if l in self.updates:
					del self.updates[l]

				if v['data'][-1]['y'] != None:
					v['data'].append(null)
					save = True

			if now - v['data'][-1]['t'] >= self.page: v['data'] = []
			else:
				while now - v['data'][0]['t'] >= self.page:
					v['data'].pop(0)
					save = True

			if not len(v['data']): os.remove(path)
			elif save:
				with open(path, 'w') as f:
					json.dump(v, f)

			del v, path, save

	def on_logs(self, now):

		try: logs = json.load(open('/etc/log.json', 'r'))
		except: return None
		else: save = False

		if now - logs[0]['t'] >= self.lage: logs = []
		else:
			while now - logs[-1]['t'] >= self.page:
				logs.pop(-1)
				save = True

			while len(logs) > self.lsize:
				logs.pop(-1)
				save = True

		if not len(logs): os.remove('/etc/log.json')
		elif save:
			with open('/etc/log.json', 'w') as f:
				json.dump(logs, f)

	def on_outdor(self, now):

		if not self.wtok or not self.wpla:

			self.out_temp = None
			self.out_wet = None
			self.tw_save = 0

			return None

		try:

			req = self.REQ % (self.wpla, self.wtok)
			ans = requests.get(req).json()

			wet = ans['weather'][0]['description']
			temp = ans['main']['temp']

			self.out_wet = wet[0].upper() + wet[1:]
			self.out_temp = round(temp, 2)

		except:

			self.out_temp = None
			self.out_wet = None
			self.tw_save = 0

	def on_loop(self):

		if time.time() - self.last_loop >= self.loop:

			self.curr_temp = self.get_calc()
			self.last_loop = self.get_time()

			now = self.last_loop
			driver = self.driver
			power = self.power
			target = self.tar_temp

		else: return None

		if power: swok = now - self.last_sw >= self.minon
		else: swok = now - self.last_sw >= self.minoff

		if len(self.tasks) > 0:
			driver, power = self.on_task(now)
			swok = power != self.power

		if self.driver != 0:
			target = self.on_schedule(now)

		if self.driver != driver:
			self.set_driver(driver)

		if self.tar_temp != target:
			self.tar_temp = target

		if self.driver != 0 and swok:
			power = self.get_drive()

		if self.power != power and swok:
			self.last_sw = now
			self.set_power(power)

		if now - self.tw_save >= self.ptime:
			self.tw_save = now
			self.on_outdor(now)

		if now - self.tp_save >= self.ptime:
			self.tp_save = now
			self.on_hist(now)

		if now - self.tl_save >= self.ltime:
			self.tl_save = now
			self.on_logs(now)

		if not len(self.temperatures):
			self.curr_temp = None

		gc.collect()
