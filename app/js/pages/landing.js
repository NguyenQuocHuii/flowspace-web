/**
 * FlowSpace — Landing Page Module
 * Handles auth-state UI toggle, workflow carousel, smooth scroll & header effects.
 *
 * Dependencies: jQuery 3.7.1, js/core/auth.js (FS.auth)
 */
(function (FS, $) {
  "use strict";

  FS.pages = FS.pages || {};

  FS.pages.landing = {
    _carouselInterval: null,
    _carouselDelay: 7000,

    /* ── Public ─────────────────────────────────────────────── */
    init() {
      this._updateAuthState();
      this._initCarousel();
      this._initSmoothScroll();
      this._initHeaderScroll();
      this._initMobileMenu();
    },

    /* ── Auth-state toggle ─────────────────────────────────── */
    _updateAuthState() {
      var isLoggedIn = FS.auth && FS.auth.isLoggedIn();

      if (isLoggedIn) {
        var session = FS.auth.getSession();
        // Populate auth-only elements
        var initials = (session.avatar || session.name || '?').slice(0, 2).toUpperCase();
        $('#auth-avatar-text').text(initials);
        $('#auth-user-name').text(session.name || '');

        // Show auth state, hide guest state
        $('.auth-only').removeClass('is-hidden');
        $('.guest-only').addClass('is-hidden');
      } else {
        // Show guest state, hide auth state
        $('.guest-only').removeClass('is-hidden');
        $('.auth-only').addClass('is-hidden');
      }
    },

    /* ── Workflow Carousel ─────────────────────────────────── */
    _initCarousel() {
      var self = this;
      var $indicators = $('.carousel-indicators .indicator');
      var $steps = $('.solutions-carousel .solution-step');
      var $carousel = $('.solutions-carousel');
      var currentIndex = 0;

      if ($indicators.length === 0) return;

      function activateStep(index) {
        $indicators.each(function (i) {
          var $ind = $(this);
          if (i === index) {
            $ind.addClass('active').attr('aria-selected', 'true');
          } else {
            $ind.removeClass('active').attr('aria-selected', 'false');
          }
        });

        $steps.removeClass('active');
        var targetId = $indicators.eq(index).data('target');
        var $target = $('#' + targetId);
        // Force reflow so animation replays
        void $target[0].offsetWidth;
        $target.addClass('active');
        currentIndex = index;
      }

      // Click handlers
      $indicators.on('click', function () {
        var idx = $indicators.index(this);
        activateStep(idx);
        self._stopCarousel();
        self._startCarousel(activateStep, function () { return currentIndex; }, $indicators.length);
      });

      // Auto-rotate
      function startAuto() {
        self._startCarousel(activateStep, function () { return currentIndex; }, $indicators.length);
      }

      startAuto();

      // Pause on hover / focus
      $carousel.on('mouseenter', function () { self._stopCarousel(); });
      $carousel.on('mouseleave', startAuto);
      $carousel.on('focusin', function () { self._stopCarousel(); });
      $carousel.on('focusout', function (e) {
        if (!$.contains($carousel[0], e.relatedTarget)) {
          startAuto();
        }
      });
    },

    _startCarousel(activateFn, getIndex, total) {
      this._stopCarousel();
      this._carouselInterval = setInterval(function () {
        var next = (getIndex() + 1) % total;
        activateFn(next);
      }, this._carouselDelay);
    },

    _stopCarousel() {
      if (this._carouselInterval) {
        clearInterval(this._carouselInterval);
        this._carouselInterval = null;
      }
    },

    /* ── Smooth scroll for anchor links ────────────────────── */
    _initSmoothScroll() {
      $(document).on('click', 'a[href^="#"]', function (e) {
        var hash = $(this).attr('href');
        if (hash.length <= 1) return;
        var $target = $(hash);
        if ($target.length) {
          e.preventDefault();
          $('html, body').animate({ scrollTop: $target.offset().top - 80 }, 500);
          // Close mobile menu if open
          $('.nav-links').removeClass('nav-open');
          $('.menu-toggle').removeClass('is-active');
        }
      });
    },

    /* ── Header scroll effect ──────────────────────────────── */
    _initHeaderScroll() {
      var $header = $('.landing-header');
      var lastScroll = 0;

      $(window).on('scroll.landing', function () {
        var scrollTop = $(window).scrollTop();
        if (scrollTop > 60) {
          $header.addClass('header-scrolled');
        } else {
          $header.removeClass('header-scrolled');
        }
        lastScroll = scrollTop;
      });
    },

    /* ── Mobile hamburger menu ─────────────────────────────── */
    _initMobileMenu() {
      $(document).on('click', '.menu-toggle', function () {
        $(this).toggleClass('is-active');
        $('.nav-links').toggleClass('nav-open');
      });
    }
  };

  /* ── Auto-init on DOM ready ────────────────────────────── */
  $(function () {
    FS.pages.landing.init();
  });

})(window.FS = window.FS || {}, jQuery);
