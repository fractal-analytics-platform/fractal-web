
* `FRACTALWEBPORT=5175` (for instance)
* `DOMAIN=something.ch` (for instance)

```
LoadModule proxy_http_module /usr/lib/apache2/modules/mod_proxy_http.so

<VirtualHost *:443>
    ServerName https://DOMAIN

    SSLEngine on
    SSLProxyEngine on

    SSLCertificateFile /some/path/to/file1.pem
    SSLCertificateKeyFile /some/path/to/file2.pem
    SSLCertificateChainFile /some/path/to/file3.pem

    ProxyPass / http://127.0.0.1:FRACTALWEBPORT/
    ProxyPassReverse / http://127.0.0.1:FRACTALWEBPORT/

    # These RequestHeader are not needed. Perhaps this is due to the fact that we run the node server with
    # PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host ... node build
    # RequestHeader set X-Forwarded-Proto "https"
    # RequestHeader set X-Forwarded-Port "443"
</VirtualHost>
```
