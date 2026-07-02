from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial

PORT = 8001
DIRECTORY = "./site"

class DocsPreviewServer(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add COEP/CORP headers so the local docs site can be embedded in an
        # iframe without browser cross-origin blocking during preview/testing.
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        super().end_headers()

handler = partial(DocsPreviewServer, directory=DIRECTORY)
print(f"Serving on port {PORT}...")
ThreadingHTTPServer(("0.0.0.0", PORT), handler).serve_forever()
