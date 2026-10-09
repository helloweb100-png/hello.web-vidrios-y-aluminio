/* =========================================================
   VIDRIO Y ALUMINIOS MORENO · script.js
   Módulos: contacto/WhatsApp, pantalla de carga, scroll suave,
   navegación, hero (partículas y parallax), animaciones de scroll,
   catálogo + visor, configurador de pedido, noticias, formularios.

   Librerías (CDN): GSAP + ScrollTrigger, Lenis.
   Si alguna no carga, el sitio sigue funcionando sin sus efectos.
   ========================================================= */

/* ---------- CONFIGURACIÓN DEL CLIENTE (editar aquí) ---------- */
const CONFIG = {
  // Número de WhatsApp con lada de país, solo dígitos. Ej. México: 524422597895
  whatsapp: '524422597895',
  // URL de la página de Facebook. Si se deja vacía, el enlace no se muestra.
  facebook: '',
  brand: 'Vidrio y Aluminios Moreno'
};

(() => {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = () => typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const body = document.body;
  const root = document.documentElement;
  const navEl = $('#nav');
  let lenis = null;

  const debounce = (fn, ms = 150) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  /* ---------- Aviso (toast) ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 3600);
  }

  /* =========================================================
     1. WHATSAPP Y DATOS DE CONTACTO
     ========================================================= */
  const waDigits = String(CONFIG.whatsapp).replace(/\D/g, '');
  const waIsPlaceholder = !waDigits || /^520*$/.test(waDigits);
  const waURL = (text) => `https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`;

  $$('[data-wa]').forEach((a) => {
    a.href = waURL(a.dataset.waText || 'Hola, me gustaría recibir información.');
    a.target = '_blank';
    a.rel = 'noopener';
  });

  const waLabel = $('#waLabel');
  if (waLabel && !waIsPlaceholder && waDigits.length >= 12) {
    // Formato +52 442 259 7895
    waLabel.textContent = `+${waDigits.slice(0, 2)} ${waDigits.slice(-10, -7)} ${waDigits.slice(-7, -4)} ${waDigits.slice(-4)}`;
  }
  if (CONFIG.facebook) {
    const row = $('#fbRow');
    const link = $('#fbLink');
    if (row && link) { link.href = CONFIG.facebook; row.hidden = false; }
  }

  function openWhatsApp(text) {
    const win = window.open(waURL(text), '_blank', 'noopener');
    if (!win) window.location.href = waURL(text); // si el navegador bloquea la ventana
  }

  /* =========================================================
     2. SCROLL SUAVE (Lenis) Y ANCLAS
     ========================================================= */
  function initSmoothScroll() {
    if (reduce || typeof window.Lenis === 'undefined') return;
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.92, smoothWheel: true });
    if (hasGSAP()) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    lenis.stop(); // se libera cuando termina la carga
  }

  function scrollToEl(el) {
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: 0, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function lockScroll(lock) {
    root.classList.toggle('is-locked', lock);
    if (lenis) (lock ? lenis.stop() : lenis.start());
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (a.dataset.filterLink) setFilter(a.dataset.filterLink);
    scrollToEl(target);
  });

  /* =========================================================
     3. PANTALLA DE CARGA
     ========================================================= */
  function initLoader() {
    const loader = $('#loader');
    const finish = () => {
      body.classList.remove('is-loading');
      body.classList.add('is-ready');
      if (lenis) lenis.start();
      if (hasGSAP()) window.ScrollTrigger.refresh();
      setTimeout(() => $('#waFloat')?.classList.add('show-tip'), 5200);
      setTimeout(() => $('#waFloat')?.classList.remove('show-tip'), 11000);
    };
    if (!loader) { finish(); return; }

    const fill = $('.loader__bar i');
    const pct = $('#loaderPct');
    const msg = $('#loaderMsg');
    const msgs = ['Tomando medidas', 'Cortando perfiles', 'Templando el vidrio', 'Armando el marco'];
    const MIN = reduce ? 500 : 2600;
    const t0 = performance.now();
    let pageReady = document.readyState === 'complete';
    let fontsReady = !document.fonts;
    let shown = 0;

    if (!pageReady) window.addEventListener('load', () => { pageReady = true; }, { once: true });
    if (document.fonts) document.fonts.ready.then(() => { fontsReady = true; });
    setTimeout(() => { pageReady = true; fontsReady = true; }, 8000); // tope de seguridad

    const easeOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2); // suave al inicio y al final
    const step = (now) => {
      const cap = pageReady && fontsReady ? 100 : 90;
      const target = Math.min(cap, easeOut(Math.min(1, (now - t0) / MIN)) * 100);
      shown += (target - shown) * 0.14;
      if (target >= 100 && shown > 99.4) shown = 100;
      fill.parentElement.style.setProperty('--p', (shown / 100).toFixed(3));
      fill.style.setProperty('--p', (shown / 100).toFixed(3));
      pct.textContent = String(Math.round(shown)).padStart(2, '0');
      msg.textContent = shown >= 100 ? 'Todo listo' : msgs[Math.min(msgs.length - 1, Math.floor(shown / 25))];
      if (shown >= 100) {
        // Las puertas de vidrio se abren y revelan el sitio
        setTimeout(() => {
          loader.classList.add('is-done');
          setTimeout(finish, 350);
          setTimeout(() => loader.remove(), 1500);
        }, 250);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* =========================================================
     4. NAVEGACIÓN
     ========================================================= */
  const burger = $('#burger');
  const menu = $('#menu');

  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
    lockScroll(false);
  }

  function initNav() {
    // Barra con fondo al salir del tope (sin escuchar el evento scroll)
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:48px;pointer-events:none;';
    body.prepend(sentinel);
    new IntersectionObserver(([e]) => navEl.classList.toggle('is-stuck', !e.isIntersecting)).observe(sentinel);

    // Enlace activo según la sección visible
    const links = $$('.nav__links a');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.remove('is-current'));
        map.get(en.target.id)?.classList.add('is-current'); // secciones sin enlace en el menú: no se resalta ninguno
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach((s) => io.observe(s));

    burger.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      lockScroll(open);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    window.matchMedia('(min-width: 960px)').addEventListener('change', (m) => { if (m.matches) closeMenu(); });
  }

  /* =========================================================
     5. HERO: parallax con el cursor y destellos en canvas
     ========================================================= */
  function initHeroPointer() {
    const hero = $('#inicio');
    if (!hero || !canHover || reduce) return;
    const panes = $$('.pane', hero);
    const frame = $('#heroFrame');
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      panes.forEach((p) => {
        const d = parseFloat(p.dataset.depth) || 20;
        p.style.transform = `translate3d(${(cx * d).toFixed(2)}px, ${(cy * d * 0.7).toFixed(2)}px, 0)`;
      });
      frame?.style.setProperty('--rx', (cx * 5).toFixed(2));
      frame?.style.setProperty('--ry', (-cy * 4).toFixed(2));
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  function initSparkles() {
    const cv = $('#sparkles');
    if (!cv || reduce) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, stars = [], running = false, raf = 0;

    const make = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      s: 3 + Math.random() * 6,
      ph: Math.random() * Math.PI * 2,
      sp: 0.5 + Math.random() * 1.1,
      vy: -(0.05 + Math.random() * 0.14),
      rgb: Math.random() < 0.7 ? '27,111,179' : '61,143,214'
    });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 720 ? 14 : 30;
      stars = Array.from({ length: n }, make);
    };
    const star = (x, y, s) => {
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.quadraticCurveTo(x, y, x + s, y);
      ctx.quadraticCurveTo(x, y, x, y + s);
      ctx.quadraticCurveTo(x, y, x - s, y);
      ctx.quadraticCurveTo(x, y, x, y - s);
      ctx.fill();
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const sec = t / 1000;
      for (const s of stars) {
        const a = (Math.sin(sec * s.sp + s.ph) + 1) / 2;
        ctx.fillStyle = `rgba(${s.rgb},${(0.12 + a * 0.62).toFixed(3)})`;
        star(s.x, s.y, s.s * (0.45 + a * 0.85));
        s.y += s.vy;
        if (s.y < -12) { s.y = h + 12; s.x = Math.random() * w; }
      }
      if (running) raf = requestAnimationFrame(draw);
    };
    const toggle = (on) => {
      if (on && !running) { running = true; raf = requestAnimationFrame(draw); }
      if (!on) { running = false; cancelAnimationFrame(raf); }
    };

    resize();
    window.addEventListener('resize', debounce(resize, 250));
    new IntersectionObserver(([e]) => toggle(e.isIntersecting && !document.hidden)).observe(cv);
    document.addEventListener('visibilitychange', () => toggle(!document.hidden));
  }

  /* =========================================================
     6. ANIMACIONES DE SCROLL (GSAP + ScrollTrigger)
     ========================================================= */
  function splitWords(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
  }

  function initScrollFx() {
    if (!hasGSAP() || reduce) return;
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Barra de progreso de lectura
    gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Títulos: las palabras suben desde una máscara
    $$('[data-split]').forEach((el) => {
      splitWords(el);
      const words = $$('.w > span', el);
      gsap.set(words, { yPercent: 118 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.05 })
      });
    });

    // Bloques que aparecen con un desplazamiento suave
    $$('[data-reveal]:not([data-magnetic])').forEach((el) => {
      gsap.set(el, { y: 38, opacity: 0 });
      ScrollTrigger.create({
        trigger: el, start: 'top 91%', once: true,
        onEnter: () => gsap.to(el, { y: 0, opacity: 1, duration: 1.3, ease: 'expo.out', clearProps: 'transform,opacity' })
      });
    });

    // Tarjetas del catálogo en cascada
    const cards = $$('.card');
    gsap.set(cards, { y: 56, opacity: 0 });
    ScrollTrigger.batch(cards, {
      start: 'top 93%', once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity' })
    });

    // Imágenes con parallax interno
    $$('.post--feat .post__media img, .bento__c--alu > img, .bento__c--frost > img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -7, scale: 1.16 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Hero: el texto se aleja un poco más lento que el scroll
    gsap.to('.hero__copy', { yPercent: 14, opacity: 0.1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__bg', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Cifras
    $$('[data-count]').forEach((el) => {
      const end = parseInt(el.dataset.count, 10);
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => {
          const o = { v: 0 };
          gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } });
        }
      });
    });

    // Proceso: la línea se dibuja con el scroll y cada paso se enciende
    const tl = $('#timeline');
    if (tl) {
      ScrollTrigger.create({
        trigger: tl, start: 'top 62%', end: 'bottom 62%', scrub: true,
        onUpdate: (s) => tl.style.setProperty('--p', s.progress.toFixed(3))
      });
      $$('.timeline__item', tl).forEach((item) => {
        ScrollTrigger.create({
          trigger: item, start: 'top 64%',
          onEnter: () => item.classList.add('is-active'),
          onLeaveBack: () => item.classList.remove('is-active')
        });
        gsap.from($(':scope > div', item), {
          y: 34, opacity: 0, duration: 1.2, ease: 'expo.out',
          scrollTrigger: { trigger: item, start: 'top 82%', once: true }
        });
      });
    }

    // Obras: el scroll vertical se convierte en recorrido horizontal (solo escritorio)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 960px)', () => {
      const gal = $('#obras');
      const track = $('#galTrack');
      if (!gal || !track) return undefined;
      gal.classList.add('is-pinned');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.gal__pin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true }
      });
      return () => { gal.classList.remove('is-pinned'); gsap.set(track, { clearProps: 'transform' }); };
    });

    // El contenido cambia de altura al abrir preguntas o filtrar: se recalculan las posiciones
    $$('.faq details').forEach((d) => d.addEventListener('toggle', debounce(() => ScrollTrigger.refresh(), 700)));
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  function initMagnetic() {
    if (!canHover || reduce || !hasGSAP()) return;
    const { gsap } = window;
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.2);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* =========================================================
     7. SOLUCIONES: acordeón de imágenes
     ========================================================= */
  function initAccordion() {
    const wrap = $('#acc');
    if (!wrap) return;
    const items = $$('.acc__item', wrap);
    let idx = 0, paused = false, visible = false;
    const open = (i) => { idx = i; items.forEach((it, k) => it.classList.toggle('is-open', k === i)); };

    items.forEach((it, i) => {
      if (canHover) it.addEventListener('mouseenter', () => open(i));
      it.addEventListener('click', () => open(i));
      it.addEventListener('focus', () => open(i));
      it.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      });
    });
    wrap.addEventListener('pointerenter', () => { paused = true; });
    wrap.addEventListener('pointerleave', () => { paused = false; });
    wrap.addEventListener('focusin', () => { paused = true; });
    wrap.addEventListener('focusout', () => { paused = false; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(wrap);

    // Ciclo automático solo en escritorio (en móvil movería el contenido mientras lees)
    if (!reduce) {
      setInterval(() => {
        if (paused || !visible || !window.matchMedia('(min-width: 720px)').matches) return;
        open((idx + 1) % items.length);
      }, 4600);
    }
  }

  /* =========================================================
     8. CATÁLOGO: filtros y visor de fotos
     ========================================================= */
  const grid = $('#catGrid');
  const cards = grid ? $$('.card', grid) : [];
  const chips = $$('.chip');
  const countEl = $('#catCount');

  function setFilter(f) {
    if (!grid) return;
    chips.forEach((c) => {
      const on = c.dataset.filter === f;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    const shown = [];
    cards.forEach((card) => {
      const ok = f === 'todos' || card.dataset.cat === f;
      card.classList.toggle('is-hidden', !ok);
      if (ok) shown.push(card);
    });
    if (countEl) countEl.textContent = shown.length;
    if (hasGSAP() && !reduce) {
      window.gsap.fromTo(shown, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.05, clearProps: 'transform,opacity', overwrite: true });
      debounce(() => window.ScrollTrigger.refresh(), 400)();
    }
  }

  function initCatalog() {
    chips.forEach((c) => c.addEventListener('click', () => setFilter(c.dataset.filter)));

    const dlg = $('#lightbox');
    if (!dlg) return;
    const img = $('#lbImg');
    const cap = $('#lbCap');
    let list = [];
    let cur = 0;

    const render = () => {
      const card = list[cur];
      const src = $('img', card);
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      cap.textContent = $('h3', card).textContent;
    };
    const openAt = (card) => {
      list = cards.filter((c) => !c.classList.contains('is-hidden'));
      cur = Math.max(0, list.indexOf(card));
      render();
      dlg.showModal();
      lockScroll(true);
    };
    const move = (d) => { cur = (cur + d + list.length) % list.length; render(); };

    cards.forEach((card) => $('[data-zoom]', card).addEventListener('click', () => openAt(card)));
    $('[data-prev]', dlg).addEventListener('click', () => move(-1));
    $('[data-next]', dlg).addEventListener('click', () => move(1));
    $('[data-close]', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => lockScroll(false));
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    });
    $('#lbPick').addEventListener('click', () => {
      const btn = $('[data-pick]', list[cur]);
      dlg.close();
      pickModel(btn.dataset.pick, btn.dataset.model);
    });

    $$('[data-pick]', grid).forEach((btn) => btn.addEventListener('click', () => pickModel(btn.dataset.pick, btn.dataset.model)));
  }

  /* =========================================================
     9. CONFIGURADOR DE PEDIDO ("la entrevista")
     ========================================================= */
  const form = $('#cfgForm');
  const cfg = { step: 1, ref: '' };

  // Proporción por defecto de la vista previa según el producto (ancho / alto)
  const DEFAULT_AR = { 'Ventana': 1.25, 'Puerta': 0.46, 'Domo': 1.3, 'Cancel de baño': 0.62, 'Fachada o barandal': 1.5, 'Otro proyecto': 1.2 };
  const PERFIL_SHORT = { 'Perfil estándar': 'Estándar', 'Perfil reforzado': 'Reforzado', 'Perfil arquitectónico': 'Arquitectónico', 'Quiero asesoría para elegirlo': 'Con asesoría' };

  const val = (name) => (form.querySelector(`input[name="${name}"]:checked`) || {}).value || '';
  const colorHex = () => (form.querySelector('input[name="color"]:checked') || { dataset: {} }).dataset.hex || '#C4C8CC';
  const shortGlass = (v) => v.replace(/\s*\(.*\)/, '');
  const numVal = (id) => parseFloat(($(id).value || '').replace(',', '.'));

  function fitPreview() {
    const stage = $('#stage');
    const pv = $('#pv');
    if (!stage || !pv) return;
    const w = numVal('#fAncho');
    const h = numVal('#fAlto');
    const noSe = $('#fNoSe').checked;
    let ar = DEFAULT_AR[val('producto')] || 1.2;
    if (!noSe && w >= 20 && h >= 20) ar = w / h;
    ar = Math.min(2.2, Math.max(0.35, ar));
    const r = stage.getBoundingClientRect();
    const maxW = r.width * 0.64;
    const maxH = r.height * 0.64;
    let pw = maxW;
    let ph = pw / ar;
    if (ph > maxH) { ph = maxH; pw = ph * ar; }
    pv.style.width = `${Math.round(pw)}px`;
    pv.style.height = `${Math.round(ph)}px`;
  }

  function updatePreview() {
    const stage = $('#stage');
    const pv = $('#pv');
    stage.dataset.type = val('producto');
    pv.style.setProperty('--alu', colorHex());
    pv.dataset.glass = val('vidrio');
    pv.dataset.res = val('resistencia');

    const noSe = $('#fNoSe').checked;
    const w = numVal('#fAncho');
    const h = numVal('#fAlto');
    $('#dimW').textContent = !noSe && w >= 20 ? `${Math.round(w)} cm` : 'Tu ancho';
    $('#dimH').textContent = !noSe && h >= 20 ? `${Math.round(h)} cm` : 'Tu alto';

    $('#sProducto').textContent = val('producto');
    $('#sPerfil').textContent = PERFIL_SHORT[val('perfil')] || val('perfil');
    $('#sColor').textContent = val('color');
    $('#sVidrio').textContent = `${shortGlass(val('vidrio'))}, ${val('resistencia').toLowerCase()}`;

    const refEl = $('#sRef');
    refEl.hidden = !cfg.ref;
    refEl.textContent = cfg.ref ? `Modelo de referencia: ${cfg.ref}` : '';
    fitPreview();
  }

  function medidasTexto() {
    const noSe = $('#fNoSe').checked;
    const w = numVal('#fAncho');
    const h = numVal('#fAlto');
    const q = parseInt($('#fCant').value, 10) || 1;
    if (noSe || !(w >= 20 && h >= 20)) return 'Prefiero que las tomen ustedes' + (q > 1 ? ` (${q} piezas)` : '');
    return `${Math.round(w)} x ${Math.round(h)} cm` + (q > 1 ? ` (${q} piezas)` : '');
  }

  function buildRecap() {
    const rows = [
      ['Producto', val('producto')],
      cfg.ref ? ['Modelo', cfg.ref] : null,
      ['Aluminio', PERFIL_SHORT[val('perfil')] || val('perfil')],
      ['Color', val('color')],
      ['Vidrio', `${shortGlass(val('vidrio'))}, ${val('resistencia').toLowerCase()}`],
      ['Medidas', medidasTexto()],
      $('#fZona').value.trim() ? ['Zona', $('#fZona').value.trim()] : null
    ].filter(Boolean);
    $('#recap').innerHTML = rows.map(([k, v]) => `<li><span>${k}</span><b>${v.replace(/[<>&]/g, '')}</b></li>`).join('');
  }

  function setError(fieldEl, errEl, message) {
    fieldEl.classList.toggle('is-err', Boolean(message));
    errEl.textContent = message || '';
    const input = $('input, textarea', fieldEl);
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateStep(n) {
    if (n === 5) {
      if ($('#fNoSe').checked) {
        setError($('#fAncho').parentElement, $('#eAncho'), '');
        setError($('#fAlto').parentElement, $('#eAlto'), '');
        return true;
      }
      const w = numVal('#fAncho');
      const h = numVal('#fAlto');
      const okW = w >= 20 && w <= 1500;
      const okH = h >= 20 && h <= 1500;
      setError($('#fAncho').parentElement, $('#eAncho'), okW ? '' : 'Escribe un ancho entre 20 y 1500 cm, o marca que prefieres que lo midamos.');
      setError($('#fAlto').parentElement, $('#eAlto'), okH ? '' : 'Escribe un alto entre 20 y 1500 cm, o marca que prefieres que lo midamos.');
      if (!okW) { $('#fAncho').focus(); return false; }
      if (!okH) { $('#fAlto').focus(); return false; }
    }
    if (n === 6) {
      const name = $('#fNombre').value.trim();
      const ok = name.length >= 2;
      setError($('#fNombre').parentElement, $('#eNombre'), ok ? '' : 'Dinos tu nombre para saber a quién responder.');
      if (!ok) { $('#fNombre').focus(); return false; }
    }
    return true;
  }

  function showStep(n, focus = true) {
    cfg.step = n;
    const panels = $$('.panel', form);
    panels.forEach((p) => p.classList.toggle('is-active', Number(p.dataset.step) === n));
    $$('.steps__b', form).forEach((b, i) => {
      b.classList.toggle('is-active', i + 1 === n);
      b.classList.toggle('is-done', i + 1 < n);
      if (i + 1 === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    $('#btnPrev').hidden = n === 1;
    $('#btnNext').hidden = n === 6;
    $('#btnSend').hidden = n !== 6;
    if (n === 6) buildRecap();
    if (focus) {
      const lg = $('legend', panels[n - 1]);
      lg.setAttribute('tabindex', '-1');
      lg.focus({ preventScroll: true });
    }
  }

  function goTo(n) {
    if (n > cfg.step) {
      for (let i = cfg.step; i < n; i++) {
        if (!validateStep(i)) { showStep(i); return; }
      }
    }
    showStep(n);
  }

  function pickModel(product, model) {
    if (!form) return;
    const radio = form.querySelector(`input[name="producto"][value="${product}"]`);
    if (radio) radio.checked = true;
    cfg.ref = model || '';
    updatePreview();
    showStep(2, false);
    scrollToEl($('#pedido'));
    toast(`Elegiste: ${model || product}. Sigue con el aluminio.`);
  }

  function sendOrder() {
    const lines = [
      `Hola, soy ${$('#fNombre').value.trim()}. Quiero cotizar lo siguiente:`,
      `- Producto: ${val('producto')}`,
      cfg.ref ? `- Modelo de referencia: ${cfg.ref}` : null,
      `- Aluminio: ${PERFIL_SHORT[val('perfil')] || val('perfil')}`,
      `- Color: ${val('color')}`,
      `- Vidrio: ${shortGlass(val('vidrio'))}, ${val('resistencia').toLowerCase()}`,
      `- Medidas: ${medidasTexto()}`,
      $('#fZona').value.trim() ? `- Zona: ${$('#fZona').value.trim()}` : null,
      $('#fNotas').value.trim() ? `- Notas: ${$('#fNotas').value.trim()}` : null,
      '',
      'Enviado desde el sitio web.'
    ].filter((l) => l !== null);
    openWhatsApp(lines.join('\n'));
    toast('Abriendo WhatsApp con tu pedido listo para enviar.');
  }

  function initConfigurator() {
    if (!form) return;
    showStep(1, false);
    updatePreview();

    form.addEventListener('change', (e) => {
      if (e.target.id === 'fNoSe') {
        const off = e.target.checked;
        ['#fAncho', '#fAlto'].forEach((id) => { $(id).disabled = off; });
        if (off) { setError($('#fAncho').parentElement, $('#eAncho'), ''); setError($('#fAlto').parentElement, $('#eAlto'), ''); }
      }
      if (e.target.name === 'producto') cfg.ref = ''; // cambió de producto: se descarta el modelo de referencia
      updatePreview();
    });
    form.addEventListener('input', (e) => {
      if (['fAncho', 'fAlto'].includes(e.target.id)) updatePreview();
      if (e.target.closest('.field.is-err')) validateStep(cfg.step);
    });

    $('#btnNext').addEventListener('click', () => { if (validateStep(cfg.step)) showStep(cfg.step + 1); });
    $('#btnPrev').addEventListener('click', () => showStep(cfg.step - 1));
    $$('.steps__b', form).forEach((b) => b.addEventListener('click', () => goTo(Number(b.dataset.go))));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (cfg.step < 6) { if (validateStep(cfg.step)) showStep(cfg.step + 1); return; }
      if (!validateStep(5)) { showStep(5); return; }
      if (!validateStep(6)) return;
      sendOrder();
    });

    window.addEventListener('resize', debounce(fitPreview, 150));
  }

  /* =========================================================
     10. NOTICIAS: lectura en ventana
     ========================================================= */
  function initArticles() {
    const dlg = $('#articleDlg');
    const bodyEl = $('#artBody');
    if (!dlg) return;

    $$('[data-article]').forEach((btn) => btn.addEventListener('click', () => {
      const tpl = document.getElementById(btn.dataset.article);
      if (!tpl) return;
      bodyEl.replaceChildren(tpl.content.cloneNode(true));
      dlg.scrollTop = 0;
      dlg.showModal();
      lockScroll(true);
    }));
    $('[data-close]', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) { dlg.close(); return; }
      const link = e.target.closest('[data-close-link]');
      if (link) {
        e.preventDefault();
        dlg.close();
        const product = link.dataset.product;
        if (product) pickModel(product, '');
        else scrollToEl($(link.getAttribute('href')));
      }
    });
    dlg.addEventListener('close', () => lockScroll(false));
  }

  /* =========================================================
     11. FORMULARIO DE CONTACTO
     ========================================================= */
  function initContact() {
    const f = $('#contactForm');
    if (!f) return;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = $('#cNombre').value.trim();
      const tel = $('#cTel').value.replace(/\D/g, '');
      const okN = nombre.length >= 2;
      const okT = tel.length >= 10;
      setError($('#cNombre').parentElement, $('#ecNombre'), okN ? '' : 'Escribe tu nombre.');
      setError($('#cTel').parentElement, $('#ecTel'), okT ? '' : 'Escribe un teléfono de 10 dígitos para poder contactarte.');
      if (!okN) { $('#cNombre').focus(); return; }
      if (!okT) { $('#cTel').focus(); return; }
      const msg = $('#cMsg').value.trim();
      openWhatsApp([
        `Hola, soy ${nombre}. Me interesa: ${$('#cServ').value}.`,
        msg || null,
        `Mi teléfono: ${$('#cTel').value.trim()}`,
        '',
        'Enviado desde el sitio web.'
      ].filter((l) => l !== null).join('\n'));
      toast('Abriendo WhatsApp con tu mensaje.');
    });
    $$('input', f).forEach((i) => i.addEventListener('input', () => {
      const field = i.parentElement;
      if (field.classList.contains('is-err')) setError(field, $('.err', field), '');
    }));
  }

  /* =========================================================
     ARRANQUE
     ========================================================= */
  initSmoothScroll();
  initNav();
  initHeroPointer();
  initSparkles();
  initScrollFx();
  initMagnetic();
  initAccordion();
  initCatalog();
  initConfigurator();
  initArticles();
  initContact();
  initLoader();
})();
