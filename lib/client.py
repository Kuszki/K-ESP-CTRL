# coding=UTF-8

import requests, json

class client:

	REQ = 'http://%s/tempup?%s=%s'

	def __init__(self, sens):

		conf = json.load(open('/etc/client.json', 'r'))

		self.name = conf['name']
		self.time = conf['time']
		self.sleep = conf['sleep']
		self.srv = conf['srv']
		self.auth = conf['auth']

		self.sens = sens

	def get_sleep(self):

		return self.time * 1000

	def is_sleep(self):

		return self.sleep

	def on_send(self):

		tmp = self.sens.get_temp()
		req = self.REQ % (self.srv, self.name, tmp)
		par = { 'Authorization' : 'Basic %s' % self.auth }

		return requests.get(req, headers=par).text == "True"
