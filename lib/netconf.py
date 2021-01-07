# coding=UTF-8

import network, json

def configure():

	conf = get_conf()

	if 'client' in conf:

		net = network.WLAN(network.STA_IF)
		con = conf['client']

		net.active(bool(int(con['on'])))

		if net.active():
			net.connect(con['ssid'], con['pass'])

	if 'access' in conf:

		net = network.WLAN(network.AP_IF)
		con = conf['access']

		net.active(bool(int(con['on'])))

		if net.active(): self.ap_if.config(\
			essid = con['ssid'], password = con['pass'], \
			authmode = network.AUTH_WPA_WPA2_PSK)

def get_conf():

	try: return json.load(open('/etc/network.json', 'r'))
	except: return dict()

def set_conf(conf):

	with open('/etc/network.json', 'w') as f:
		json.dump(conf, f)

def sta_active():

	return network.WLAN(network.STA_IF).active()

def ap_active():

	return network.WLAN(network.AP_IF).active()
