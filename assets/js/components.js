/* ─────────────────────────────────────────────
   Beetle Labs — components.js
   Loads shared header + footer, then boots all
   shared UI (theme, cursor, canvas, nav, scroll reveal).
   Each page's own script handles page-specific logic.
───────────────────────────────────────────── */

(function () {

  // ── 1. INJECT HEADER & FOOTER ──────────────────────────────
  function loadComponent(selector, url, callback) {
    const el = document.querySelector(selector);
    if (!el) return;
    fetch(url)
      .then(r => r.text())
      .then(html => {
        el.innerHTML = html;
        if (callback) callback();
      })
      .catch(err => console.warn('Component load failed:', url, err));
  }

  // Mark active nav link based on current page.
  // Page-level links (point to this page, no in-page hash) are marked here;
  // same-page section links (e.g. /#services) are handled by initScrollSpy().
  function setActiveNav() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('#main-nav .nav-links a').forEach(a => {
      const url  = new URL(a.href);
      const href = url.pathname.replace(/\/$/, '') || '/';
      if (href === path && !url.hash && path !== '/') {
        a.classList.add('active');
      }
    });
  }

  // Scroll-spy: highlight the nav link for the section currently in view.
  // Only applies to nav links whose hash target exists on the current page.
  function initScrollSpy() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    const path = window.location.pathname.replace(/\/$/, '') || '/';

    const items = [];
    nav.querySelectorAll('.nav-links a').forEach(link => {
      const url      = new URL(link.href);
      const linkPath = url.pathname.replace(/\/$/, '') || '/';
      if (url.hash && linkPath === path) {
        const section = document.querySelector(url.hash);
        if (section) items.push({ link, section });
      }
    });
    if (!items.length) return;

    function update() {
      const pos = window.scrollY + 120; // offset for the fixed nav
      let active = null;
      items.forEach(item => {
        if (item.section.offsetTop <= pos) active = item;
      });
      // Snap to the last section once scrolled to the very bottom
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
        active = items[items.length - 1];
      }
      items.forEach(item => item.link.classList.toggle('active', item === active));
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  // ── 2. THEME TOGGLE ────────────────────────────────────────
  // Persists across pages via localStorage
  function initTheme() {
    const toggle  = document.getElementById('theme-toggle');
    const sun     = toggle && toggle.querySelector('.icon-sun');
    const moon    = toggle && toggle.querySelector('.icon-moon');
    if (!toggle) return;

    const saved = localStorage.getItem('bl-theme') || 'dark';
    applyTheme(saved, sun, moon);

    toggle.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light'
        ? 'dark' : 'light';
      localStorage.setItem('bl-theme', next);
      applyTheme(next, sun, moon);
    });
  }

  function applyTheme(theme, sun, moon) {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    if (!sun || !moon) return;
    if (theme === 'light') {
      sun.style.display  = 'none';
      moon.style.display = 'block';
    } else {
      sun.style.display  = 'block';
      moon.style.display = 'none';
    }
  }

  // ── 3. NAV SCROLL BORDER ───────────────────────────────────
  function initNavScroll() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.style.borderBottomColor = window.scrollY > 60
        ? 'var(--border)' : 'transparent';
    }, { passive: true });
  }

  // ── 4. MOBILE MENU TOGGLE ──────────────────────────────────
  function initMobileMenu() {
    const btn   = document.getElementById('menu-toggle');
    const links = document.querySelector('.nav-links');
    if (!btn || !links) return;

    function close() {
      links.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
    function toggle() {
      const willOpen = !links.classList.contains('open');
      links.classList.toggle('open', willOpen);
      btn.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    }

    btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });

    // Auto-close after picking an option
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

    // Tap/click anywhere outside the menu closes it
    document.addEventListener('click', e => {
      if (!links.classList.contains('open')) return;
      if (!links.contains(e.target) && !btn.contains(e.target)) close();
    });

    // Escape closes it too
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  // ── 5. CUSTOM CURSOR ───────────────────────────────────────
  function initCursor() {
    // Only on pointer devices
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const cursor = document.getElementById('cursor');
    const ring   = document.getElementById('cursor-ring');
    if (!cursor || !ring) return;

    let cx = 0, cy = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
      cx = e.clientX; cy = e.clientY;
      cursor.style.left = cx + 'px';
      cursor.style.top  = cy + 'px';
    });

    function animateRing() {
      rx += (cx - rx) * 0.12;
      ry += (cy - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    function grow() {
      cursor.style.width  = '12px'; cursor.style.height = '12px';
      ring.style.width    = '52px'; ring.style.height   = '52px';
      ring.style.borderColor = 'rgba(143,168,122,0.6)';
    }
    function shrink() {
      cursor.style.width  = '8px';  cursor.style.height = '8px';
      ring.style.width    = '36px'; ring.style.height   = '36px';
      ring.style.borderColor = 'rgba(143,168,122,0.4)';
    }

    // Re-run whenever new content is added (components load async)
    function bindCursorTargets() {
      document.querySelectorAll('a, button, .service-card, .process-step, .product, .suite-strip-item')
        .forEach(el => {
          if (el._cursorBound) return;
          el._cursorBound = true;
          el.addEventListener('mouseenter', grow);
          el.addEventListener('mouseleave', shrink);
        });
    }
    bindCursorTargets();
    // Run again after header/footer load
    window.addEventListener('bl:componentsReady', bindCursorTargets);
  }

  // ── 6. STARFIELD CANVAS ────────────────────────────────────
  function initCanvas() {
    const canvas = document.getElementById('cosmos-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, stars = [], nebula = [];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function initStars() {
      stars = []; nebula = [];
      for (let i = 0; i < 220; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random(),
          speed: Math.random() * 0.003 + 0.001,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
        });
      }
      for (let i = 0; i < 5; i++) {
        nebula.push({
          x: Math.random() * W, y: Math.random() * H,
          r: 80 + Math.random() * 140,
          hue: [120, 160, 200][Math.floor(Math.random() * 3)],
          a: 0.015 + Math.random() * 0.02,
        });
      }
    }

    let frame = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      frame++;
      nebula.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, `hsla(${n.hue}, 40%, 60%, ${n.a})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      });
      stars.forEach(s => {
        s.a += Math.sin(frame * s.speed) * 0.008;
        s.a = Math.max(0.05, Math.min(0.95, s.a));
        s.x += s.vx; s.y += s.vy;
        if (s.x < -2) s.x = W + 2; if (s.x > W + 2) s.x = -2;
        if (s.y < -2) s.y = H + 2; if (s.y > H + 2) s.y = -2;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 210, ${s.a})`; ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize(); initStars(); draw();
    window.addEventListener('resize', () => { resize(); initStars(); }, { passive: true });
  }

  // ── 7. SCROLL REVEAL ───────────────────────────────────────
  function initScrollReveal() {
    const io = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 60);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    function observe() {
      document.querySelectorAll('.fade-in-up:not(.visible)').forEach(el => io.observe(el));
    }
    observe();
    window.addEventListener('bl:componentsReady', observe);
  }

  // ── BOOT ───────────────────────────────────────────────────
  function boot() {
    let loaded = 0;
    const total = 2;

    function onLoad() {
      loaded++;
      if (loaded === total) {
        setActiveNav();
        initScrollSpy();   // section highlighting on scroll
        initTheme();       // theme after header is in DOM
        initNavScroll();
        initMobileMenu();
        window.dispatchEvent(new Event('bl:componentsReady'));
      }
    }

    loadComponent('#header-mount', '/components/header.html', onLoad);
    loadComponent('#footer-mount', '/components/footer.html', onLoad);

    // Things that don't depend on components
    initCursor();
    initCanvas();
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
