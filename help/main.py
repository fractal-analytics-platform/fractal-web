import os

def define_env(env):

    @env.macro
    def fractal_link(title, url):
        extra = env.conf['extra']
        enable_links = os.getenv(
          'ENABLE_FRACTAL_LINKS', str(extra['enable_fractal_links']).lower()
        ).lower() == 'true'
        if enable_links:
            base_url = os.getenv('FRACTAL_LINKS_BASE_URL', extra['fractal_links_base_url'])
            if base_url.endswith('/'):
                base_url = base_url[:-1]
            if '"' in base_url or '"' in url or "'" in base_url or "'" in url:
                raise Exception('URL must not contain quotes')
            if '<' in title or '>' in title:
                raise Exception('Title must not contain the following characters: <>')
            if extra['iframe']:
              return f'<a onclick="openFractalPage(event, \'{base_url}{url}\')" href="{base_url}{url}" target="_blank">{title}</a>'
            else:
              return f'<a href="{base_url}{url}">{title}</a>'
        return title
