# coding=UTF-8

import network, json

class netconf:

	def __init__(self):

		self.sta_if = network.WLAN(network.STA_IF)
		self.ap_if = network.WLAN(network.AP_IF)

	def get_conf(self):

		try: return json.load(open('/etc/network.json', 'r'))
		except: return dict()

	def set_conf(self, conf):

		with open('/etc/network.json', 'w') as f:
			json.dump(conf, f)

	def configure(self):

		conf = self.get_conf()

		try:

			cli = conf['cli']
			if cli['on']:

				self.sta_if.active(True)
				self.sta_if.connect(cli['ssid'], cli['pass'])

			else: self.sta_if.active(False)

		except: pass

		try:

			srv = conf['access']
			if srv['on']:

				self.ap_if.active(True)
				self.ap_if.config(\
					essid = srv['ssid'], password = srv['pass'], \
					authmode = network.AUTH_WPA_WPA2_PSK)

			else: self.ap_if.active(False)

		except: pass
