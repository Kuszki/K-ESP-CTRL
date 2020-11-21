# coding=UTF-8

import time

class sensor:

	def __init__(self, i2c, addr):

		self.addr = addr
		self.i2c = i2c

		cal = self.i2c.readfrom_mem(self.addr, 0xAA, 22)

		self.ac1 = self.get_short(cal[0], cal[1], True)
		self.ac2 = self.get_short(cal[2], cal[3], True)
		self.ac3 = self.get_short(cal[4], cal[5], True)
		self.ac4 = self.get_short(cal[6], cal[7], False)
		self.ac5 = self.get_short(cal[8], cal[9], False)
		self.ac6 = self.get_short(cal[10], cal[11], False)

		self.b1 = self.get_short(cal[12], cal[13], True)
		self.b2 = self.get_short(cal[14], cal[15], True)

		self.mb = self.get_short(cal[16], cal[17], True)
		self.mc = self.get_short(cal[18], cal[19], True)
		self.md = self.get_short(cal[20], cal[21], True)

		self.delay = { 0: 5, 1: 8, 2: 14, 3: 26 }

	def get_temp(self):

		self.i2c.writeto_mem(self.addr, 0xF4, bytes([0x2E]))
		time.sleep_ms(self.delay[0])
		cal = self.i2c.readfrom_mem(self.addr, 0xF6, 2)

		ut = self.get_short(cal[0], cal[1], False)

		x1 = ut - self.ac6
		x1 = (x1 * self.ac5) / (1 << 15)

		x2 = self.mc * (1 << 11)
		x2 = x2 / (x1 + self.md)

		return ((x1 + x2 + 8) / (1 << 4)) / 10

	def get_pres(self, oss = 0):

		if not oss in self.delay: return None

		self.i2c.writeto_mem(self.addr, 0xF4, bytes([0x2E]))
		time.sleep_ms(self.delay[0])
		cal = self.i2c.readfrom_mem(self.addr, 0xF6, 2)

		ut = self.get_short(cal[0], cal[1], False)
		req = 0x34 + (oss << 6)

		self.i2c.writeto_mem(self.addr, 0xF4, bytes([req]))
		time.sleep_ms(self.delay[oss])
		cal = self.i2c.readfrom_mem(self.addr, 0xF6, 3)

		up = self.get_long(cal[0], cal[1], cal[2])
		up = up >> (8 - oss)

		x1 = ut - self.ac6
		x1 = (x1 * self.ac5) / (1 << 15)

		x2 = self.mc * (1 << 11)
		x2 = x2 / (x1 + self.md)

		b6 = x1 + x2 - 4000

		x1 = (self.b2 * (b6*b6 / (1 << 12))) / (1 << 11)
		x2 = (self.ac2 * b6) / (1 << 11)
		x3 = x1 + x2

		b3 = ((int(4 * self.ac1 + x3) << oss) + 2) / 4

		x1 = (self.ac3 * b6) / (1 << 13)
		x2 = (self.b1 * (b6*b6 / (1 << 12))) / (1 << 16)
		x3 = ((x1 + x2) +2) / (1 << 2)

		b4 = self.ac4 * (x3 + 32768) / (1 << 15)
		b7 = (up - b3) * (50000 >> oss)

		if b7 < (1 << 31): p = (b7 * 2) / b4
		else: p = (b7 / b4) * 2

		x1 = (p / (1 << 8)) * (p / (1 << 8))
		x1 = (x1 * 3038) / (1 << 16)
		x2 = (-7357 * p) / (1 << 16)

		return p + ((x1 + x2 + 3791) / (1 << 4))

	def get_short(self, c1, c2, s = False):

		n = (c1 << 8) + c2

		if not s: return n
		else:
			if not (n & (1 << 15)): return n
			else: return n - (1 << 16)

	def get_long(self, c1, c2, c3, s = False):

		n = (c1 << 16) + (c2 << 8) + c1

		if not s: return n
		else:
			if not (n & (1 << 23)): return n
			else: return n - (1 << 24)
