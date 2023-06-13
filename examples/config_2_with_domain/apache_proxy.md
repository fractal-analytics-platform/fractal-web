Notes:
* 5174 is the port used for fractal-web
* http://fractal.XXX.ch is the domain to be used

---

A minimal example of `/etc/apache2/sites-available/fractal-web.conf` file looks like
```
LoadModule proxy_http_module /usr/lib/apache2/modules/mod_proxy_http.so

<VirtualHost *:80>
    ServerName  http://fractal.XXX.ch
    ProxyPass / http://127.0.0.1:5174/
    ProxyPassReverse / http://127.0.0.1:5174/
</VirtualHost>
```

After creating this file, we restart apache via
```
sudo apache2ctl restart
```

If both fractal-web and fractal-server are up and running, then the `status` command should look like this:
```
$ sudo apache2ctl status
  * Home

  * Login

Fractal web client

Login

Email address [                    ]
The email you provided to the IT manager
undefined
Password [                    ]
Submit
Fractal Analytics Platform
1.3.0a2
testing

  *  
```
Note that the fractal-server version (`1.3.0a2`, in this case) is obtained through a call to the endpoint.
