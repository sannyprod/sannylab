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
                    currentIndex = totalSlides - visibleSlides * 2;
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

    // Открыть модалку при клике на фото внутри каруселей
    $(document).on('click', '.carousel-track img', function () {
        if (!$modal.length) return; // защита, если нет модалки
        $modal.show();
        $modalImg.attr('src', this.src);
        $caption.text(this.alt || "Фотография из портфолио");
    });

    // Закрыть при клике на крестик
    $('.close').on('click', function () {
        $modal.hide();
    });

    // Закрыть при клике в любом месте модалки (кроме картинки)
    $modal.on('click', function (e) {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        if (isMobile) {
            if (e.target === this) {
                $(this).hide();
            }
        } else {
            $(this).hide();
        }
    });

    // Закрытие по Escape
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $modal.is(':visible')) {
            $modal.hide();
        }
    });
});