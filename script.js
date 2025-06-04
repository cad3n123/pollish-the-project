document.documentElement.classList.replace('no-js', 'js');

document.addEventListener('DOMContentLoaded', () => {
    const slides = Array.from(document.querySelectorAll('img.slide'));
    const background = document.getElementById('background');
    let index = slides.findIndex(slide => slide.classList.contains('active'));
    let timeout;

    // Setup audio context and preload the click sound
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let clickBuffer;
    let pollishBuffer;
    let currentSource;

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

    function stopCurrentSound() {
        if (currentSource) {
            try { currentSource.stop(); } catch (e) {}
            currentSource = null;
        }
    }

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

    function playClick() {
        playBuffer(clickBuffer);
    }

    function playPollish() {
        playBuffer(pollishBuffer);
    }

    function showSlide(i) {
        stopCurrentSound();
        slides.forEach(slide => slide.classList.remove('active'));
        clearTimeout(timeout);
        background.classList.add('translucent');
        timeout = setTimeout(() => {
            slides[i].classList.add('active');
            background.classList.remove('translucent');
            playClick();
        }, 150);
    }

    document.getElementById('next').addEventListener('click', () => {
        index = (index + 1) % slides.length;
        showSlide(index);
    });

    document.getElementById('prev').addEventListener('click', () => {
        index = (index - 1 + slides.length) % slides.length;
        showSlide(index);
    });

    // Nav hover behaviour
    document.querySelectorAll('#vertical-nav img').forEach(img => {
        if (img.id === 'logo') {
            return; // handled purely with CSS
        }
        const inverted = img.src;
        const normal = img.dataset.src;
        const showNormal = () => { img.src = normal; };
        const showInverted = () => { img.src = inverted; };
        ['mouseenter', 'mousedown', 'touchstart'].forEach(evt => {
            img.addEventListener(evt, showNormal);
        });
        ['mouseleave', 'touchend', 'touchcancel'].forEach(evt => {
            img.addEventListener(evt, showInverted);
        });
    });
  
    // Play pollish sound when the first slide image is clicked
    if (slides[0]) {
        slides[0].addEventListener('click', playPollish);
    }
});

