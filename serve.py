from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
import webbrowser
root=Path(__file__).resolve().parent/'dist'
server=ThreadingHTTPServer(('127.0.0.1',8000),partial(SimpleHTTPRequestHandler,directory=str(root)))
print('Circular Lab: http://localhost:8000 — Ctrl+C to stop')
webbrowser.open('http://localhost:8000')
try: server.serve_forever()
except KeyboardInterrupt: server.server_close()
