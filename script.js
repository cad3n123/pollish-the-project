document.documentElement.classList.replace('no-js', 'js');

document.addEventListener('DOMContentLoaded', () => {
    const slides = Array.from(document.querySelectorAll('img.slide'));
    const background = document.getElementById('background');
    let index = slides.findIndex(slide => slide.classList.contains('active'));
    let timeout;

    // Setup audio context and preload the click sound
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let clickBuffer;

    fetch('./audios/slide_click.m4a')
        .then(resp => resp.arrayBuffer())
        .then(data => audioCtx.decodeAudioData(data))
        .then(buffer => {
            clickBuffer = buffer;
        });

    function playClick() {
        if (!clickBuffer) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const source = audioCtx.createBufferSource();
        source.buffer = clickBuffer;
        source.connect(audioCtx.destination);
        source.start();
    }

    function showSlide(i) {
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
});
