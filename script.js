// Elements
const $$slides = Array.from(document.querySelectorAll('img.slide')); 
const $emailInput = document.getElementById('mce-EMAIL');
const $emailPlaceholderImage = document.getElementById('email-placeholder');
const $countrySelect = document.getElementById('mce-COUNTRY');
const $countryPlaceholder = document.getElementById('country-placeholder');
const $newsletterForm = document.getElementById('mc-embedded-subscribe-form');

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

document.documentElement.classList.replace('no-js', 'js');

document.addEventListener('DOMContentLoaded', () => {
    setCountryList();

    const square = document.getElementById('square');
    index = $$slides.findIndex(slide => slide.classList.contains('active'));

    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = volume;

    fetch('./audios/slide_click.m4a')
        .then(resp => resp.arrayBuffer())
        .then(data => audioCtx.decodeAudioData(data))
        .then(buffer => {
            clickBuffer = buffer;
        });

    fetch('./audios/pollish.m4a')
        .then(resp => resp.arrayBuffer())
        .then(data => audioCtx.decodeAudioData(data))
        .then(buffer => {
            pollishBuffer = buffer;
        });

    function playPollish() {
        playBuffer(pollishBuffer);
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

        morse += " ";
        let times = [];
        for (let i = 0; i < morse.length - 1; i++) {
            let char = morse[i];
            let nextChar = morse[i + 1];
            let length1 = char == "." ? dot / 2 : dash / 2;
            let length2 = length1 + (nextChar == " " ? letterGap : 0);
            times.push([length1, length2]);

            if (nextChar == " ") {
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
                    square.classList.remove('translucent');;
                } else if (i + 1 >= times.length) {
                    square.classList.remove('translucent');;
                    clearInterval(flashingInterval);
                    flashingInterval = null;
                    break;
                } else {
                    square.classList.add('translucent');;
                    i++;
                }
                j = 1 - j;
            }
        }, 1);
    }

    async function playRareroom() {
        const MORSE = ".-. .- .-. . .-. --- --- --";

        if (audioCtx.state === "suspended") {
            await audioCtx.resume();
        }

        square.classList.remove('translucent');
        if (flashingInterval) {
            clearInterval(flashingInterval);
            flashingInterval = null;
        }

        stopCurrentSound();

        // Fetch and decode the audio file
        const response = await fetch("/audios/RAREROOM MORSE.m4a");
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
  
    // Play pollish sound when the first slide image is clicked
    if ($$slides[0]) {
        $$slides[0].addEventListener('click', playPollish);
    }
    if ($$slides[1]) {
        $$slides[1].addEventListener('click', playRareroom);
    }
    // setTimeout(() => {
        document.getElementById('curtain').classList.remove('active');
    // }, 0);
});
function playBuffer(buffer) {
    if (!buffer) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    stopCurrentSound();
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    currentSource = source;
}
function stopCurrentSound() {
    if (currentSource) {
        try { currentSource.stop(); } catch (e) {}
        currentSource = null;
    }
}
function showSlide(i) {
    stopCurrentSound();
    square.classList.remove('translucent');
    if (flashingInterval) {
        clearInterval(flashingInterval);
        flashingInterval = null;
    }
    $$slides.forEach(slide => slide.classList.remove('active'));
    clearTimeout(timeout);
    square.classList.add('translucent');
    timeout = setTimeout(() => {
        $$slides[i].classList.add('active');
        square.classList.remove('translucent');
        playClick();
    }, 150);
}
function playClick() {
    playBuffer(clickBuffer);
}
function incrementSlides() {
    index = (index + 1) % $$slides.length;
    showSlide(index);
}
function decrementSlides() {
    index = (index - 1 + $$slides.length) % $$slides.length;
    showSlide(index);
}
function setCountryList() {
    fetch("https://restcountries.com/v3.1/all?fields=name")
        .then((res) => res.json())
        .then((data) => {
            const select = document.querySelector("select[name='COUNTRY']");
            data
            .sort((a, b) => a.name.common.localeCompare(b.name.common))
            .forEach((country) => {
                const opt = document.createElement("option");
                opt.value = country.name.common;
                opt.textContent = country.name.common;
                select.appendChild(opt);
            });
        });
}
function openNewsletterForm() {
    document.getElementById('shadow').classList.add('active');
    document.getElementById('mc_embed_shell').classList.add('active');
}
function closeNewsletterForm() {
    document.getElementById('shadow').classList.remove('active');
    document.getElementById('mc_embed_shell').classList.remove('active');
}
document.getElementById('logo').addEventListener('click', () => {
  const start = window.scrollY;
  const duration = 200; // faster scroll back to top
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

document.getElementById('watch-btn').addEventListener('click', () => {
  window.location.href = 'https://youtube.com/@logangladden?si=z2cRRmd4J6Z_atsu';
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
$newsletterForm.addEventListener('submit', (event) => {
  if ($countrySelect.value === '') {
    event.preventDefault(); // stop the form from submitting
  }
});