/* ============================================================
   Avyagraha: v4 motion layer

   Loads after js/script.js, which keeps the carousels, lightbox,
   menu, count-up, scrollspy and enquiry form. This file adds only
   the new motion, and adds nothing that blocks rendering.

   Rules held throughout:
   - transform + opacity only
   - one shared IntersectionObserver for every scroll reveal
   - canvas work stops when offscreen or the tab is hidden
   - everything is skipped under prefers-reduced-motion
   ============================================================ */
(function(){
  'use strict';

  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mq && mq.matches;
  var coarse = window.matchMedia && window.matchMedia('(max-width:820px)').matches;

  /* ---------------------------------------------------------
     1. ONE OBSERVER for every scroll-triggered effect.
     Elements register a callback; each fires once.
     --------------------------------------------------------- */
  var jobs = new WeakMap();
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      var fn = jobs.get(e.target);
      io.unobserve(e.target);
      if (fn) fn(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }) : null;

  function onReveal(el, fn){
    if (!el) return;
    if (!io || reduced){ fn(el); return; }
    jobs.set(el, fn);
    io.observe(el);
  }

  /* section + card reveals */
  document.querySelectorAll('[data-rv]').forEach(function(el){
    onReveal(el, function(t){ t.classList.add('rv-in'); });
  });

  /* ---------------------------------------------------------
     2. NETWORK CANVAS
     A plexus matched to the company film's opening sequence:
     ground #0C1830, lines #1B8F97, nodes #32B1B4. Drawn rather
     than played so it loops seamlessly, costs no video decode
     and adapts to any viewport.
     --------------------------------------------------------- */
  function plexus(canvas, opts){
    if (!canvas || reduced) return;
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    opts = opts || {};
    var DENSITY = opts.density || 0.000055;   /* nodes per px^2 */
    var LINK    = opts.link || 150;           /* link distance  */
    /* px per frame. At 60fps 0.55 moves a node ~33px/s, so a link forms or
       breaks within about two seconds: the threshold at which the field
       reads as alive rather than still. 0.16 (the previous value) was
       ~9px/s and was not perceptible. */
    var SPEED   = opts.speed || 0.16;
    var MAXN    = coarse ? 40 : (opts.max || 90);
    /* sampled from the reference frame: the field there is a tight azure
       family, not a multi-hue mix: #25A2DA cores, #4CB0DE hot points and
       a #61B7DC glow */
    var PAL     = opts.palette || [
      [ 37,162,218],   /* #25A2DA node core   */
      [ 76,176,222],   /* #4CB0DE hot point   */
      [ 97,183,220],   /* #61B7DC glow blue   */
      [140,205,240],   /* lift                */
      [205,234,248]    /* rare white-blue     */
    ];

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], raf = 0, running = false;

    function size(){
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = Math.min(MAXN, Math.round(w * h * DENSITY));
      nodes = [];
      for (var i = 0; i < want; i++){
        var hue = PAL[(Math.random() * PAL.length) | 0];
        nodes.push({
          x: Math.random() * w,
          /* bias toward a horizontal band, like the film */
          y: h * (0.18 + Math.random() * 0.64),
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED * 0.6,
          r: 0.9 + Math.random() * 1.7,
          c: hue
        });
      }
    }

    function frame(){
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, d2, alpha;
      var L2 = LINK * LINK;

      for (i = 0; i < nodes.length; i++){
        a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
        if (a.y < h * 0.08) a.vy = Math.abs(a.vy);
        else if (a.y > h * 0.92) a.vy = -Math.abs(a.vy);
      }
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++){
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++){
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
          if (d2 > L2) continue;
          alpha = (1 - d2 / L2) * 0.55;
          ctx.strokeStyle = 'rgba(' + a.c[0] + ',' + a.c[1] + ',' + a.c[2] + ',' + alpha.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (i = 0; i < nodes.length; i++){
        a = nodes[i];
        ctx.fillStyle = 'rgba(' + a.c[0] + ',' + a.c[1] + ',' + a.c[2] + ',.13)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 4.2, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(' + a.c[0] + ',' + a.c[1] + ',' + a.c[2] + ',.95)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function start(){ if (running) return; running = true; raf = requestAnimationFrame(frame); }
    function stop(){ running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    size();
    /* only animate while on screen */
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){ e.isIntersecting && !document.hidden ? start() : stop(); });
      }, { threshold: 0 }).observe(canvas);
    } else { start(); }

    document.addEventListener('visibilitychange', function(){
      document.hidden ? stop() : start();
    });

    var t;
    window.addEventListener('resize', function(){
      clearTimeout(t); t = setTimeout(function(){ size(); }, 180);
    }, { passive: true });

    canvas.classList.add('on');
    return { start: start, stop: stop };
  }

  /* ---------------------------------------------------------
     2b. HERO STAGE
     The looping network clip and the drifting photographs only run
     while the hero is on screen and the tab is visible. Under
     reduced motion the video holds on its poster and the CSS
     settles the photographs into a single still frame.
     --------------------------------------------------------- */
  (function(){
    var hero   = document.getElementById('hero');
    var video  = document.getElementById('heroVideo');
    var photos = document.getElementById('heroPhotos');
    if (!hero) return;

    if (reduced){
      /* the markup carries autoplay so the clip starts without waiting on
         JS; under reduced motion stop it at once and rest on frame one */
      if (video){
        video.removeAttribute('loop');
        video.autoplay = false;
        video.pause();
        try { video.currentTime = 0; } catch(e){}
      }
      return;                      /* CSS holds the stage still */
    }
    if (photos) photos.classList.add('playing');

    function play(){
      if (!video) return;
      var p = video.play();
      /* autoplay can be refused; the poster is a valid resting state */
      if (p && p.catch) p.catch(function(){});
    }
    function halt(){
      if (video && !video.paused) video.pause();
      if (photos) photos.classList.remove('playing');
    }
    function resume(){
      play();
      if (photos) photos.classList.add('playing');
    }

    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          (e.isIntersecting && !document.hidden) ? resume() : halt();
        });
      }, { threshold: 0 }).observe(hero);
    } else { play(); }

    document.addEventListener('visibilitychange', function(){
      document.hidden ? halt() : resume();
    });
  })();

  plexus(document.getElementById('heroNet'),
         { density: 0.000085, link: 175, speed: 0.55, max: 130 });
  plexus(document.getElementById('collabNet'),
         { density: 0.000034, link: 155, max: 54, speed: 0.09,
           palette: [[37,162,218],[76,176,222],[97,183,220]] });

  /* ---------------------------------------------------------
     3. SOLUTIONS: nine practice areas arrive as a diagonal wave
     The delay comes from each entry's row and column in the grid as
     it is actually laid out, so the wave still reads at two columns
     and at one. One observer, fired once.
     --------------------------------------------------------- */
  (function(){
    var grid = document.getElementById('solIndex');
    if (!grid) return;
    var cells = [].slice.call(grid.querySelectorAll('.sol-cell'));
    if (!cells.length) return;

    function wave(){
      var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 1;
      cells.forEach(function(c, i){
        var step = (Math.floor(i / cols) + (i % cols)) * 0.07;
        c.style.setProperty('--d',  step.toFixed(2) + 's');
        c.style.setProperty('--d1', (step + 0.16).toFixed(2) + 's');
        c.style.setProperty('--d2', (step + 0.28).toFixed(2) + 's');
      });
    }
    wave();

    onReveal(grid, function(g){ wave(); g.classList.add('drawn'); });

    var t;
    window.addEventListener('resize', function(){
      clearTimeout(t);
      t = setTimeout(function(){ if (!grid.classList.contains('drawn')) wave(); }, 180);
    }, { passive: true });
  })();

  /* ---------------------------------------------------------
     4. TIMELINE: the connector draws, then the dots light
     --------------------------------------------------------- */
  onReveal(document.getElementById('timeline'), function(tl){
    tl.classList.add('drawn');
    var steps = [].slice.call(tl.querySelectorAll('.tl-step'));
    if (reduced){ steps.forEach(function(s){ s.classList.add('lit'); }); return; }
    steps.forEach(function(s, i){
      setTimeout(function(){ s.classList.add('lit'); }, 220 + i * 260);
    });
  });

  /* ---------------------------------------------------------
     4b. ABOUT: eight capabilities emerge from the brain
     Node targets are computed here, not hard-coded, so the same SVG
     serves the radial layout and the column layout used on small
     screens. Each node starts at the centre of the brain and travels
     out along its own connector; the connector grows with it.
     --------------------------------------------------------- */
  (function(){
    var section = document.querySelector('.about');
    var svg     = document.getElementById('abSvg');
    var caption = document.getElementById('abCaption');
    if (!section || !svg) return;

    var nodes = [].slice.call(svg.querySelectorAll('.ab-node'));
    var links = [].slice.call(svg.querySelectorAll('.ab-link'));
    if (!nodes.length) return;

    var CX = 360, CY = 360;
    var restCaption = caption ? caption.textContent : '';

    /* Every circle is sized from the text it has to hold: measure the
       widest line, take the radius that circumscribes the whole block,
       and give all eight the largest of those so they stay a set. The
       markup already carries a sensible radius, so a browser that
       cannot measure text keeps a working layout. */
    var LH = 17, ICON_H = 52, ICON_GAP = 9, CAP = 11, INK_PAD = 12, HALO_GAP = 13;
    var discR = 90, haloR = 103;

    /* Each circle holds an icon above its label. Stack the two, centre the
       stack on the disc, then take the radius that circumscribes every
       corner of it: the icon box and each line of type. All eight share
       the largest so they stay a set. The markup carries working values,
       so a browser that cannot measure text still lays out correctly. */
    function fitNodes(){
      var need = 0, geo = [];
      nodes.forEach(function(n){
        var img   = n.querySelector('.ab-ico');
        var label = n.querySelector('.ab-label');
        var lines = label ? [].slice.call(label.querySelectorAll('tspan')) : [];
        var iw    = img ? parseFloat(img.getAttribute('data-w')) || 0 : 0;
        var ih    = img ? ICON_H : 0;
        var stack = (img ? ih + ICON_GAP : 0) + (lines.length - 1) * LH + CAP + 4;
        var top   = -stack / 2;
        var first = top + (img ? ih + ICON_GAP : 0) + CAP;
        geo.push({ n:n, img:img, label:label, lines:lines, iw:iw, top:top, first:first });
        function corner(halfW, y){
          var r = Math.sqrt(halfW * halfW + y * y);
          if (r > need) need = r;
        }
        if (img){ corner(iw / 2, top); corner(iw / 2, top + ih); }
        lines.forEach(function(sp, j){
          var w = 0;
          try { w = sp.getComputedTextLength(); } catch (e){}
          if (!w) return;
          var base = first + j * LH;
          corner(w / 2, base - CAP); corner(w / 2, base + 4);
        });
      });
      if (!need) return;
      discR = Math.ceil(need + INK_PAD);
      haloR = discR + HALO_GAP;
      geo.forEach(function(g){
        var d = g.n.querySelector('.ab-disc'), h = g.n.querySelector('.ab-halo');
        if (d) d.setAttribute('r', discR);
        if (h) h.setAttribute('r', haloR);
        if (g.img){
          g.img.setAttribute('x', (-g.iw / 2).toFixed(1));
          g.img.setAttribute('y', g.top.toFixed(1));
          g.img.setAttribute('width', g.iw.toFixed(1));
          g.img.setAttribute('height', ICON_H);
        }
        if (g.label) g.label.setAttribute('y', g.first.toFixed(1));
      });
    }

    function layout(){
      fitNodes();
      var column = window.matchMedia('(max-width:760px)').matches;
      var W, H, pts = [];

      if (column){
        /* the same idea, stacked: the core sits at the top and the
           capabilities travel outward and downward in two columns */
        var colX = haloR + 8;
        W = 2 * (colX + haloR + 6);
        CX = W / 2; CY = 214;
        var stepY = 2 * haloR + 22;
        var firstY = CY + 156 + haloR;
        H = firstY + 3 * stepY + haloR + 18;
        for (var i = 0; i < nodes.length; i++){
          pts.push({ x: (i % 2 ? colX : -colX),
                     y: (firstY - CY) + Math.floor(i / 2) * stepY });
        }
      } else {
        /* the ring has to be wide enough that neighbouring haloes clear
           each other: the chord between two adjacent nodes is 2R sin(pi/n) */
        var R = Math.max(262, Math.ceil((2 * haloR + 18) /
                (2 * Math.sin(Math.PI / nodes.length))));
        W = H = 2 * (R + haloR + 8);
        CX = CY = W / 2;
        for (var k = 0; k < nodes.length; k++){
          var a = (-90 + k * 45) * Math.PI / 180;   /* clockwise from top */
          pts.push({ x: Math.round(Math.cos(a) * R), y: Math.round(Math.sin(a) * R) });
        }
      }

      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

      nodes.forEach(function(n, i){
        n.style.setProperty('--tx', pts[i].x + 'px');
        n.style.setProperty('--ty', pts[i].y + 'px');
        /* the resting position also has to follow the core */
        n.style.setProperty('--cx', CX + 'px');
        n.style.setProperty('--cy', CY + 'px');
      });

      links.forEach(function(l, i){
        var x2 = CX + pts[i].x, y2 = CY + pts[i].y;
        l.setAttribute('x1', CX); l.setAttribute('y1', CY);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        var len = Math.round(Math.hypot(pts[i].x, pts[i].y));
        l.style.setProperty('--len', len);
      });

      var brain = document.getElementById('abBrain');
      if (brain) brain.setAttribute('transform', 'translate(' + (CX - 360) + ',' + (CY - 360) + ')');
      svg.style.setProperty('--cx', CX + 'px');
      svg.style.setProperty('--cy', CY + 'px');
    }

    /* stagger: one after another, each with its connector */
    function stage(){
      nodes.forEach(function(n, i){
        var d = (0.28 + i * 0.22).toFixed(2) + 's';
        n.style.transitionDelay = d + ', ' + d;
      });
      links.forEach(function(l, i){
        l.style.transitionDelay = (0.28 + i * 0.22).toFixed(2) + 's';
      });
      section.classList.add('emerged');
    }

    /* hovering a capability lights its connector and names it */
    nodes.forEach(function(n, i){
      function on(){
        if (caption) caption.textContent = n.getAttribute('data-desc') || restCaption;
        if (links[i]) links[i].classList.add('lit');
      }
      function off(){
        if (caption) caption.textContent = restCaption;
        if (links[i]) links[i].classList.remove('lit');
      }
      n.addEventListener('mouseenter', on);
      n.addEventListener('mouseleave', off);
      n.addEventListener('focus', on);
      n.addEventListener('blur', off);
    });

    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    var t;
    window.addEventListener('resize', function(){
      clearTimeout(t); t = setTimeout(layout, 180);
    }, { passive: true });

    if (reduced){ section.classList.add('emerged'); return; }   /* final state, no travel */

    if ('IntersectionObserver' in window){
      var once = new IntersectionObserver(function(es){
        es.forEach(function(e){ if (e.isIntersecting){ stage(); once.unobserve(section); } });
      }, { threshold: 0.25 });
      once.observe(section);

      new IntersectionObserver(function(es){
        es.forEach(function(e){
          section.classList.toggle('live', e.isIntersecting && !document.hidden);
        });
      }, { threshold: 0 }).observe(section);
    } else { stage(); section.classList.add('live'); }

    document.addEventListener('visibilitychange', function(){
      if (document.hidden) section.classList.remove('live');
    });
  })();

  /* ---------------------------------------------------------
     5. 5eriMITRA
     Two separate things, deliberately:
       .staged  the five capabilities have arrived. Set once and never
                cleared, so they do not re-stage on every scroll past.
       .live    the silkworm idle is running. Toggles with visibility.
     --------------------------------------------------------- */
  (function(){
    var section = document.querySelector('.flagship');
    if (!section) return;

    if (reduced){ section.classList.add('staged'); return; }

    if ('IntersectionObserver' in window){
      /* one-shot: the capabilities step in the first time it is seen */
      var once = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (!e.isIntersecting) return;
          section.classList.add('staged');
          once.unobserve(section);
        });
      }, { threshold: 0.2 });
      once.observe(section);

      /* ongoing: the idle only runs while on screen */
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          section.classList.toggle('live', e.isIntersecting && !document.hidden);
        });
      }, { threshold: 0 }).observe(section);
    } else {
      section.classList.add('staged', 'live');
    }

    document.addEventListener('visibilitychange', function(){
      if (document.hidden) section.classList.remove('live');
    });
  })();





  /* ---------------------------------------------------------
     6. FILM: click to play. Nothing loads until asked.
     --------------------------------------------------------- */
  (function(){
    var btn = document.getElementById('filmPlay');
    var vid = document.getElementById('filmPlayer');
    if (!btn || !vid) return;
    btn.addEventListener('click', function(){
      btn.hidden = true;
      vid.setAttribute('preload', 'auto');
      var p = vid.play();
      if (p && p.catch) p.catch(function(){ btn.hidden = false; });
      vid.focus({ preventScroll: true });
    });
    vid.addEventListener('pause', function(){ if (vid.currentTime === 0) btn.hidden = false; });
  })();

  /* ---------------------------------------------------------
     7. SECTION MOTION: one language per chapter
     Each controller below registers with the shared observer in
     module 1, so every entrance fires once and then stops. Ambient
     motion (the two drifts) is gated on a `live` class that is only
     present while the section is actually on screen.
     --------------------------------------------------------- */

  /* stagger helper: writes the two delay slots the CSS reads */
  function seq(nodes, step, base, gap){
    base = base || 0; gap = (gap === undefined) ? 0.18 : gap;
    nodes.forEach(function(n, i){
      var d = base + i * step;
      n.style.setProperty('--d', d.toFixed(2) + 's');
      n.style.setProperty('--d2', (d + gap).toFixed(2) + 's');
    });
  }

  /* ambient motion only while the section is in view */
  function liveWhileVisible(el){
    if (!el || reduced) return;
    if (!('IntersectionObserver' in window)){ el.classList.add('live'); return; }
    new IntersectionObserver(function(es){
      es.forEach(function(e){ el.classList.toggle('live', e.isIntersecting); });
    }, { threshold: 0 }).observe(el);
  }

  /* --- PROBLEMS: the line draws while each problem is plotted --- */
  onReveal(document.getElementById('probMap'), function(map){
    map.classList.add('mapped');
    var probs = [].slice.call(map.querySelectorAll('.prob'));
    if (reduced){ probs.forEach(function(p){ p.classList.add('on'); }); return; }
    probs.forEach(function(p, i){
      setTimeout(function(){ p.classList.add('on'); }, 200 + i * 300);
    });
  });

  /* --- AERIAL: the frame opens, the facts follow, changes get a direction --- */
  (function(){
    var gal = document.getElementById('geoGal');
    if (!gal) return;
    var stage = gal.querySelector('.geo-stage');
    var facts = document.querySelector('.geo-facts');

    onReveal(gal, function(){
      gal.classList.add('shown');
      setTimeout(function(){ liveWhileVisible(gal); }, 1200);
    });
    if (facts){
      seq([].slice.call(facts.children), 0.07, 0.25);
      onReveal(facts, function(){ facts.classList.add('shown'); });
    }

    /* Wrap the global control rather than replacing it, so the existing
       prev/next buttons, dots, caption and counter keep working. */
    var orig = window.geoShow;
    if (typeof orig === 'function' && stage){
      window.geoShow = function(i){
        var slides = gal.querySelectorAll('.geo-slide');
        var n = slides.length, from = 0;
        for (var k = 0; k < n; k++) if (slides[k].classList.contains('active')) from = k;
        var to = ((i % n) + n) % n;
        if (to !== from && !reduced){
          var fwd = ((to - from + n) % n) <= n / 2;
          stage.setAttribute('data-dir', fwd ? 'next' : 'prev');
        }
        return orig.apply(this, arguments);
      };
    }
  })();

  /* --- RESEARCH: areas index in, the award closes --- */
  (function(){
    var areas = document.querySelector('.res-areas');
    if (areas){
      seq([].slice.call(areas.children), 0.08, 0, 0.14);
      onReveal(areas, function(){ areas.classList.add('indexed'); });
    }
    onReveal(document.querySelector('.res-award'), function(a){ a.classList.add('shown'); });
  })();

  /* --- WHO WE WORK WITH: statements, then the sector labels --- */
  (function(){
    var grid = document.querySelector('.aud-grid');
    if (grid){
      seq([].slice.call(grid.children), 0.08, 0.04, 0.16);
      onReveal(grid, function(){ grid.classList.add('told'); });
    }
    var strip = document.querySelector('.ind-strip');
    if (strip){
      seq([].slice.call(strip.querySelectorAll('.ind-list li')), 0.04, 0.08);
      onReveal(strip, function(){ strip.classList.add('told'); });
    }
  })();

  /* --- TECHNOLOGY: one continuous scroll, with a stop control ---
     The strip never stops on its own, so WCAG 2.2.2 needs a control.
     It also pauses on hover, on focus, when scrolled out of view and
     when the tab is hidden, so it is never animating unseen. */
  (function(){
    var strip = document.getElementById('expMarquee');
    var btn   = document.getElementById('mqToggle');
    if (!strip) return;
    var label = btn && btn.querySelector('.mq-label');
    var paused = false;

    function apply(){
      strip.classList.toggle('is-paused', paused);
      if (!btn) return;
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (label) label.textContent = paused ? 'Play logo animation' : 'Pause logo animation';
    }
    if (btn) btn.addEventListener('click', function(){ paused = !paused; apply(); });

    if (reduced){
      paused = true; apply();
      if (btn){
        btn.disabled = true;
        btn.title = 'Animation is off because your system requests reduced motion';
      }
      return;
    }
    apply();

    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (paused) return;
          strip.classList.toggle('is-paused', !e.isIntersecting);
        });
      }, { threshold: 0 }).observe(strip);
    }
    document.addEventListener('visibilitychange', function(){
      if (!paused) strip.classList.toggle('is-paused', document.hidden);
    });
  })();

  /* --- TRAINING / CONCLAVES / AWARDS: image archives --- */
  [].slice.call(document.querySelectorAll('.ev-grid, .aw-grid')).forEach(function(grid){
    var award = grid.classList.contains('aw-grid');
    seq([].slice.call(grid.children), award ? 0.1 : 0.07, 0.04, award ? 0.5 : 0.2);
    onReveal(grid, function(){ grid.classList.add(award ? 'framed' : 'filed'); });
  });

  /* --- TALKS: frame first, metadata after --- */
  [].slice.call(document.querySelectorAll('.it-card')).forEach(function(card, i){
    var d = Math.min(i, 5) * 0.07;
    card.style.setProperty('--d', d.toFixed(2) + 's');
    card.style.setProperty('--d2', (d + 0.24).toFixed(2) + 's');
    onReveal(card, function(){ card.classList.add('filed'); });
  });

  /* --- WHY US: the reader's position lights one point at a time --- */
  (function(){
    var stack = document.getElementById('pillStack');
    if (!stack) return;
    var pills = [].slice.call(stack.querySelectorAll('.pill'));
    var bar = stack.querySelector('.pill-rail i');
    seq(pills, 0.07, 0.04);
    onReveal(stack, function(){ stack.classList.add('stacked'); });

    if (reduced || !('IntersectionObserver' in window)){
      pills.forEach(function(p){ p.classList.add('active'); });
      if (bar) bar.style.transform = 'scaleY(1)';
      return;
    }
    var reached = 0;
    var band = new IntersectionObserver(function(es){
      es.forEach(function(e){
        e.target.classList.toggle('active', e.isIntersecting);
        if (e.isIntersecting) reached = Math.max(reached, pills.indexOf(e.target) + 1);
      });
      /* never leave the composition with nothing lit */
      if (!pills.some(function(p){ return p.classList.contains('active'); }) && reached){
        pills[reached - 1].classList.add('active');
      }
      /* transform, not height: no layout on every scroll tick */
      if (bar) bar.style.transform = 'scaleY(' + (reached / pills.length).toFixed(3) + ')';
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });
    pills.forEach(function(p){ band.observe(p); });
  })();

  /* --- TESTIMONIALS: all four readable, emphasis moves slowly --- */
  (function(){
    var grid = document.querySelector('.quote-grid');
    if (!grid) return;
    var quotes = [].slice.call(grid.querySelectorAll('.quote'));
    seq(quotes, 0.07, 0.04);
    onReveal(grid, function(){ grid.classList.add('voiced'); });

    if (reduced || quotes.length < 2){
      quotes.forEach(function(q){ q.classList.add('lead'); });
      return;
    }
    var i = 0, timer = null, onScreen = false;
    function tick(){
      quotes.forEach(function(q, k){ q.classList.toggle('lead', k === i); });
      i = (i + 1) % quotes.length;
    }
    function start(){ if (timer) return; tick(); timer = setInterval(tick, 5600); }
    function stop(){ clearInterval(timer); timer = null; }
    grid.addEventListener('mouseenter', stop);
    grid.addEventListener('focusin', stop);
    grid.addEventListener('mouseleave', function(){ if (onScreen) start(); });
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          onScreen = e.isIntersecting;
          onScreen ? start() : stop();
        });
      }, { threshold: 0.2 }).observe(grid);
    } else { onScreen = true; start(); }
  })();

  /* --- NEWS: date, then headline --- */
  (function(){
    var list = document.querySelector('.news-list');
    if (!list) return;
    seq([].slice.call(list.children), 0.08, 0, 0.14);
    onReveal(list, function(){ list.classList.add('filed'); });
  })();

  /* --- FILM: the frame settles in; playing quietens the surround --- */
  (function(){
    var frame = document.querySelector('.film-frame');
    if (!frame) return;
    onReveal(frame, function(f){ f.classList.add('rolled'); });
    var vid = document.getElementById('filmPlayer');
    if (!vid) return;
    vid.addEventListener('play',  function(){ frame.classList.add('playing'); });
    vid.addEventListener('pause', function(){ if (vid.ended || vid.currentTime === 0) frame.classList.remove('playing'); });
    vid.addEventListener('ended', function(){ frame.classList.remove('playing'); });
  })();

  /* --- CONTACT: information, then the form, top to bottom --- */
  (function(){
    var rows = document.querySelector('.cn-rows');
    if (rows){
      seq([].slice.call(rows.children), 0.06, 0.04);
      onReveal(rows, function(){ rows.classList.add('shown'); });
    }
    var box = document.querySelector('.form-box');
    if (box){
      var form = box.querySelector('#enquiryForm');
      var parts = [].slice.call(box.querySelectorAll(':scope > .fh, :scope > .fhs'))
        .concat(form ? [].slice.call(form.children) : []);
      seq(parts, 0.045, 0.04);
      onReveal(box, function(){ box.classList.add('shown'); });
    }
  })();

  /* ---------------------------------------------------------
     8. READING RAIL + BACK TO TOP
     --------------------------------------------------------- */
  (function(){
    var bar = document.getElementById('railBar');
    var top = document.getElementById('toTop');
    var ticking = false;
    function update(){
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (top){
        var show = window.scrollY > window.innerHeight * 1.5;
        top.hidden = !show;
        top.classList.toggle('show', show);
      }
      ticking = false;
    }
    function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (top) top.addEventListener('click', function(e){
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var skip = document.querySelector('.skip') || document.body;
      skip.setAttribute('tabindex', '-1');
      skip.focus({ preventScroll: true });
    });
    update();
  })();

})();
