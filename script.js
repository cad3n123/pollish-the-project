document.documentElement.classList.replace('no-js', 'js');

document.addEventListener('DOMContentLoaded', () => {
    const slides = Array.from(document.querySelectorAll('img.slide'));
    let index = slides.findIndex(slide => slide.classList.contains('active'));
    let timeout;

    function showSlide(i) {
        slides.forEach(slide => slide.classList.remove('active'));
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            slides[i].classList.add('active');
        }, 500);
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
