def define_env(env):

    @env.macro
    def fractal_link(title, url):
        if env.variables.enable_fractal_links:
            base_url = env.variables.fractal_links_base_url
            if base_url.endswith('/'):
                base_url = base_url[:-1]
            if '"' in base_url or '"' in url:
                raise Exception('URL must not contain double quotes')
            if '<' in title or '>' in title:
                raise Exception('Title must not contain the following characters: <>')
            return f'<a href="{base_url}{url}" target="_blank">{title}</a>'
        return title
