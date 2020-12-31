# coding=UTF-8

import socket, select, json, gc

class server:

	STR_OK = b'HTTP/1.1 200 OK\r\n'
	STR_NF = b'HTTP/1.1 404 NF\r\n'
	STR_NA = b'HTTP/1.1 406 NA\r\n'

	STR_CL = b'Connection: close\r\n\r\n'

	B_LEN = const(2048)
	Q_LEN = const(25)
	W_LEN = const(1000)

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
		self.sock.bind(('', self.port))
		self.sock.listen(self.Q_LEN)

		self.poll = select.poll()
		self.poll.register(self.sock, select.POLLIN)

	def stop(self):

		self.sock.close()

		del self.poll
		del self.sock

	def accept(self):

		res = self.poll.poll(self.W_LEN)

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

		return True

	def recv(self, sock):

		try:

			try: buff = sock.recv(self.B_LEN)
			except: raise

			while buff.find(b'\r\n\r\n') == -1:
				if not buff: raise BufferError
				else: buff += sock.recv(self.B_LEN)

			if buff.startswith(b'POST /'):
				slite, par = self.post(buff, sock)

			elif buff.startswith(b'GET /'):
				slite, par = self.get(buff)

			else:
				sock.sendall(self.STR_NA)
				sock.sendall(self.STR_CL)

			del buff; gc.collect()

			if slite:
				self.resp(slite, par, sock)

		except: raise

	def resp(self, slite, par, sock):

		tmp = None; con = None; sli = None; mim = None

		if slite in self.callback:
			try: tmp = self.callback[slite](par)
			except: pass

		if slite in self.slites:
			try: con = self.slites[slite](par)
			except: pass

		else:
			try: sli, mim = self.slite(slite)
			except: pass

		if con != None or sli != None or tmp:
			hed = self.STR_OK
		else:
			hed = self.STR_NF

		if mim == None:
			mim = self.mime(slite)

		try:

			sock.sendall(hed)
			sock.sendall(mim)
			sock.sendall(self.STR_CL)

			if con != None:
				sock.sendall(str(con).encode())

			elif sli != None:

				buff = sli.read(self.B_LEN)

				while buff:

					try: sock.sendall(buff)
					except: buff = False
					else: buff = sli.read(self.B_LEN)

				del buff; sli.close()

			elif tmp != None:
				sock.sendall(str(tmp).encode())

		except: raise
		finally:
			del hed, mim, sli, con, tmp

	def get(self, req):

		e = req.find(b'\r\n\r\n')
		a = req.find(b'GET /', 0, e) + 5
		b = req.find(b' HTTP', a, e)

		if a == 4 or b == -1 or a > b:
			return str(), dict()
		else: req = req[a:b]

		par = req.find(b'?')
		d = self.unquote

		if par != -1:

			slite = d(req[0:par])
			req = req[par+1:]
			vlist = self.split(req)

		else:

			slite = d(req)
			vlist = dict()

		if slite == b'':
			slite = 'index.html'
		else:
			slite = slite.decode()

		return slite, vlist

	def post(self, req, sock):

		e = req.find(b'\r\n\r\n')
		a = req.find(b'POST /', 0, e) + 6
		b = req.find(b' HTTP', a, e)
		d = self.unquote

		if a == 5 or b == -1 or a > b:
			return str(), dict()

		elif a == b: slite = 'index.html'
		else: slite = d(req[a:b]).decode()

		j = req.find(b'Content-Type: application/json', b, e)
		p = req.find(b'Content-Type: text/plain', b, e)

		a = req.find(b'Content-Length: ', b, e) + 15
		b = req.find(b'\r\n', a, e)

		if a == 14 or b == -1 or a > b:
			return slite, dict()
		else:
			try: leng = int(req[a:b])
			except: return slite, dict()
			else: req = req[e+4:]

		while len(req) != leng:
			try: req += sock.recv(self.B_LEN)
			except: return slite, dict()

			if not req: raise BufferError

		if j != -1: vlist = json.loads(req)
		elif p != -1: vlist = req.decode()
		else: vlist = self.split(req)

		return slite, vlist

	def unquote(self, string):

		if not string: return bytes()
		if not b'%' in string: return string

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

		return b''.join(res)

	def split(self, string):

		d = self.unquote
		vlist = dict()

		for p in string.split(b'&'):

			if p.find(b'=') != -1:

				i = p.split(b'=')
				k = d(i[0]).decode()
				v = d(i[1]).decode()

				vlist[k] = v

			else:

				k = d(p).decode()
				vlist[k] = None

		return vlist

	def slite(self, path):

		if path == 'favicon.ico': path = '/obj/favicon.ico'

		elif path.endswith('.html'): path = '/http/%s' % path
		elif path.endswith('.json'): path = '/etc/%s' % path
		elif path.endswith('.css'): path = '/css/%s' % path
		elif path.endswith('.js'): path = '/src/%s' % path

		else: path = '/var/%s' % path

		try: return open(path, 'rb'), self.mime(path)
		except: return None, None

	def mime(self, path):

		if path.startswith('/var/'): mime = b'application/json'
		elif path.endswith('.html'): mime = b'text/html'
		elif path.endswith('.json'): mime = b'application/json'
		elif path.endswith('.css'): mime = b'text/css'
		elif path.endswith('.ico'): mime = b'image/png'
		elif path.endswith('.js'): mime = b'text/javascript'

		else: mime = b'text/plain'

		return b'Content-Type: %s; charset=utf-8\r\n' % mime
