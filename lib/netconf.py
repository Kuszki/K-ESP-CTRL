# coding=UTF-8

import network, json

class netconf:

	def __init__(self): pass

	def get_conf(self):

		try: return json.load(open('/etc/network.json', 'r'))
		except: return dict()

	def set_conf(self, conf):

		with open('/etc/network.json', 'w') as f:
			json.dump(conf, f)

	def configure(self):

		conf = self.get_conf()

		if 'client' in conf:

			net = network.WLAN(network.STA_IF)
			con = conf['client']

			net.active(bool(int(con['on'])))

			if net.active():

				net.config(dhcp_hostname = con['host'])
				net.connect(con['ssid'], con['pass'])

		if 'access' in conf:

			net = network.WLAN(network.AP_IF)
			con = conf['access']

			net.active(bool(int(con['on'])))

			if net.active(): self.ap_if.config(\
				essid = con['ssid'], password = con['pass'], \
				authmode = network.AUTH_WPA_WPA2_PSK, \
				dhcp_hostname = con['host'])
