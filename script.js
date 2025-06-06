// Global Vars
let flashingInterval = null;

document.documentElement.classList.replace('no-js', 'js');

document.addEventListener('DOMContentLoaded', () => {

    const slides = Array.from(document.querySelectorAll('img.slide'));
    console.log(slides);
    const square = document.getElementById('square');
    let index = slides.findIndex(slide => slide.classList.contains('active'));
    let timeout;

    // Setup audio context and preload the click sound
    const volume = 0.35;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = volume;
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

    function showSlide(i) {
        stopCurrentSound();
        square.classList.remove('translucent');
        if (flashingInterval) {
            clearInterval(flashingInterval);
            flashingInterval = null;
        }
        slides.forEach(slide => slide.classList.remove('active'));
        clearTimeout(timeout);
        square.classList.add('translucent');
        timeout = setTimeout(() => {
            slides[i].classList.add('active');
            square.classList.remove('translucent');
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
  
    // Play pollish sound when the first slide image is clicked
    if (slides[0]) {
        slides[0].addEventListener('click', playPollish);
    }
    if (slides[1]) {
        slides[1].addEventListener('click', playRareroom);
    }
});


