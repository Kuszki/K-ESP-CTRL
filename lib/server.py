# coding=UTF-8

import socket, select, json, gc, os
import utime

class server:

	STR_OK = b'HTTP/1.1 200 OK'
	STR_NF = b'HTTP/1.1 404 NF'
	STR_NA = b'HTTP/1.1 406 NA'

	STR_CO = b'Connection: keep-alive'

	STR_CL = b'Content-Length: %s'
	STR_CT = b'Content-Type: %s'

	STR_EN = b'\r\n'

	B_LEN = const(4096)
	W_LEN = const(1000)
	Q_LEN = const(25)

	def __init__(self, port = 80):

		self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

		self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
		self.sock.bind(('', port))
		self.sock.listen(self.Q_LEN)

		self.poll = select.poll()
		self.poll.register(self.sock, select.POLLIN)

		self.slites = dict()
		self.cons = list()

	def accept(self):

		res = self.poll.poll(self.W_LEN)

		if not res: return None
		for k in res:

			if k[0] != self.sock: s = k[0]
			else: return self.connect()

			try: buff = s.recv(self.B_LEN)
			except: self.disconnect(s)
			else:

				if not buff: self.disconnect(s)
				else:

					try: self.recv(s, buff)
					except: self.disconnect(s)

	def connect(self):

		s = self.sock.accept()[0]
		s.settimeout(3)

		self.poll.register(s, select.POLLIN)
		self.cons.append(s)

	def disconnect(self, sock):

		self.poll.unregister(sock)
		self.cons.remove(sock)

		sock.close()
		gc.collect()

	def recv(self, sock, buff):

		try:

			while buff.find(b'\r\n\r\n') == -1:
				if not buff: raise BufferError
				else: buff += sock.recv(self.B_LEN)

			if buff.startswith(b'POST /'):
				slite, par = self.post(buff, sock)

			elif buff.startswith(b'GET /'):
				slite, par = self.get(buff)

			else: sefl.nvalid(sock);

			if slite:
				self.resp(slite, par, sock)

		except: raise

	def resp(self, slite, par, sock):

		con = sli = mim = siz = res = None

		if slite in self.slites:
			try: con = self.slites[slite](par)
			except: return self.nfound(sock)

		else:
			try: sli, mim, siz = self.slite(slite)
			except: return self.nfound(sock)

		if con != None: res = str(con).encode()
		if mim == None: mim = self.mime(slite)
		if siz == None: siz = len(res)

		try:

			try: self.vheader(sock, siz, mim)
			except: raise

			if res != None: sock.sendall(res)
			elif sli != None:

				with open(sli, 'r') as f:

					try: buff = f.read(self.B_LEN)
					except: buff = False

					while buff:
						try: sock.sendall(buff)
						except: buff = False
						else: buff = f.read(self.B_LEN)

		except: raise

	def nfound(self, sock):

		sock.sendall(self.STR_NF)
		sock.sendall(self.STR_EN)
		sock.sendall(self.STR_CO)
		sock.sendall(self.STR_EN)
		sock.sendall(self.STR_EN)

	def nvalid(self, sock):

		sock.sendall(self.STR_NA)
		sock.sendall(self.STR_EN)
		sock.sendall(self.STR_CO)
		sock.sendall(self.STR_EN)

	def vheader(self, sock, size, mime):

		sock.sendall(self.STR_OK)
		sock.sendall(self.STR_EN)
		sock.sendall(self.STR_CO)
		sock.sendall(self.STR_EN)
		sock.sendall(self.STR_CL % size)
		sock.sendall(self.STR_EN)
		sock.sendall(self.STR_CT % mime)
		sock.sendall(self.STR_EN)
		sock.sendall(self.STR_EN)

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

		j = req.find(self.STR_CT % b'application/json', b, e)
		p = req.find(self.STR_CT % b'text/plain', b, e)
		a = req.find(self.STR_CL % b'', b, e) + 15
		b = req.find(self.STR_EN, a, e)

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

		try:

			mime = self.mime(path)
			size = os.stat(path)[6]

		except: raise
		else: return path, mime, size

	def mime(self, path):

		if path.startswith('/var/'): mime = b'application/json'
		elif path.endswith('.html'): mime = b'text/html'
		elif path.endswith('.json'): mime = b'application/json'
		elif path.endswith('.css'): mime = b'text/css'
		elif path.endswith('.ico'): mime = b'image/png'
		elif path.endswith('.js'): mime = b'text/javascript'

		else: mime = b'text/plain'

		return b'%s; charset=utf-8' % mime

	def defslite(self, slite, callback):

		self.slites[slite] = callback

	def rmslite(self, slite):

		del self.slites[slite]
