import http from 'node:http';

http
	.createServer((req, res) => {
		const proxyReq = http.request(
			'http://oauth2:5556' + req.url,
			{
				method: req.method,
				headers: req.headers
			},
			(proxyRes) => {
				res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
				proxyRes.pipe(res);
			}
		);

		req.pipe(proxyReq);

		proxyReq.on('error', (err) => {
			res.writeHead(500);
			res.end('Proxy Error: ' + err.message);
		});
	})
	.listen(5556, '127.0.0.1');
