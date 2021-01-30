# coding=UTF-8

from math import exp, log

class potent:

	def __init__(self, spi, cs):

		self.spi = spi
		self.cs = cs

		self.curr = None

	def set_potent(self, rmax, bits, rw = 175):

		self.rmax = float(rmax)
		self.bits = int(bits)
		self.rw = float(rw)

	def set_term(self, rtyp, beta, t = 25):

		t = t + 273.15
		e = exp((-beta)/t)

		self.beta = float(beta)
		self.rinf = float(rtyp*e)

	def set_temp(self, temp, mode = 1):

		temp = float(temp) + 273.15
		r = self.rinf*exp(self.beta/temp)

		self.set_ohms(r, mode)

	def set_ohms(self, ohms, mode = 1):

		if not mode: ohms = ohms - self.rw
		else: ohms = self.rmax - ohms + self.rw

		value = self.bits*ohms
		value = value / self.rmax

		if value >= self.bits: value = self.bits-1
		elif value < 0.0: value = 0
		else: value = round(value, 0)

		self.set_value(value)

	def set_value(self, value):

		self.curr = value = int(value)

		self.cs.value(0)
		self.spi.write(bytes([17, value]))
		self.cs.value(1)

	def get_temp(self, mode = 1):

		r = self.get_ohms(mode)
		d = r/self.rinf

		return self.beta/log(d) - 273.15

	def get_ohms(self, mode = 1):

		value = self.rmax*self.curr
		value = value / self.bits

		if not mode: return value + self.rw
		else: return self.rmax - value + self.rw

	def get_value(self):

		return self.curr
