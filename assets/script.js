/* =============================================
   ClimaConfort Theme - Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* --- Mobile Menu --- */
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
      mainNav.classList.toggle('is-open');
      const isOpen = mainNav.classList.contains('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', function (e) {
      if (!menuToggle.contains(e.target) && !mainNav.contains(e.target)) {
        mainNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });
  }

  /* --- Sticky Header Shadow --- */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        header.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }

  /* --- FAQ Accordion --- */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = this.closest('.faq-item');
      const isActive = item.classList.contains('active');

      // Close all siblings in the same category
      const category = item.closest('.faq-category');
      if (category) {
        category.querySelectorAll('.faq-item.active').forEach(function (openItem) {
          openItem.classList.remove('active');
          openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
      }

      if (!isActive) {
        item.classList.add('active');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* --- Quantity Selectors --- */
  document.querySelectorAll('.quantity-selector').forEach(function (selector) {
    const input = selector.querySelector('.quantity-input');
    const minusBtn = selector.querySelector('[data-action="minus"]');
    const plusBtn = selector.querySelector('[data-action="plus"]');

    if (minusBtn && plusBtn && input) {
      minusBtn.addEventListener('click', function () {
        const val = parseInt(input.value, 10);
        if (val > 1) {
          input.value = val - 1;
          input.dispatchEvent(new Event('change'));
        }
      });

      plusBtn.addEventListener('click', function () {
        const val = parseInt(input.value, 10);
        input.value = val + 1;
        input.dispatchEvent(new Event('change'));
      });

      input.addEventListener('change', function () {
        if (parseInt(this.value, 10) < 1 || isNaN(parseInt(this.value, 10))) {
          this.value = 1;
        }
      });
    }
  });

  /* --- Product Page Image Gallery --- */
  const mainImage = document.querySelector('.product-main-image img');
  const thumbnails = document.querySelectorAll('.product-thumbnail');

  thumbnails.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      thumbnails.forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      if (mainImage) {
        mainImage.src = this.dataset.imageSrc || this.querySelector('img').src;
        mainImage.alt = this.dataset.imageAlt || this.querySelector('img').alt;
      }
    });
  });

  /* --- Product Tabs --- */
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const tabGroup = this.closest('.product-tabs');
      if (!tabGroup) return;

      tabGroup.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      tabGroup.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });

      this.classList.add('active');
      const target = tabGroup.querySelector(this.dataset.target);
      if (target) target.classList.add('active');
    });
  });

  /* --- AJAX Add to Cart --- */
  document.querySelectorAll('form[action="/cart/add"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Ajout en cours...';

      const formData = new FormData(form);

      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
        .then(function (response) { return response.json(); })
        .then(function () {
          submitBtn.textContent = 'Ajouté !';
          // Update cart count
          fetch('/cart.js')
            .then(function (r) { return r.json(); })
            .then(function (cart) {
              document.querySelectorAll('.cart-count').forEach(function (el) {
                el.textContent = cart.item_count;
              });
            });

          setTimeout(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }, 1500);
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        });
    });
  });

  /* --- Cart Page: Update Quantity --- */
  document.querySelectorAll('.cart-item .quantity-input').forEach(function (input) {
    input.addEventListener('change', function () {
      const line = this.dataset.line;
      const quantity = parseInt(this.value, 10);

      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line: parseInt(line, 10), quantity: quantity })
      }).then(function () {
        window.location.reload();
      });
    });
  });

  /* --- Cart Page: Remove Item --- */
  document.querySelectorAll('.cart-item-remove').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const line = this.dataset.line;

      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line: parseInt(line, 10), quantity: 0 })
      }).then(function () {
        window.location.reload();
      });
    });
  });

  /* --- Variant Selector --- */
  document.querySelectorAll('.variant-option').forEach(function (option) {
    option.addEventListener('click', function () {
      const group = this.closest('.variant-options');
      if (group) {
        group.querySelectorAll('.variant-option').forEach(function (o) { o.classList.remove('selected'); });
      }
      this.classList.add('selected');

      // Update hidden variant input if present
      const variantId = this.dataset.variantId;
      if (variantId) {
        const form = this.closest('form');
        if (form) {
          const idInput = form.querySelector('input[name="id"]');
          if (idInput) idInput.value = variantId;
        }
      }
    });
  });

});
