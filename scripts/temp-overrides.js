/* ============================================================
 * TEMPORARY — remove this file and its two <link>/<script> tags
 * in index.html (search "TEMPORARY") to restore normal behavior.
 * Nothing else in the codebase needs to change.
 *
 * 1. The Listen nav button opens the newsletter/commit popup
 *    instead of linking out.
 * 2. The YouTube embeds are replaced by "soon" placeholder boxes.
 * ============================================================ */

// Loaded after index.js, so these reassignments replace the originals
// before DOMContentLoaded runs them.

loadYoutubePreviews = function () {
  const links = linkData['youtube-links'] || [];
  const count = Math.max(links.length, MIN_YOUTUBE_PREVIEWS);

  for (let i = 0; i < count; i++) {
    const $placeholder = document.createElement('div');
    $placeholder.classList.add('video-container', 'video-placeholder');
    $placeholder.textContent = 'soon';
    $main.appendChild($placeholder);
  }
};

setNavLinks = function () {
  $listenBtn.removeAttribute('href');
  $listenBtn.removeAttribute('target');
  $listenBtn.removeAttribute('rel');
};

document.addEventListener('DOMContentLoaded', () => {
  $listenBtn.addEventListener('click', (event) => {
    event.preventDefault();
    openNewsletterForm();
  });
});
