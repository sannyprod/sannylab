$(function () {

    const $win = $(window);
    const isMobile = () => window.innerWidth < 768;

    /* ===== LAZY LOAD ===== */
    function initLazyImages(ctx = document) {
        $('.lazy-image', ctx).not('.loaded').each(function () {
            const $img = $(this);
            const img = new Image();

            img.onload = () => {
                $img.attr('src', img.src)
                    .removeClass('blurred')
                    .addClass('loaded');
            };

            img.src = $img.data('full');
        });
    }
    initLazyImages();

    /* ===== 3D SLIDER ===== */
    $('.slider3d').each(function () {

        const $slider = $(this);
        const $slides = $slider.find('.slide');
        const $viewport = $slider.find('.viewport');

        let index = 0;
        let dragStartX = 0;
        let dragDelta = 0;
        let dragging = false;

        const total = $slides.length;
        const angle = 360 / total;

        const slideWidth = isMobile() ? 180 : 460;
        const radius = isMobile()
            ? slideWidth * 0.9
            : slideWidth / (2 * Math.tan(Math.PI / total));

        const wrap = i => (i + total) % total;

        function update(offset = 0) {
            const mobile = isMobile();

            $slides.each(function (i) {
                let diff = i - index + offset;
                if (diff > total / 2) diff -= total;
                if (diff < -total / 2) diff += total;

                const abs = Math.abs(diff);

                $(this).css({
                    transform: mobile
                        ? `translate(-50%, -50%) rotateY(${angle * diff}deg) translateZ(${radius}px) scale(${Math.max(1 - abs * 0.1, 0.75)})`
                        : `rotateY(${angle * diff}deg) translateZ(${radius}px) scale(${Math.max(1 - abs * 0.15, 0.6)})`,
                    filter: `blur(${Math.min(abs * (mobile ? 1.2 : 1.5), mobile ? 4 : 6)}px)`,
                    opacity: Math.max(1 - abs * (mobile ? 0.15 : 0.2), mobile ? 0.5 : 0.3)
                });
            });
        }

        const next = () => { index = wrap(index + 1); update(); };
        const prev = () => { index = wrap(index - 1); update(); };

        $slider.find('.next').on('click', next);
        $slider.find('.prev').on('click', prev);

        /* ===== DRAG ===== */
        function start(x) {
            dragging = true;
            dragStartX = x;
            dragDelta = 0;
        }

        function move(x) {
            if (!dragging) return;
            dragDelta = (x - dragStartX) / (isMobile() ? 120 : 200);
            update(dragDelta);
        }

        function end() {
            if (!dragging) return;
            dragging = false;

            if (dragDelta > 0.3) prev();
            else if (dragDelta < -0.3) next();
            else update();
        }

        $viewport.on('mousedown touchstart', e =>
            start(e.clientX || e.originalEvent.touches[0].clientX)
        );

        $win.on('mousemove touchmove', e =>
            move(e.clientX || e.originalEvent.touches[0].clientX)
        );

        $win.on('mouseup touchend', end);

        update();
    });

    /* ===== MODAL ===== */
    const $modal = $('#modal');
    const $modalImg = $('#modal-img');
    const $caption = $('#caption');

    let images = [];
    let current = 0;

    function openModal() {
        if (!images.length) return;
        const img = images[current];
        $modal.addClass('active');
        $modalImg.attr('src', img.src);
        $caption.text(img.alt || 'Фотография из портфолио');
    }

    function nextImg() {
        current = (current + 1) % images.length;
        openModal();
    }

    function prevImg() {
        current = (current - 1 + images.length) % images.length;
        openModal();
    }

    $(document).on('click', '.slider3d .slide', function () {
        images = $(this).closest('.slider3d').find('.slide').toArray();
        current = images.indexOf(this);
        openModal();
    });

    $('.modal-next').on('click', e => { e.stopPropagation(); nextImg(); });
    $('.modal-prev').on('click', e => { e.stopPropagation(); prevImg(); });
    $('.close, #modal').on('click', () => $modal.removeClass('active'));

    $(document).on('keydown', e => {
        if (!$modal.hasClass('active')) return;
        if (e.key === 'Escape') $modal.removeClass('active');
        if (e.key === 'ArrowRight') nextImg();
        if (e.key === 'ArrowLeft') prevImg();
    });

    /* ===== PHONE MASK ===== */
    $('#phone').on('input', function () {
        this.value = this.value.replace(/[^0-9+\-()\s]/g, '');
    });

    /* ===== FILE UPLOAD ===== */
    const MAX_FILES = 5;
    const MAX_SIZE = 20 * 1024 * 1024;

    let files = [];
    let uid = 0;

    $('#images').on('change', function () {
        [...this.files].some(file => {

            if (files.length >= MAX_FILES) {
                alert('Максимум 5 изображений');
                return true;
            }

            if (!file.type.startsWith('image/') || file.size > MAX_SIZE) {
                alert(`"${file.name}" больше 20 МБ`);
                return false;
            }

            const id = uid++;
            files.push({ id, file });

            const reader = new FileReader();
            reader.onload = e => {
                $('#preview').append(`
                    <div class="preview-item" data-id="${id}">
                        <img src="${e.target.result}">
                        <button type="button">&times;</button>
                    </div>
                `);
            };
            reader.readAsDataURL(file);
        });

        this.value = '';
    });

    $('#preview').on('click', 'button', function () {
        const $item = $(this).closest('.preview-item');
        const id = $item.data('id');

        files = files.filter(f => f.id !== id);
        $item.fadeOut(150, () => $item.remove());
    });

    /* ===== FORM ===== */
    $('.contact-form').on('submit', function (e) {
        e.preventDefault();
        showLoader('ИИ обрабатывает изображение...');

        const formData = new FormData(this);
        files.forEach(f => formData.append('images', f.file));

        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }

        $.ajax({
            url: '/api/submit',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false
        })
            .done(() => {
                hideLoader();
                showToast('Данные успешно отправлены.', 'success');
            })
            .fail(() => {
                hideLoader();
                showToast('Ошибка отправки. Напишите в Telegram @Sannyprod', 'error');
            })
    });

    /* ===== UI ===== */
    function showLoader(text) {
        $('#loader-modal p').text(text).parent().fadeIn(200);
    }

    function hideLoader() {
        $('#loader-modal').fadeOut(200);
    }

    let toastTimer;
    function showToast(msg, type = 'info', time = 5000) {
        const $toast = $('#toast');
        clearTimeout(toastTimer);

        $toast.removeClass('success error info show')
            .find('.toast-text').text(msg);

        requestAnimationFrame(() => $toast.addClass(type).addClass('show'));
        toastTimer = setTimeout(() => $toast.removeClass('show'), time);
    }

    $('#toast').on('click', () => $('#toast').removeClass('show'));
});

/* ===== CONSENT ===== */
function openConsentModal() {
    $('#consentModal').show();
}
function closeConsentModal() {
    $('#consentModal').hide();
}

/* ===== OFFER ===== */
function openOfferModal() {
    $('#offerModal').show();
}
function closeOfferModal() {
    $('#offerModal').hide();
}