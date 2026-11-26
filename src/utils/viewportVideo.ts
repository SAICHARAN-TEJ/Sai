/**
 * Pauses editorial background/showcase <video> elements when scrolled outside
 * the viewport and resumes playback when visible, reducing off-screen CPU &
 * battery usage without affecting user-opened fullscreen modals.
 */
export function observeViewportVideos(root: HTMLElement): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    return () => {};
  }

  const videos = Array.from(
    root.querySelectorAll<HTMLVideoElement>('video[data-viewport-video]'),
  );
  if (videos.length === 0) {
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.dataset.playbackState = 'playing';
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
              // Ignore autoplay rejections in headless or strict-policy browsers
            });
          }
        } else {
          video.dataset.playbackState = 'paused';
          if (!video.paused) {
            video.pause();
          }
        }
      }
    },
    { rootMargin: '140px 0px', threshold: 0.01 },
  );

  for (const video of videos) {
    observer.observe(video);
  }

  return () => {
    observer.disconnect();
  };
}
