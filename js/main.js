$(document).ready(function () {

    /* ===== Lazy load ===== */
    function initLazyImages(context = document) {
        $(context).find('.lazy-image').each(function () {

            const $img = $(this);
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

    initLazyImages();


    /* ===== 3D SLIDER ===== */
    $('.slider3d').each(function () {

        const $slider = $(this);
        const $slides = $slider.find('.slide');
        const $viewport = $slider.find('.viewport');
        const $prevBtn = $slider.find('.prev');
        const $nextBtn = $slider.find('.next');

        let index = 0;
        let dragStartX = 0;
        let dragDelta = 0;
        let isDragging = false;

        const total = $slides.length;
        const angle = 360 / total;
        const slideWidth = 460;
        const radius = slideWidth / (2 * Math.tan(Math.PI / total));

        function wrap(i) {
            return (i % total + total) % total;
        }

        function updateSlides(offset = 0) {

            $slides.each(function (i) {

                let diff = i - index + offset;

                if (diff > total / 2) diff -= total;
                if (diff < -total / 2) diff += total;

                const rotation = angle * diff;
                const abs = Math.abs(diff);

                const scale = Math.max(1 - abs * 0.15, 0.6);
                const blur = Math.min(abs * 1.5, 6);
                const opacity = Math.max(1 - abs * 0.2, 0.3);

                $(this).css({
                    transform: `rotateY(${rotation}deg) translateZ(${radius}px) scale(${scale})`,
                    filter: `blur(${blur}px)`,
                    opacity: opacity
                });

            });

        }

        function next() {
            index = wrap(index + 1);
            updateSlides();
        }

        function prev() {
            index = wrap(index - 1);
            updateSlides();
        }

        $prevBtn.on('click', prev);
        $nextBtn.on('click', next);

        /* ===== DRAG ===== */

        function startDrag(x) {
            isDragging = true;
            dragStartX = x;
            dragDelta = 0;
        }

        function moveDrag(x) {
            if (!isDragging) return;

            dragDelta = (x - dragStartX) / 200;
            updateSlides(dragDelta);
        }

        function endDrag() {
            if (!isDragging) return;
            isDragging = false;

            if (dragDelta > 0.3) prev();
            else if (dragDelta < -0.3) next();
            else updateSlides();
        }

        $viewport.on('mousedown', e => startDrag(e.clientX));
        $(window).on('mousemove', e => moveDrag(e.clientX));
        $(window).on('mouseup', endDrag);

        $viewport.on('touchstart', e => startDrag(e.originalEvent.touches[0].clientX));
        $(window).on('touchmove', e => moveDrag(e.originalEvent.touches[0].clientX));
        $(window).on('touchend', endDrag);

        updateSlides();

    });


    /* ===== MODAL ===== */

    let currentImages = [];
    let currentIndex = 0;

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

    $(document).on('click', '.slider3d .slide', function () {

        const $slider = $(this).closest('.slider3d');
        currentImages = $slider.find('.slide').toArray();
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

    $('.modal-next').on('click', e => {
        e.stopPropagation();
        showNext();
    });

    $('.modal-prev').on('click', e => {
        e.stopPropagation();
        showPrev();
    });

    $('.close').on('click', () => $modal.removeClass('active'));

    $modal.on('click', function (e) {
        if (e.target === this) $modal.removeClass('active');
    });

    $(document).on('keydown', function (e) {
        if (!$modal.hasClass('active')) return;

        if (e.key === 'Escape') $modal.removeClass('active');
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });

});
