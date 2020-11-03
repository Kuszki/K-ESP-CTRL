# coding=UTF-8

import socket

class server:

	STR_MIME = \
	{
		'.html': 'text/html',
		'.css': 'text/css',
		'.js': 'text/javascript',
		'.ico': 'image/png',
		'.json': 'application/json'
	}

	STR_OK = 'HTTP/1.1 200 OK\n'
	STR_NF = 'HTTP/1.1 404 NA\n'
	STR_CL = 'Connection: close\n\n'

	def __init__(self, port = 80):

		self.port = port
		self.callback = dict()
		self.slites = dict()

	def set_port(port):

		self.port = port

	def set_callback(self, slite, callback):

		self.callback[slite] = callback

	def set_slite(self, slite, callback):

		self.slites[slite] = callback

	def start(self):

		self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

		self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
		self.sock.bind(('', 80))
		self.sock.listen(10)
		self.sock.setsockopt(socket.SOL_SOCKET, 20, self.accept)

	def stop(self):

		self.sock.close()

	def accept(self, s):

		conn, addr = s.accept()
		conn.setsockopt(socket.SOL_SOCKET, 20, self.recv)

	def recv(self, s):

		try: slite, par = self.parse(str(s.recv(512)))
		except: slite = None; par = dict()

		if slite in self.callback:
			tmp = self.callback[slite](par)
		else: tmp = None

		if slite in self.slites:
			con = self.slites[slite](par)
		else: con = self.slite(slite);

		if con != None or tmp == True:
			hed = self.STR_OK
		else: hed = self.STR_NF

		s.sendall(str(hed))
		s.sendall(self.mime(slite))
		s.sendall(self.STR_CL)

		if con != None:
			try: s.sendall(con)
			except: s.sendall('\n')

		s.close()

	def parse(self, req):

		a = req.find(' /') + 2
		b = req.find(' HTTP')
		req = req[a:b]

		vlist = dict()
		slite = req

		par = req.find('?')

		if par != -1:

			slite = req[0:par]
			req = req[par+1:len(req)]

			for p in req.split('&'):
				if p.find('=') != -1:
					i = p.split('=')
					vlist[i[0]] = i[1]
				else:
					vlist[p] = None

		if slite == '':
			slite = 'index.html'

		return slite, vlist

	def slite(self, path):

		try: return open('/http/%s' % path, 'r').read()
		except: con = None

		try: return open('/src/%s' % path, 'r').read()
		except: con = None

		try: return open('/etc/%s' % path, 'r').read()
		except: con = None

		try: return open('/var/%s' % path, 'r').read()
		except: con = None

		return con;

	def mime(self, path):

		mime = 'text/plain'

		for k, v in self.STR_MIME.items():
			if path.endswith(k): mime = v; break

		return 'Content-Type: %s\n' % mime
