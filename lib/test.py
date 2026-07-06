from server import server

s = server(port = 8080)

s.defslite('test.txt', lambda v: "asdasdasd")

while True:

	s.accept()
