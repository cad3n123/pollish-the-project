document.documentElement.classList.replace('no-js', 'js');

document.addEventListener('DOMContentLoaded', () => {
    const slides = Array.from(document.querySelectorAll('img.slide'));
    const background = document.getElementById('background');
    let index = slides.findIndex(slide => slide.classList.contains('active'));
    let timeout;

    // Preload the click sound once when the page loads
    const clickUrl = './audios/slide_click.m4a';
    let playClick;

    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        let clickBuffer;

        fetch(clickUrl)
            .then(resp => resp.arrayBuffer())
            .then(data => audioCtx.decodeAudioData(data))
            .then(buffer => {
                clickBuffer = buffer;
            })
            .catch(console.error);

        playClick = () => {
            if (!clickBuffer) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const source = audioCtx.createBufferSource();
            source.buffer = clickBuffer;
            source.connect(audioCtx.destination);
            source.start(0);
        };
    } else {
        const clickAudio = new Audio(clickUrl);
        clickAudio.preload = 'auto';
        playClick = () => {
            clickAudio.currentTime = 0;
            clickAudio.play();
        };
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
});
