# coding=UTF-8

import socket, ssl

class server:

	STR_MIME = \
	{
		'.html': b'text/html',
		'.css': b'text/css',
		'.js': b'text/javascript',
		'.ico': b'image/png',
		'.var': b'application/json',
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
		self.sock.listen(30)
		self.sock.setsockopt(socket.SOL_SOCKET, 20, self.accept)

	def stop(self):

		self.sock.close()

	def accept(self, sock):

		try:

			s = sock.accept()[0]
			s.settimeout(5)

			self.recv(s)

		except: pass

		finally:

			s.close()

	def recv(self, sock):

		try: slite, par = self.parse(sock.recv(1024).decode())
		except: return None

		tmp = None; con = None; sli = None

		if slite in self.callback:
			try: tmp = self.callback[slite](par)
			except: tmp = None

		if slite in self.slites:
			try: con = self.slites[slite](par)
			except: con = None
		else:
			try: sli = self.slite(slite)
			except: sli = None

		if con != None or tmp or sli != None:
			hed = self.STR_OK
		else:
			hed = self.STR_NF

		try:

			sock.sendall(hed)
			sock.sendall(self.mime(slite))
			sock.sendall(self.STR_CL)

			if con != None:
				sock.sendall(str(con).encode())

			elif tmp != None:
				sock.sendall(str(tmp).encode())

			elif sli != None:

				buff = sli.read(1024)

				while buff:

					try: sock.sendall(buff)
					except: buff = False
					else: buff = sli.read(1024)

			sock.sendall(b'\r\n')

		except: pass

		finally:

			if sli != None: sli.close()

	def parse(self, req):

		a = req.find('GET /') + 5
		b = req.find(' HTTP', a)

		if a == -1 or b == -1 or a > b:
			return str(), dict()
		else: req = req[a:b]

		par = req.find('?')
		d = self.unquote
		vlist = dict()

		if par != -1:

			slite = d(req[0:par])
			req = req[par+1:]

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

		if path.endswith('.html'):

			try: return open('/http/%s' % path, 'rb')
			except: return None

		elif path.endswith('.css'):

			try: return open('/css/%s' % path, 'rb')
			except: return None

		elif path.endswith('.js'):

			try: return open('/src/%s' % path, 'rb')
			except: return None

		elif path.endswith('.json'):

			try: return open('/etc/%s' % path, 'rb')
			except: return None

		elif path.endswith('.var'):

			try: return open('/var/%s' % path, 'rb')
			except: return None

		else:

			try: return open('/obj/%s' % path, 'rb')
			except: return None

	def mime(self, path):

		ct = b'Content-Type: %s; charset=utf-8\r\n'
		mime = b'text/plain'

		for k, v in self.STR_MIME.items():
			if path.endswith(k):
				mime = v; break

		return ct % mime
