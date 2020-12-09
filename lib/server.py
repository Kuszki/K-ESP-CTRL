# coding=UTF-8

import socket, select, gc

class server:

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
		self.sock.listen(15)

		self.poll = select.poll()
		self.poll.register(self.sock, select.POLLIN)

	def stop(self):

		self.sock.close()

		del self.poll
		del self.sock

	def accept(self):

		res = self.poll.poll(1000);

		if not res: return None

		s = self.sock.accept()[0]
		s.settimeout(3)

		try:

			gc.collect()
			self.recv(s)

		except: pass

		finally:

			s.close()
			gc.collect()

	def recv(self, sock):

		try:

			buff = sock.recv(1024).decode()
			slite, par = self.parse(buff)

			del buff; gc.collect()

			self.resp(slite, par, sock)

		except: raise

	def resp(self, slite, par, sock):

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

				del buff

			sock.sendall(b'\r\n')

		except: raise
		finally:

			if sli: sli.close()
			del tmp, con, sli

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

		if path.endswith('.html'): path = '/http/%s' % path
		elif path.endswith('.css'): path = '/css/%s' % path
		elif path.endswith('.js'): path = '/src/%s' % path
		elif path.endswith('.json'): path = '/etc/%s' % path
		elif path.endswith('.var'): path = '/var/%s' % path
		else: path = '/obj/%s' % path

		try: return open(path, 'rb')
		except: return None

	def mime(self, path):

		if path.endswith('.html'): mime = b'text/html'
		elif path.endswith('.css'): mime = b'text/css'
		elif path.endswith('.js'): mime = b'text/javascript'
		elif path.endswith('.ico'): mime = b'image/png'
		elif path.endswith('.var'): mime = b'application/json'
		elif path.endswith('.json'): mime = b'application/json'
		else: mime = b'text/plain'

		return b'Content-Type: %s; charset=utf-8\r\n' % mime
