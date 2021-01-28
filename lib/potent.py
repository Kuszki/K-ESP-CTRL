# coding=UTF-8

from math import exp

class potent:

	def __init__(self, spi, cs):

		self.spi = spi
		self.cs = cs

	def set_potent(self, rmax, bits, rw = 175):

		self.rmax = rmax
		self.bits = bits
		self.rw = rw

	def set_term(self, rtyp, beta, t = 25):

		t = t + + 273.15
		e = exp((-beta)/t)

		self.beta = beta
		self.rinf = rtyp*e

	def set_temp(self, temp, mode = 0):

		temp = temp + 273.15

		r = self.rinf*exp(self.beta/temp)

		self.set_ohms(r, mode)

	def set_ohms(self, ohms, mode = 0):

		if ohms <= 0:

			if mode: value = 0
			else: value = self.bits - 1

		elif mode:

			value = self.bits*ohms - self.rw
			value = value / self.rmax
			value = int(value)

		else:

			value = -self.bits*ohms + self.rw
			value = value / self.rmax
			value = value + self.bits
			value = int(value)

		if not 0 <= value <= self.bits - 1:
			raise ValueError

		self.cs.value(0)
		self.spi.write(bytes([17, value]))
		self.cs.value(1)
