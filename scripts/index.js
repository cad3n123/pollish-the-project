// Elements
const $main = document.querySelector('main');
const $$slides = Array.from(document.querySelectorAll('img.slide'));
/* Looked up by class, not by index - the slides get reordered from time to
   time and only these two carry a sound. */
const $pollishSlide = document.querySelector('img.slide.pollish');
const $rareroomSlide = document.querySelector('img.slide.rareroom');
const $emailInput = document.getElementById('mce-EMAIL');
const $emailPlaceholderImage = document.getElementById('email-placeholder');
const $countrySelect = document.getElementById('mce-COUNTRY');
const $countryPlaceholder = document.getElementById('country-placeholder');
const $newsletterForm = document.getElementById('mc-embedded-subscribe-form');
const [$socialMediaIcons] = ['social-media-icons'].map((id) =>
  document.getElementById(id)
);
const [$listenBtn, $watchBtn] = ['listen', 'watch'].map((name) =>
  document.getElementById(`${name}-btn`)
);

// Constant Vars
const volume = 0.35;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();

// Global Vars
let flashingInterval = null;
let index = 0;
let currentSource;
let timeout;
let clickBuffer;
let pollishBuffer;
let source;
let linkData = [];

document.documentElement.classList.replace('no-js', 'js');

document.addEventListener('DOMContentLoaded', async () => {
  setCountryList();

  (async () => {
    await fetchLinkData();
    loadYoutubePreviews();
    setNavLinks();
    setSocialLinks();
  })();

  const square = document.getElementById('square');
  index = $$slides.findIndex((slide) => slide.classList.contains('active'));

  gainNode.connect(audioCtx.destination);
  gainNode.gain.value = volume;

  fetch('./audios/slide_click.m4a')
    .then((resp) => resp.arrayBuffer())
    .then((data) => audioCtx.decodeAudioData(data))
    .then((buffer) => {
      clickBuffer = buffer;
    });

  fetch('./audios/pollish.m4a')
    .then((resp) => resp.arrayBuffer())
    .then((data) => audioCtx.decodeAudioData(data))
    .then((buffer) => {
      pollishBuffer = buffer;
    });

  function playPollish() {
    playBuffer(pollishBuffer, true);
  }

  /**
   *
   * @param {string} morse
   * @returns {Array[Array[number]]}
   */
  function morseTiming(morse) {
    const dot = 120;
    const dash = 240;
    const letterGap = 120;

    morse += ' ';
    let times = [];
    for (let i = 0; i < morse.length - 1; i++) {
      let char = morse[i];
      let nextChar = morse[i + 1];
      let length1 = char == '.' ? dot / 2 : dash / 2;
      let length2 = length1 + (nextChar == ' ' ? letterGap : 0);
      times.push([length1, length2]);

      if (nextChar == ' ') {
        i++;
      }
    }

    return times;
  }

  async function flashMorseCode(times) {
    let i = 0;
    let j = 0;
    const startDate = Date.now();
    let offset = 0;

    square.classList.add('translucent');

    flashingInterval = setInterval(() => {
      const currentDate = Date.now();

      while (currentDate - (startDate + offset) > times[i][j]) {
        offset += times[i][j];
        if (j == 0) {
          square.classList.remove('translucent');
        } else if (i + 1 >= times.length) {
          square.classList.remove('translucent');
          clearInterval(flashingInterval);
          flashingInterval = null;
          break;
        } else {
          square.classList.add('translucent');
          i++;
        }
        j = 1 - j;
      }
    }, 1);
  }

  async function playRareroom() {
    const MORSE = '.-. .- .-. . .-. --- --- --';

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    square.classList.remove('translucent');
    if (flashingInterval) {
      clearInterval(flashingInterval);
      flashingInterval = null;
    }

    stopCurrentSound();

    // Fetch and decode the audio file
    const response = await fetch('/audios/RAREROOM MORSE.m4a');
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Create audio source and connect to destination
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    currentSource = source;

    // Schedule playback a short moment into the future
    const startTime = audioCtx.currentTime + 0.3; // small delay for sync
    source.start(startTime);

    // Schedule the flashing to start in sync
    const delayMs = (startTime - audioCtx.currentTime) * 1000;
    setTimeout(() => {
      square.classList.remove('translucent');
      if (flashingInterval) {
        clearInterval(flashingInterval);
        flashingInterval = null;
      }
      flashMorseCode(morseTiming(MORSE));
    }, delayMs);

    currentAudioBufferSource = source;
  }

  document.getElementById('next').addEventListener('click', incrementSlides);

  document.getElementById('prev').addEventListener('click', decrementSlides);

  // Play pollish sound when the lady slide is clicked
  if ($pollishSlide) {
    $pollishSlide.addEventListener('click', playPollish);
  }
  if ($rareroomSlide) {
    $rareroomSlide.addEventListener('click', playRareroom);
  }
  removeCurtainAfterImagesLoad();
});
function playBuffer(buffer, isSlide1) {
  if (!buffer) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  stopCurrentSound();
  if (isSlide1) {
    setPollishArt('pollish_open');
  }
  source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
  currentSource = source;
  source.onended = () => {
    setPollishArt('pollish_closed');
  };
}
function setPollishArt(name) {
  if ($pollishSlide) $pollishSlide.src = `images/${name}.png`;
}
function stopCurrentSound() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) { }
    currentSource = null;
  }
  if (source) {
    source.onended = () => { };
  }
  setPollishArt('pollish_closed');
}
function showSlide(i) {
  stopCurrentSound();
  square.classList.remove('translucent');
  if (flashingInterval) {
    clearInterval(flashingInterval);
    flashingInterval = null;
  }
  $$slides.forEach((slide) => slide.classList.remove('active'));
  clearTimeout(timeout);
  square.classList.add('translucent');
  timeout = setTimeout(() => {
    $$slides[i].classList.add('active');
    square.classList.remove('translucent');
    playClick();
  }, 150);
}
function playClick() {
  playBuffer(clickBuffer, false);
}
function incrementSlides() {
  index = (index + 1) % $$slides.length;
  showSlide(index);
}
function decrementSlides() {
  index = (index - 1 + $$slides.length) % $$slides.length;
  showSlide(index);
}
/* ISO 3166-1, already in alphabetical order.

   This list used to be fetched from restcountries.com, which no longer works
   from a browser. Two separate reasons, either one fatal: v3.1 is deprecated
   and now answers every request with a "please migrate" error, and the
   endpoint 301s to a second host whose redirect response carries no CORS
   header, so the request is blocked before it even arrives. The dropdown was
   left holding only the three countries hard-coded in the markup, and nothing
   said so — the fetch failed silently.

   Kept here instead: no third-party call to go stale, and the options are in
   the DOM on the first frame. */
const COUNTRIES = [
  'Afghanistan', 'Åland Islands', 'Albania', 'Algeria', 'American Samoa',
  'Andorra', 'Angola', 'Anguilla', 'Antarctica', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia',
  'Bonaire, Sint Eustatius and Saba', 'Bosnia and Herzegovina', 'Botswana',
  'Bouvet Island', 'Brazil', 'British Indian Ocean Territory',
  'Brunei Darussalam', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde',
  'Cambodia', 'Cameroon', 'Canada', 'Cayman Islands',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Christmas Island',
  'Cocos (Keeling) Islands', 'Colombia', 'Comoros', 'Congo',
  'Congo, The Democratic Republic of the', 'Cook Islands', 'Costa Rica',
  'Côte d\'Ivoire', 'Croatia', 'Cuba', 'Curaçao', 'Cyprus', 'Czechia',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini',
  'Ethiopia', 'Falkland Islands (Malvinas)', 'Faroe Islands', 'Fiji',
  'Finland', 'France', 'French Guiana', 'French Polynesia',
  'French Southern Territories', 'Gabon', 'Gambia', 'Georgia', 'Germany',
  'Ghana', 'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe',
  'Guam', 'Guatemala', 'Guernsey', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Heard Island and McDonald Islands',
  'Holy See (Vatican City State)', 'Honduras', 'Hong Kong', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle of Man',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jersey', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Macao', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Martinique', 'Mauritania', 'Mauritius', 'Mayotte',
  'Mexico', 'Micronesia, Federated States of', 'Moldova', 'Monaco',
  'Mongolia', 'Montenegro', 'Montserrat', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Caledonia', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norfolk Island', 'North Korea',
  'North Macedonia', 'Northern Mariana Islands', 'Norway', 'Oman', 'Pakistan',
  'Palau', 'Palestine, State of', 'Panama', 'Papua New Guinea', 'Paraguay',
  'Peru', 'Philippines', 'Pitcairn', 'Poland', 'Portugal', 'Puerto Rico',
  'Qatar', 'Réunion', 'Romania', 'Russian Federation', 'Rwanda',
  'Saint Barthélemy', 'Saint Helena, Ascension and Tristan da Cunha',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Martin (French part)',
  'Saint Pierre and Miquelon', 'Saint Vincent and the Grenadines', 'Samoa',
  'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia',
  'Seychelles', 'Sierra Leone', 'Singapore', 'Sint Maarten (Dutch part)',
  'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Georgia and the South Sandwich Islands', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Svalbard and Jan Mayen', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tokelau',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Türkiye', 'Turkmenistan',
  'Turks and Caicos Islands', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States',
  'United States Minor Outlying Islands', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Venezuela', 'Vietnam', 'Virgin Islands, British', 'Virgin Islands, U.S.',
  'Wallis and Futuna', 'Western Sahara', 'Yemen', 'Zambia', 'Zimbabwe',
];

function setCountryList() {
  const select = document.querySelector("select[name='COUNTRY']");
  if (!select) return;

  /* The markup ships United States so the field still works if this never
     runs. It comes out here so the full list doesn't name it twice. The empty
     "select your country" option has no value and stays. */
  [...select.querySelectorAll('option')]
    .filter((option) => option.value)
    .forEach((option) => option.remove());

  const fragment = document.createDocumentFragment();
  COUNTRIES.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    fragment.appendChild(option);
  });
  select.appendChild(fragment);
}
function openNewsletterForm() {
  document.getElementById('shadow').classList.add('active');
  document.getElementById('mc_embed_shell').classList.add('active');
  document.documentElement.style.overflow = 'hidden';
}
function closeNewsletterForm() {
  document.getElementById('shadow').classList.remove('active');
  document.getElementById('mc_embed_shell').classList.remove('active');
  document.documentElement.style.overflow = 'auto';
}
document.getElementById('logo').addEventListener('click', () => {
  const start = window.scrollY;
  const duration = 200;
  const startTime = performance.now();

  function scrollStep(timestamp) {
    const progress = Math.min((timestamp - startTime) / duration, 1);
    window.scrollTo(0, start * (1 - progress));
    if (progress < 1) {
      requestAnimationFrame(scrollStep);
    }
  }

  requestAnimationFrame(scrollStep);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    incrementSlides();
  } else if (event.key === 'ArrowLeft') {
    decrementSlides();
  }
});
$emailInput.addEventListener('input', () => {
  if ($emailInput.value.trim() === '') {
    $emailPlaceholderImage.style.display = 'block';
  } else {
    $emailPlaceholderImage.style.display = 'none';
  }
});
$countrySelect.addEventListener('change', () => {
  if ($countrySelect.value === '') {
    $countryPlaceholder.style.display = 'block';
  } else {
    $countryPlaceholder.style.display = 'none';
  }
});
function removeCurtainAfterImagesLoad() {
  const $$images = [...document.querySelectorAll('img')];

  const proms = $$images.map(($image) => {
    if ($image.complete) {
      return new Promise((res) => res());
    } else {
      return new Promise((res) => ($image.onload = () => res()));
    }
  });

  Promise.all(proms).then((_) => {
    document.getElementById('curtain').classList.remove('active');
  });
}
async function fetchLinkData() {
  const S3_URL =
    'https://rareroom-bucket.s3.us-east-2.amazonaws.com/pollish/data.json';

  try {
    const response = await fetch(S3_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    linkData = data;
  } catch (err) {
    console.error('Failed to fetch data:', err);
  }
}
/* The page always reserves this many video slots, even when the bucket data
   carries fewer links (or drops the youtube-links key altogether) — a slot
   with no link behind it renders as an empty container rather than
   collapsing the section. */
const MIN_YOUTUBE_PREVIEWS = 2;

function loadYoutubePreviews() {
  const links = linkData['youtube-links'] || [];
  const count = Math.max(links.length, MIN_YOUTUBE_PREVIEWS);

  for (let i = 0; i < count; i++) {
    const $videoContainer = document.createElement('div');
    $videoContainer.classList.add('video-container');

    if (links[i]) {
      const $iframe = document.createElement('iframe');
      $iframe.src = links[i];
      $iframe.allowFullscreen = true;
      $videoContainer.appendChild($iframe);
    }

    $main.appendChild($videoContainer);
  }
}
function setNavLinks() {
  [
    {
      $a: $watchBtn,
      link: linkData.watch,
    },
    {
      $a: $listenBtn,
      link: linkData.listen,
    },
  ].forEach(({ $a, link }) => {
    $a.href = link;
    $a.target = '_blank';
    $a.rel = 'noopener noreferrer';
  });
}
function setSocialLinks() {
  const $$socials = [...$socialMediaIcons.querySelectorAll('a')];

  const socialLinks = linkData['social-links'];
  if (socialLinks === undefined) {
    return;
  }

  for (const social in socialLinks) {
    const $social = $$socials.find(($social) =>
      $social.classList.contains(social)
    );
    const href = socialLinks[social];

    if (social === undefined || href === '' || href === undefined) {
      continue;
    }

    $social.href = href;
  }
  $$socials.forEach(($social) => {
    if ($social.href === '' || $social.href === undefined) {
      $social.style.display = 'none';
    }
  });
}
