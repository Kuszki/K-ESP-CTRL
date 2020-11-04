# coding=UTF-8

import socket

class server:

	STR_MIME = \
	{
		'.html': b'text/html',
		'.css': b'text/css',
		'.js': b'text/javascript',
		'.ico': b'image/png',
		'.json': b'application/json'
	}

	STR_OK = b'HTTP/1.1 200 OK\r\n'
	STR_NF = b'HTTP/1.1 404 NA\r\n'
	STR_CL = b'Connection: close\r\n\r\n'

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

		try: slite, par = self.parse(s.recv(512).decode())
		except: slite = str(); par = dict()

		if slite in self.callback:
			tmp = self.callback[slite](par)
		else: tmp = None

		if slite in self.slites:
			con = self.slites[slite](par)
		else: con = self.slite(slite);

		if con != None or tmp == True:
			hed = self.STR_OK
		else: hed = self.STR_NF

		try:

			s.sendall(hed)
			s.sendall(self.mime(slite))
			s.sendall(self.STR_CL)

			if con != None:
				s.sendall(con.encode())

		finally:

			s.close()

	def parse(self, req):

		a = req.find(' /') + 2
		b = req.find(' HTTP')

		if a == -1 or b == -1 or a >= b:
			return str(), dict()
		else: req = req[a:b]

		par = req.find('?')
		d = self.unquote
		vlist = dict()

		if par != -1:

			slite = d(req[0:par])
			req = req[par+1:len(req)]

			for p in req.split('&'):

				if p.find('=') != -1:

					i = p.split('=')
					vlist[d(i[0])] = d(i[1])

				else:

					vlist[d(p)] = None

		else: slite = d(req)

		if slite == '':
			slite = 'index.html'

		return slite, vlist

	def unquote(self, string):

		if not string: return str()
		if not '%' in string: return string

		if isinstance(string, str):
			string = string.encode()

		bits = string.split(b'%')
		res = [ bits[0] ]

		for s in bits[1:]:

			try:

				char = bytes([int(s[:2], 16)])
				res.append(char)
				res.append(s[2:])

			except:

				res.append(b'%')
				res.append(s)

		return b''.join(res).decode()


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

		mime = b'text/plain'

		for k, v in self.STR_MIME.items():
			if path.endswith(k): mime = v; break

		return b'Content-Type: %s\n' % mime
