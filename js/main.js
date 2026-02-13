let currentImages = [];
let currentIndex = 0;

document.addEventListener('click', e => {
    if (!e.target.classList.contains('filter-btn')) return;

    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

    const filter = e.target.dataset.filter;
    e.target.classList.add('active');

    // Скрываем/показываем элементы
    document.querySelectorAll('.gallery-item').forEach(item => {
        if (filter === 'all' || item.classList.contains(filter)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
});

$(document).on('click', 'a[href^="#"]', function (e) {
    const target = $(this.getAttribute('href'));

    // Если якорь найден и не пустой
    if (target.length) {
        e.preventDefault();

        // Плавный скролл с учётом высоты fixed-хедера (если есть)
        $('html, body').animate({
            scrollTop: target.offset().top - 80 // <- корректировка под твой хедер
        }, 600);
    }
});

$(document).ready(function () {
    // $('.lazy-image').each(function () {
    //     const $img = $(this);
    //     const fullImage = new Image();

    //     fullImage.src = $img.data('full');

    //     fullImage.onload = function () {
    //         $img
    //             .attr('src', fullImage.src)
    //             .removeClass('blurred')
    //             .addClass('loaded');
    //     };
    // });

    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50;
    let isSwiping = false;

    function initLazyImages(context = document) {
        $(context).find('.lazy-image').each(function () {

            const $img = $(this);

            // если уже загружено — пропускаем
            if ($img.hasClass('loaded')) return;

            const fullImage = new Image();
            fullImage.src = $img.data('full');

            fullImage.onload = function () {
                $img
                    .attr('src', fullImage.src)
                    .removeClass('blurred')
                    .addClass('loaded');
            };
        });
    }

    // Инициализация всех каруселей на странице
    $('.carousel-wrapper').each(function () {
        initCarousel($(this));
    });

    function initCarousel($carousel) {

        const $viewport = $carousel.find('.carousel-viewport');
        const $track = $carousel.find('.carousel-track');
        const $slides = $track.children();
        const $next = $carousel.find('.next');
        const $prev = $carousel.find('.prev');

        if ($slides.length < 2) return;

        let slideWidth = $slides.eq(0).outerWidth();
        let gap = getGap();
        let fullSlideWidth = slideWidth + gap;
        let visibleSlides = Math.round($viewport.width() / slideWidth);

        // Клонируем последние N в начало
        const $firstClones = $slides.slice(0, visibleSlides).clone();
        const $lastClones = $slides.slice(-visibleSlides).clone();

        $track.prepend($lastClones);
        $track.append($firstClones);
        initLazyImages($track);

        let totalSlides = $track.children().length;
        let currentIndex = visibleSlides;

        function updatePosition(animated = true) {
            const offset = -currentIndex * fullSlideWidth;

            if (!animated) {
                $track.css('transition', 'none');
            } else {
                $track.css('transition', 'transform 0.5s ease');
            }

            $track.css('transform', `translateX(${offset}px)`);
        }

        function nextSlide() {
            currentIndex++;
            updatePosition();

            if (currentIndex >= totalSlides - visibleSlides) {
                setTimeout(() => {
                    currentIndex = visibleSlides;
                    updatePosition(false);
                }, 500);
            }
        }

        function prevSlide() {
            currentIndex--;
            updatePosition();

            if (currentIndex < visibleSlides) {
                setTimeout(() => {
                    currentIndex = visibleSlides + (totalSlides - visibleSlides * 2) - 1;
                    updatePosition(false);
                }, 500);
            }
        }

        function getGap() {
            return parseInt(window.getComputedStyle($track[0]).columnGap) || 0;
        }

        $next.on('click', nextSlide);
        $prev.on('click', prevSlide);

        $(window).on('resize', function () {
            slideWidth = $track.children().eq(0).outerWidth();
            gap = getGap();
            fullSlideWidth = slideWidth + gap;
            updatePosition(false);
        });

        updatePosition(false);
    }

    /* --- МОДАЛЬНОЕ ОКНО (без изменений в логике, только jQuery) --- */
    const $modal = $('#modal');
    const $modalImg = $('#modal-img');
    const $caption = $('#caption');

    function openModal() {
        if (!currentImages.length) return;

        const img = currentImages[currentIndex];

        $modal.addClass('active');
        $modalImg.attr('src', img.src);
        $caption.text(img.alt || "Фотография из портфолио");
    }

    // Открыть модалку при клике на фото внутри каруселей
    $(document).on('click', '.carousel-track img', function () {
        const $clickedImage = $(this);
        const $carousel = $clickedImage.closest('.carousel-wrapper');
        console.log($carousel)
        // Берём только оригинальные изображения (без клонов)
        currentImages = $carousel.find('.carousel-track img').not('.cloned').toArray();

        currentIndex = currentImages.indexOf(this);

        openModal();
    });

    function showNext() {
        currentIndex = (currentIndex + 1) % currentImages.length;
        openModal();
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        openModal();
    }

    $('.modal-next').on('click', function (e) {
        e.stopPropagation();
        showNext();
    });

    $('.modal-prev').on('click', function (e) {
        e.stopPropagation();
        showPrev();
    });

    // Закрыть при клике на крестик
    $('.close').on('click', function () {
        $modal.removeClass('active');
    });

    // Закрыть при клике в любом месте модалки (кроме картинки)
    $modal.on('click', function (e) {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        if (isMobile) {
            if (e.target === this && !isSwiping) {
                $(this).removeClass('active');
            }
        } else {
            $(this).removeClass('active');
        }
    });

    // Закрытие по Escape
    $(document).on('keydown', function (e) {
        if (!$modal.is(':visible')) return;

        if (e.key === 'Escape') {
            $modal.removeClass('active');
        }

        if (e.key === 'ArrowRight') {
            showNext();
        }

        if (e.key === 'ArrowLeft') {
            showPrev();
        }
    });

    // Свайп для мобильных
    $modal.on('touchstart', function (e) {
        touchStartX = e.originalEvent.touches[0].clientX;
    });

    $modal.on('touchend', function (e) {
        touchEndX = e.originalEvent.changedTouches[0].clientX;
        handleSwipe();
    });

    function handleSwipe() {
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) < swipeThreshold) return;

        isSwiping = true;

        if (diff > 0) {
            showNext();
        } else {
            showPrev();
        }

        setTimeout(() => {
            isSwiping = false;
        }, 300);
    }

    initLazyImages();
});