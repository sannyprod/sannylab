$(document).ready(() => {

    /* ===== L A Z Y   L O A D ===== */
    function initLazyImages(context = document) {
        $(context).find('.lazy-image').each(function () {
            const $img = $(this);
            if ($img.hasClass('loaded')) return;

            const fullImage = new Image();
            fullImage.src = $img.data('full');

            fullImage.onload = () => {
                $img.attr('src', fullImage.src)
                    .removeClass('blurred')
                    .addClass('loaded');
            };
        });
    }
    initLazyImages();

    /* ===== 3D СЛАЙДЕР ===== */
    $('.slider3d').each(function () {
        const $slider = $(this);
        const $slides = $slider.find('.slide');
        const $viewport = $slider.find('.viewport');
        const $prevBtn = $slider.find('.prev');
        const $nextBtn = $slider.find('.next');

        let index = 0, dragStartX = 0, dragDelta = 0, isDragging = false;
        const total = $slides.length;
        const angle = 360 / total;
        const isMobile = window.innerWidth < 768;

        const slideWidth = isMobile ? 180 : 460;

        // уменьшенный радиус для мобилок чтобы не уходило в глубину
        const radius = isMobile
            ? slideWidth * 0.9
            : (slideWidth / (2 * Math.tan(Math.PI / total)));

        const wrap = i => (i % total + total) % total;

        const updateSlides = (offset = 0) => {
            $slides.each(function (i) {
                let diff = i - index + offset;
                if (diff > total / 2) diff -= total;
                if (diff < -total / 2) diff += total;

                const rotation = angle * diff;
                const abs = Math.abs(diff);
                const scale = isMobile
                    ? Math.max(1 - abs * 0.1, 0.75)
                    : Math.max(1 - abs * 0.15, 0.6);

                const blur = isMobile
                    ? Math.min(abs * 1.2, 4)
                    : Math.min(abs * 1.5, 6);

                const opacity = isMobile
                    ? Math.max(1 - abs * 0.15, 0.5)
                    : Math.max(1 - abs * 0.2, 0.3);


                $(this).css({
                    transform: isMobile ? `translate(-50%, -50%) rotateY(${rotation}deg) translateZ(${radius}px) scale(${scale}) ` : `rotateY(${rotation}deg) translateZ(${radius}px) scale(${scale})`,
                    filter: `blur(${blur}px)`,
                    opacity
                });
            });
        };

        const next = () => { index = wrap(index + 1); updateSlides(); };
        const prev = () => { index = wrap(index - 1); updateSlides(); };

        $prevBtn.on('click', prev);
        $nextBtn.on('click', next);

        /* ===== DRAG ===== */
        const startDrag = x => { isDragging = true; dragStartX = x; dragDelta = 0; };
        const moveDrag = x => { if (!isDragging) return; dragDelta = (x - dragStartX) / (window.innerWidth < 768 ? 120 : 200); updateSlides(dragDelta); };
        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            if (dragDelta > 0.3) prev();
            else if (dragDelta < -0.3) next();
            else updateSlides();
        };

        $viewport.on('mousedown', e => startDrag(e.clientX));
        $(window).on('mousemove', e => moveDrag(e.clientX));
        $(window).on('mouseup', endDrag);

        $viewport.on('touchstart', e => startDrag(e.originalEvent.touches[0].clientX));
        $(window).on('touchmove', e => moveDrag(e.originalEvent.touches[0].clientX));
        $(window).on('touchend', endDrag);

        updateSlides();
    });

    /* ===== МОДАЛЬНОЕ ОКНО ===== */
    let currentImages = [], currentIndex = 0;
    const $modal = $('#modal');
    const $modalImg = $('#modal-img');
    const $caption = $('#caption');

    const openModal = () => {
        if (!currentImages.length) return;
        const img = currentImages[currentIndex];
        $modal.addClass('active');
        $modalImg.attr('src', img.src);
        $caption.text(img.alt || "Фотография из портфолио");
    };

    $(document).on('click', '.slider3d .slide', function () {
        const $slider = $(this).closest('.slider3d');
        currentImages = $slider.find('.slide').toArray();
        currentIndex = currentImages.indexOf(this);
        openModal();
    });

    const showNext = () => { currentIndex = (currentIndex + 1) % currentImages.length; openModal(); };
    const showPrev = () => { currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length; openModal(); };

    $('.modal-next').on('click', e => { e.stopPropagation(); showNext(); });
    $('.modal-prev').on('click', e => { e.stopPropagation(); showPrev(); });
    $('.close').on('click', () => $modal.removeClass('active'));
    $modal.on('click', e => { $modal.removeClass('active'); });

    $(document).on('keydown', e => {
        if (!$modal.hasClass('active')) return;
        if (e.key === 'Escape') $modal.removeClass('active');
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });


    const MAX_FILES = 5;
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB

    let filesArray = [];
    let uid = 0;

    $('#images').on('change', function () {
        const selectedFiles = Array.from(this.files);

        $.each(selectedFiles, function (_, file) {

            if (filesArray.length >= MAX_FILES) {
                alert('Максимум 5 изображений');
                return false;
            }

            if (file.size > MAX_SIZE) {
                alert(`"${file.name}" больше 20 МБ`);
                return true;
            }

            if (!file.type.startsWith('image/')) return true;

            const id = uid++;
            filesArray.push({ id, file });

            const reader = new FileReader();
            reader.onload = function (e) {
                $('#preview').append(`
                    <div class="preview-item" data-id="${id}">
                        <img src="${e.target.result}">
                        <button type="button">&times;</button>
                    </div>
                `);
            };
            reader.readAsDataURL(file);
        });

        $(this).val('');
    });

    // удаление без ререндера
    $('#preview').on('click', 'button', function () {
        const item = $(this).closest('.preview-item');
        const id = item.data('id');

        filesArray = filesArray.filter(obj => obj.id !== id);

        item.fadeOut(150, function () {
            $(this).remove();
        });
    });

    $('.contact-form').on('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);

        $.each(filesArray, function (_, file) {
            formData.append('images', file);
        });

        $.ajax({
            url: '/submit',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (resp) { alert('Отправлено'); },
            error: function (err) { alert('Ошибка'); }
        });
    });
});

function openConsentModal() {
    document.getElementById('consentModal').style.display = 'block';
}

function closeConsentModal() {
    document.getElementById('consentModal').style.display = 'none';
}