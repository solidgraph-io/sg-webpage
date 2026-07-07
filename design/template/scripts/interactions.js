/* ==========================================================================
   SolidGraph · Interactions
   All progressive-enhancement behaviour for the site. Every routine is
   null-safe so this file can run on a single standalone section page OR on
   the fully-composed index.html. Call SolidGraph.init() again after injecting
   markup dynamically (index.html does this once sections are loaded).
   ========================================================================== */
(function (global) {
  var fine = global.matchMedia && global.matchMedia('(pointer:fine)').matches;

  /* ---- scroll reveal ---- */
  function initReveal(root) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    root.querySelectorAll('[data-reveal]:not(.in)').forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---- sticky nav hide/show + scrolled ---- */
  function initNav() {
    var nav = document.getElementById('nav');
    if (!nav || nav.__bound) return;
    nav.__bound = true;
    var lastY = 0;
    global.addEventListener(
      'scroll',
      function () {
        var y = global.scrollY;
        nav.classList.toggle('scrolled', y > 40);
        if (y > lastY && y > 400) nav.classList.add('hide');
        else nav.classList.remove('hide');
        lastY = y;
      },
      { passive: true },
    );
  }

  /* ---- cursor spotlight ---- */
  function initSpotlight(root) {
    root.querySelectorAll('.has-spot').forEach(function (sec) {
      if (sec.__spot) return;
      sec.__spot = true;
      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect();
        sec.style.setProperty('--mx', e.clientX - r.left + 'px');
        sec.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    });
  }

  /* ---- magnetic buttons ---- */
  function initMagnetic(root) {
    if (!fine) return;
    root.querySelectorAll('.magnetic').forEach(function (btn) {
      if (btn.__mag) return;
      btn.__mag = true;
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ---- hero screen subtle 3D tilt on scroll ---- */
  function initHeroTilt() {
    var screen = document.getElementById('heroScreen');
    if (!screen || screen.__tilt) return;
    screen.__tilt = true;
    function tilt() {
      var rect = screen.getBoundingClientRect();
      var prog = Math.min(Math.max((global.innerHeight - rect.top) / global.innerHeight, 0), 1.4);
      var deg = Math.max(14 - prog * 16, 0);
      screen.style.transform = 'rotateX(' + deg + 'deg) scale(' + (0.98 + prog * 0.02) + ')';
    }
    global.addEventListener('scroll', tilt, { passive: true });
    tilt();
  }

  /* ---- 3D tilt on portfolio + pillar cards ---- */
  function initCardTilt(root) {
    if (!fine) return;
    root.querySelectorAll('.p-card, .pillar').forEach(function (card) {
      if (card.__tilt) return;
      card.__tilt = true;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
        card.style.transform =
          'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-8px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---- animated counters ---- */
  function initCounters() {
    var statSec = document.querySelector('.stats');
    if (!statSec || statSec.__counted) return;
    var cio = new IntersectionObserver(
      function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting && !statSec.__counted) {
            statSec.__counted = true;
            document.querySelectorAll('[data-count]').forEach(function (el) {
              var target = parseFloat(el.getAttribute('data-count'));
              var pre = el.getAttribute('data-prefix') || '';
              var suf = el.getAttribute('data-suffix') || '';
              var dur = 1400,
                start = performance.now();
              (function tick(now) {
                var p = Math.min((now - start) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = pre + Math.round(target * eased) + suf;
                if (p < 1) requestAnimationFrame(tick);
              })(start);
            });
            cio.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    cio.observe(statSec);
  }

  /* ---- how-it-works progress on scroll ---- */
  function initHowProgress() {
    var steps = document.querySelectorAll('.how .step');
    var bars = document.querySelectorAll('.how-progress i');
    if (!steps.length || !bars.length || steps.__bound) return;
    steps.__bound = true;
    var sio = new IntersectionObserver(
      function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) {
            var idx = [].indexOf.call(steps, e.target);
            bars.forEach(function (b, i) {
              b.classList.toggle('on', i <= idx);
            });
          }
        });
      },
      { threshold: 0.6 },
    );
    steps.forEach(function (s) {
      sio.observe(s);
    });
  }

  function init(root) {
    root = root || document;
    initReveal(root);
    initSpotlight(root);
    initMagnetic(root);
    initCardTilt(root);
    initNav();
    initHeroTilt();
    initCounters();
    initHowProgress();
  }

  global.SolidGraph = { init: init };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }
})(window);
