import os

def define_env(env):

    @env.macro
    def fractal_link(title, url):
        extra = env.conf['extra']
        enable_links = os.getenv(
          'ENABLE_FRACTAL_LINKS', str(extra['enable_fractal_links']).lower()
        ).lower() == 'true'
        fractal_links_target_blank = os.getenv(
          'FRACTAL_LINKS_TARGET_BLANK', str(extra['fractal_links_target_blank']).lower()
        ).lower() == 'true'
        if enable_links:
            base_url = os.getenv('FRACTAL_LINKS_BASE_URL', extra['fractal_links_base_url'])
            if base_url.endswith('/'):
                base_url = base_url[:-1]
            if '"' in base_url or '"' in url or "'" in base_url or "'" in url:
                raise Exception('URL must not contain quotes')
            if '<' in title or '>' in title:
                raise Exception('Title must not contain the following characters: <>')
            if fractal_links_target_blank:
              return f'<a class="fractal-link" href="{base_url}{url}" target="_blank">{title}</a>'
            else:
              return f'<a class="fractal-link" href="{base_url}{url}">{title}</a>'
        return title

    @env.macro
    def youtube_video(video_id: str, title: str):
        return f"""
<div class="youtube-facade">
  <div class="player-icon">
    <svg width="68" height="48" viewBox="0 0 68 48">
      <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/>
      <path d="M45 24L27 14v20" fill="white"/>
    </svg>
  </div>
  <div class="video-title">{title}</div>
  <div class="consent-text" id="consent-text-{video_id}">
    By clicking, you agree to load content from YouTube.
  </div>
  <button type="button" onclick="loadYouTubeVideo(event, '{video_id}')" aria-labelledby="consent-text-{video_id}"></button>
</div>
        """
