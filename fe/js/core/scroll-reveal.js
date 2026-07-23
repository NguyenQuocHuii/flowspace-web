(function (FS) {
  'use strict';

  FS.scrollReveal = {
    init() {
      const reveals = document.querySelectorAll('.reveal');
      if (!reveals.length) return;

      const observer = new IntersectionObserver((entries, self) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            self.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15
      });

      reveals.forEach(el => observer.observe(el));
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    FS.scrollReveal.init();
  });

})(window.FS = window.FS || {});
