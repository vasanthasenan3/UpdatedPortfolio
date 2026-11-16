/* Vasanthasenan R | portfolio script
   Order of events: loader -> (profile picker) -> hero intro -> scroll-driven animations.
   GSAP, ScrollTrigger and Lenis live in /vendor. If they fail to load, or the visitor prefers reduced motion,
   the page falls back to a plain, fully visible layout. */
(function () {
  'use strict';
  var D = document, root = D.documentElement;
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var anim = hasGsap && !reduce;
  var lenis = null, introDone = false, typing = false;

  var pick = $('#pick'), loader = $('#loader'), nav = $('#nav'), who = $('#who');
  var names = { recruiter: 'Recruiter', developer: 'Developer', story: 'Curious' };

  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* real refraction only where Chromium supports SVG backdrop filters */
  (function () {
    var ua = navigator.userAgentData;
    var chromium = ua ? ua.brands.some(function (b) { return /Chromium/i.test(b.brand); }) : !!window.chrome;
    if (chromium && !reduce) root.classList.add('lens');
  })();

  /* ---------- splitting helpers ---------- */
  function splitChars(el) {
    var text = el.textContent.trim(), words = text.split(' '), chars = [];
    el.setAttribute('aria-label', text);
    el.textContent = '';
    words.forEach(function (w, wi) {
      var ws = D.createElement('span');
      ws.className = 'w'; ws.setAttribute('aria-hidden', 'true');
      w.split('').forEach(function (c) {
        var s = D.createElement('span'); s.className = 'ch'; s.textContent = c;
        ws.appendChild(s); chars.push(s);
      });
      el.appendChild(ws);
      if (wi < words.length - 1) el.appendChild(D.createTextNode(' '));
    });
    return chars;
  }
  function splitHero(el) {
    var out = [];
    var t = el.textContent; el.textContent = '';
    t.split('').forEach(function (c) {
      var o = D.createElement('span'), i = D.createElement('span');
      o.className = 'c'; o.setAttribute('aria-hidden', 'true'); i.className = 'ci'; i.textContent = c;
      o.appendChild(i); el.appendChild(o); out.push(i);
    });
    return out;
  }

  /* ---------- hero name: split + auto fit ---------- */
  var h1 = $('#name');
  if (h1 && anim) { splitHero($('.nm', h1)); splitHero($('.ini', h1)); }
  function fit() {
    if (!h1) return;
    h1.style.fontSize = '';
    var box = h1.clientWidth, sw = h1.scrollWidth, base = parseFloat(getComputedStyle(h1).fontSize);
    if (sw > box && box > 0) h1.style.fontSize = Math.floor(base * box / sw * 0.97) + 'px';
  }
  fit();
  addEventListener('resize', fit);
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { fit(); if (hasGsap) ScrollTrigger.refresh(); });

  /* ---------- marquees (speed reacts to scroll velocity) ---------- */
  var mqs = $$('.mq').map(function (mq) {
    var t = $('.mt', mq), items = t.dataset.t.split('|'), html = '';
    for (var k = 0; k < 4; k++) items.forEach(function (s) { html += '<span>' + s + '</span>'; });
    t.innerHTML = html;
    return { t: t, dir: +mq.dataset.dir, pos: 0, w: 0 };
  });
  function measureMq() { mqs.forEach(function (m) { m.w = m.t.scrollWidth / 4; }); }
  measureMq();
  addEventListener('resize', measureMq);
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(measureMq);
  if (!reduce) {
    var lastY = scrollY, boost = 0;
    (function mqLoop() {
      var y = scrollY, v = Math.abs(y - lastY); lastY = y;
      boost += (Math.min(v * 0.22, 16) - boost) * 0.1;
      mqs.forEach(function (m) {
        if (!m.w) return;
        m.pos += -m.dir * (0.7 + boost);
        var x = -(((m.pos % m.w) + m.w) % m.w);
        m.t.style.transform = 'translate3d(' + x + 'px,0,0)';
      });
      requestAnimationFrame(mqLoop);
    })();
  }

  /* ---------- hero particle field ---------- */
  (function initFx() {
    var cv = $('#fx'), hero = $('.hero');
    if (!cv || !hero || reduce) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, pts = [], m = { x: -999, y: -999 }, looping = false, visible = true;
    function size() {
      var r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, Math.max(26, W / 16)));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: Math.random() * 1.4 + .6 });
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        var dx = p.x - m.x, dy = p.y - m.y, d2 = dx * dx + dy * dy;
        if (d2 < 22000) { var d = Math.sqrt(d2) || 1, f = (1 - d / 148) * .9; p.x += dx / d * f; p.y += dy / d * f; }
        ctx.fillStyle = 'rgba(255,255,255,.65)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], ex = p.x - q.x, ey = p.y - q.y, dd = ex * ex + ey * ey;
          if (dd < 13000) {
            ctx.strokeStyle = 'rgba(229,37,58,' + ((1 - dd / 13000) * .38) + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (d2 < 30000) {
          ctx.strokeStyle = 'rgba(233,196,106,' + ((1 - d2 / 30000) * .5) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(m.x, m.y); ctx.stroke();
        }
      }
    }
    function loop() { if (!visible || D.hidden) { looping = false; return; } frame(); requestAnimationFrame(loop); }
    function kick() { if (!looping) { looping = true; loop(); } }
    size(); frame();
    addEventListener('resize', size);
    hero.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; }, { passive: true });
    hero.addEventListener('pointerleave', function () { m.x = m.y = -999; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(hero);
    D.addEventListener('visibilitychange', kick);
    kick();
  })();

  /* ---------- custom cursor ---------- */
  (function initCursor() {
    if (!fine || reduce) return;
    var c = $('#cursor'), dot = $('.dot', c), ring = $('.ring', c), mx = -100, my = -100, rx = -100, ry = -100;
    root.classList.add('cur-on');
    addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }, { passive: true });
    D.addEventListener('pointerover', function (e) { c.classList.toggle('big', !!e.target.closest('a,button,[data-tilt]')); });
    (function loop() {
      rx += (mx - rx) * .17; ry += (my - ry) * .17;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------- liquid glass sheen follows the pointer ---------- */
  D.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest('.glass');
    if (g) {
      var r = g.getBoundingClientRect();
      g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      g.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }
  }, { passive: true });

  /* ---------- nav: scramble on hover, scroll spy ---------- */
  var glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+';
  if (!reduce) $$('.nav nav a').forEach(function (a) {
    var orig = a.textContent, timer;
    a.addEventListener('pointerenter', function () {
      a.style.minWidth = a.offsetWidth + 'px'; a.style.textAlign = 'center';
      var f = 0; clearInterval(timer);
      timer = setInterval(function () {
        f++;
        a.textContent = orig.split('').map(function (ch, i) { return i < f / 2 ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]; }).join('');
        if (f / 2 >= orig.length) { clearInterval(timer); a.textContent = orig; }
      }, 28);
    });
  });
  var links = $$('.nav nav a'), secs = links.map(function (a) { return $(a.getAttribute('href')); });
  var lastScroll = scrollY, navHidden = false;
  addEventListener('scroll', function () {
    var y = scrollY, line = innerHeight * 0.4, cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < line) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
    if (anim && introDone) {
      var dy = y - lastScroll;
      if (Math.abs(dy) > 4) {
        var hide = dy > 0 && y > 260;
        if (hide !== navHidden) { navHidden = hide; gsap.to(nav, { yPercent: hide ? -170 : 0, duration: .6, ease: 'power3.out', overwrite: 'auto' }); }
        lastScroll = y;
      }
    }
  }, { passive: true });

  /* ---------- typewriter ---------- */
  var roles = ['.NET Developer', 'ASP.NET Core web apps', 'WPF desktop apps', 'Azure deployments', 'SQL Server databases'];
  function startTyping() {
    var el = $('#typed');
    if (!el || reduce || typing) return;
    typing = true;
    var ri = 0, ci = roles[0].length, del = true;
    (function tick() {
      var cur = roles[ri], wait;
      ci += del ? -1 : 1;
      el.textContent = cur.slice(0, ci);
      wait = del ? 34 : 70;
      if (!del && ci === cur.length) { wait = 1600; del = true; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; wait = 320; }
      setTimeout(tick, wait);
    })();
  }

  /* ---------- copy email ---------- */
  var cp = $('#cp');
  if (cp) cp.addEventListener('click', function () {
    var el = $('#em'), t = el.textContent, lab = $('span', cp);
    function ok() { lab.textContent = 'Copied'; setTimeout(function () { lab.textContent = 'Copy email'; }, 1600); }
    function sel() { var r = D.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    try { navigator.clipboard.writeText(t).then(ok, sel); } catch (e) { sel(); }
  });

  /* ---------- smooth scroll to anchors ---------- */
  D.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    var t = id === '#top' ? 0 : $(id);
    if (t === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: t === 0 ? 0 : -90, duration: 1.5 });
    else if (t === 0) scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- profile picker ---------- */
  function lock(on) {
    root.classList.toggle('lock', on);
    if (lenis) { on ? lenis.stop() : lenis.start(); }
  }
  function applyProfile(p) {
    if (p && names[p]) { D.body.setAttribute('data-p', p); who.textContent = names[p]; store('profile', p); }
  }
  function showPicker() {
    pick.hidden = false; lock(true);
    if (anim) {
      gsap.set(pick, { opacity: 1, scale: 1, filter: 'none' });
      gsap.fromTo(['#pick h2', '.prof', '#skip'], { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: .1, delay: .2 });
    }
  }
  function closePicker(p) {
    applyProfile(p);
    function after() {
      pick.hidden = true; lock(false);
      if (hasGsap) ScrollTrigger.refresh();
      if (!introDone) playIntro();
      var t = p === 'recruiter' ? $('#journey') : p === 'developer' ? $('#originals') : null;
      if (t) setTimeout(function () {
        if (lenis) lenis.scrollTo(t, { offset: -90, duration: 1.6 });
        else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      }, introDone && anim ? 900 : 300);
    }
    if (anim) gsap.to(pick, { opacity: 0, scale: 1.06, filter: 'blur(14px)', duration: .7, ease: 'power3.inOut', onComplete: after });
    else after();
  }
  $$('.prof').forEach(function (b) { b.addEventListener('click', function () { closePicker(b.dataset.p); }); });
  $('#skip').addEventListener('click', function () { closePicker(null); });
  $('#switch').addEventListener('click', showPicker);
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pick.hidden) closePicker(null); });

  /* ---------- hero intro ---------- */
  function playIntro() {
    if (introDone) return;
    introDone = true;
    if (!anim) { startTyping(); return; }
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(nav, { opacity: 1, yPercent: 0, duration: 1.3 }, 0)
      .to('.hero .ci', { yPercent: 0, duration: 1.6, stagger: .045 }, .1)
      .to(['.hero .eyebrow', '.hero .role', '.hero .lead', '.hero .tags', '.hero .btns', '.cue'], { opacity: 1, y: 0, duration: 1.3, stagger: .1 }, .5)
      .to('.poster-stage', { opacity: 1, scale: 1, rotationY: 0, duration: 1.9 }, .3)
      .to('.badge', { opacity: 1, scale: 1, duration: 1, stagger: .12, ease: 'back.out(2.2)' }, 1.1)
      .to('.marquees', { opacity: 1, duration: 1.4 }, .9)
      .call(startTyping, null, 1.4);
  }

  /* ---------- scroll-driven animation ---------- */
  function initScroll() {
    ScrollTrigger.config({ ignoreMobileResize: true });

    if (window.Lenis) {
      lenis = new Lenis({ lerp: .085, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }

    /* headings: letters rise out of a mask */
    $$('.split').forEach(function (h) {
      var chars = splitChars(h);
      gsap.set(chars, { yPercent: 118 });
      ScrollTrigger.create({ trigger: h, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(chars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .028 });
      } });
    });

    /* generic reveal */
    gsap.set('.rv', { opacity: 0, y: 48 });
    ScrollTrigger.batch('.rv', { start: 'top 92%', once: true, onEnter: function (b) {
      gsap.to(b, { opacity: 1, y: 0, duration: 1.3, ease: 'power3.out', stagger: .1, overwrite: true });
    } });

    /* project cards rise in, then stack and dim as the next one covers them */
    $$('.pcard').forEach(function (c) {
      gsap.from(c, { opacity: 0, y: 90, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 90%', once: true } });
    });
    gsap.matchMedia().add('(min-width:1000px) and (min-height:720px)', function () {
      var cards = $$('.pcard');
      cards.forEach(function (c, i) {
        var next = cards[i + 1];
        if (!next) return;
        gsap.to(c, { scale: .93, filter: 'brightness(.5)', ease: 'none', scrollTrigger: { trigger: next, start: 'top 85%', end: 'top ' + (92 + (i + 1) * 26) + 'px', scrub: true } });
      });
    });

    /* timeline line fills as you read */
    gsap.to('#lineFill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#seasons', start: 'top 70%', end: 'bottom 70%', scrub: .4 } });

    /* progress bar */
    gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } });

    /* hero parallax */
    gsap.to('.hero-text', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.poster-wrap', { yPercent: -16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('#fx', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '55% top', end: 'bottom top', scrub: true } });

    if (fine) {
      /* 3D tilt on cards */
      $$('[data-tilt]').forEach(function (el) {
        gsap.set(el, { transformPerspective: 900 });
        var rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3.out' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          ry(x * 12); rx(-y * 10);
        });
        el.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });
      /* magnetic buttons */
      $$('.magnet').forEach(function (b) {
        var s = $('span', b);
        var bx = gsap.quickTo(b, 'x', { duration: .7, ease: 'power3.out' }), by = gsap.quickTo(b, 'y', { duration: .7, ease: 'power3.out' });
        var sx = gsap.quickTo(s, 'x', { duration: .7, ease: 'power3.out' }), sy = gsap.quickTo(s, 'y', { duration: .7, ease: 'power3.out' });
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          bx(dx * .28); by(dy * .34); sx(dx * .12); sy(dy * .16);
        });
        b.addEventListener('pointerleave', function () { bx(0); by(0); sx(0); sy(0); });
      });
      /* hero poster follows the pointer in 3D */
      var hero = $('.hero'), stage = $('#stage'), badges = $$('.badge');
      var sry = gsap.quickTo(stage, 'rotationY', { duration: 1, ease: 'power3.out' }), srx = gsap.quickTo(stage, 'rotationX', { duration: 1, ease: 'power3.out' });
      var bq = badges.map(function (b) { return { x: gsap.quickTo(b, 'x', { duration: 1.2, ease: 'power3.out' }), y: gsap.quickTo(b, 'y', { duration: 1.2, ease: 'power3.out' }), d: +b.dataset.depth }; });
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        sry(nx * 24); srx(-ny * 18);
        bq.forEach(function (q) { q.x(nx * q.d * 30); q.y(ny * q.d * 30); });
      });
      hero.addEventListener('pointerleave', function () { sry(0); srx(0); bq.forEach(function (q) { q.x(0); q.y(0); }); });
    }
  }

  /* ---------- loader ---------- */
  function startAfterLoader() {
    var saved = store('profile');
    if (saved && names[saved]) { applyProfile(saved); playIntro(); lock(false); }
    else showPicker();
  }
  function runLoader() {
    var pct = $('#ldPct'), bar = $('#ldBar'), o = { v: 0 };
    root.classList.add('lock');
    gsap.set('.ld-vr i', { yPercent: 112 });
    var fonts = (D.fonts && D.fonts.ready) ? Promise.race([D.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]) : Promise.resolve();
    var tl = gsap.timeline();
    tl.to('.ld-vr i', { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .12 }, 0)
      .to(o, { v: 100, duration: 1.9, ease: 'power2.inOut', onUpdate: function () {
        pct.textContent = String(Math.round(o.v)).padStart(3, '0');
        bar.style.transform = 'scaleX(' + (o.v / 100) + ')';
      } }, 0);
    Promise.all([fonts, new Promise(function (res) { tl.eventCallback('onComplete', res); })]).then(function () {
      var ex = gsap.timeline({ onComplete: function () { loader.style.display = 'none'; } });
      ex.to('.ld-vr i', { yPercent: -112, duration: .7, ease: 'expo.in', stagger: .08 })
        .to(['.ld-top', '.ld-bot', '.ld-bar'], { opacity: 0, duration: .4 }, '<')
        .add(startAfterLoader)
        .to(loader, { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '<');
    });
  }

  /* ---------- boot ---------- */
  function plain() {
    if (loader) loader.style.display = 'none';
    var saved = store('profile');
    if (saved && names[saved]) { applyProfile(saved); playIntro(); }
    else { pick.hidden = false; lock(true); }
  }
  try {
    if (!anim) { plain(); return; }
    /* hide everything that the intro will reveal */
    gsap.set('.hero .ci', { yPercent: 118 });
    gsap.set(['.hero .eyebrow', '.hero .role', '.hero .lead', '.hero .tags', '.hero .btns', '.cue'], { opacity: 0, y: 34 });
    gsap.set('.poster-stage', { opacity: 0, scale: .86, rotationY: -30 });
    gsap.set('.badge', { opacity: 0, scale: .5 });
    gsap.set(nav, { opacity: 0, yPercent: -170 });
    gsap.set('.marquees', { opacity: 0 });
    gsap.registerPlugin(ScrollTrigger);
    initScroll();
    addEventListener('load', function () { ScrollTrigger.refresh(); });
    runLoader();
  } catch (err) {
    if (window.console) console.error(err);
    if (loader) loader.style.display = 'none';
    if (hasGsap) {
      ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
      gsap.set(['.hero .ci', '.hero .eyebrow', '.hero .role', '.hero .lead', '.hero .tags', '.hero .btns', '.cue', '.poster-stage', '.badge', '.marquees', '.rv', '.split .ch', '.pcard', nav], { clearProps: 'all' });
    }
    root.classList.remove('lock'); pick.hidden = true;
  }
})();
