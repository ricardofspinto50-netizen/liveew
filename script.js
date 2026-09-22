
(function(){
  function initPreloader(){
    var preloader = document.querySelector('[data-hp-preloader]');
    if (!preloader || preloader.getAttribute('data-ready') === 'true') return;
    preloader.setAttribute('data-ready', 'true');

    var startedAt = performance.now();
    var closing = false;
    var close = function(){
      if (closing) return;
      closing = true;
      var minimumVisibleTime = Math.max(0, 520 - (performance.now() - startedAt));
      setTimeout(function(){
        preloader.classList.add('is-leaving');
        setTimeout(function(){
          if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 480);
      }, minimumVisibleTime);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(close, close);
    } else {
      setTimeout(close, 120);
    }
    window.addEventListener('load', close, { once:true });
    setTimeout(close, 1600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreloader, { once:true });
  } else {
    initPreloader();
  }
})();

(function(){
  "use strict";

  window.__hpUseGsapStacks = true;

  var HP_CONFIG = {
    scrollDistanceVH: 130,
    scrub: true,

    parallax: {
      sky:       0.05,
      bgClouds:  0.15,
      house:     0.35,
      fgClouds:  0.80
    },

    house: {
      travelPercent: 42,
      endScale: 1.06
    },

    fgClouds: {
      startPercent: -30,
      travelPercent: 50,
      endScale: 1.16
    },

    bgClouds: {
      driftYPercent: 6,
      driftXPercent: 3
    },

    sky: {
      driftYPercent: 2
    }
  };

  var STATS_CONFIG = {
    scrollDistanceVH: 240   // duração total do scroll "preso" para as 3 mensagens (cada uma ocupa ~1/3 disto)
  };

  var CDN = {
    gsap: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
    scrollTrigger: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js",
    lenis: "https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"
  };

  function loadScript(src){
    return new Promise(function(resolve, reject){
      var existing = document.querySelector('script[data-hp-src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute('data-hp-loaded') === 'true') { resolve(); return; }
        existing.addEventListener('load', function(){ resolve(); });
        existing.addEventListener('error', reject);
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-hp-src', src);
      s.onload = function(){ s.setAttribute('data-hp-loaded', 'true'); resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureLibraries(){
    var need = [];
    if (typeof window.gsap === "undefined") need.push(loadScript(CDN.gsap));
    return Promise.all(need)
      .then(function(){
        var need2 = [];
        if (typeof window.ScrollTrigger === "undefined") need2.push(loadScript(CDN.scrollTrigger));
        if (typeof window.Lenis === "undefined" && !window.matchMedia("(pointer: coarse)").matches) need2.push(loadScript(CDN.lenis).catch(function(){}));
        return Promise.all(need2);
      });
  }

  function initHeroParallax(root){
    if (!root || root.getAttribute('data-hp-initialized') === 'true') return;
    root.setAttribute('data-hp-initialized', 'true');

    var sticky  = root.querySelector('[data-hp-sticky]');
    var sky      = root.querySelector('[data-hp-layer="sky"]');
    var bgClouds = root.querySelector('[data-hp-layer="bgClouds"]');
    var house    = root.querySelector('[data-hp-layer="house"]');
    var fgClouds = root.querySelector('[data-hp-layer="fgClouds"]');
    var cloudWipe = root.querySelector('[data-hp-layer="cloudWipe"]');
    var mobileGround = root.querySelector('[data-hp-mobile-ground]');

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.config({ ignoreMobileResize: true });

    var lenis = window.__heroParallaxLenis;
    if (!lenis && typeof window.Lenis !== "undefined" && !window.matchMedia("(pointer: coarse)").matches) {
      lenis = new Lenis({
        
        duration: 1.15,
        easing: function(t){ return 1 - Math.pow(1 - t, 4); },
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
        touchMultiplier: 1
      });
      window.__heroParallaxLenis = lenis;

      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add(function(time){
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    if (sticky) {
    root.classList.add('hp-hero-native');

    gsap.set(fgClouds, { yPercent: HP_CONFIG.fgClouds.startPercent });
    if (cloudWipe) { gsap.set(cloudWipe, { yPercent: 100 }); }
    if (mobileGround) { gsap.set(mobileGround, { y: 0 }); }

    var mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 901px)",
        isTablet:  "(min-width: 701px) and (max-width: 900px)",
        isMobile:  "(max-width: 700px)"
      },
      function(context){
        var isMobile  = context.conditions.isMobile;
        var isTablet  = context.conditions.isTablet;

        var scale = isMobile ? 0.75 : (isTablet ? 0.88 : 1);

        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: sticky.parentElement,
            start: "top top",
            end: function(){return "+=" + (sticky.parentElement.offsetHeight - sticky.offsetHeight);},
            scrub: HP_CONFIG.scrub,
            pin: false,
            invalidateOnRefresh: true
          },
          defaults: { ease: "none" }
        });

        tl.to(sky, {
          yPercent: HP_CONFIG.sky.driftYPercent * scale,
          duration: 1
        }, 0);

        tl.to(bgClouds, {
          yPercent: -HP_CONFIG.bgClouds.driftYPercent * scale,
          xPercent: HP_CONFIG.bgClouds.driftXPercent * scale,
          duration: 1
        }, 0);

        tl.to(house, {
          yPercent: HP_CONFIG.house.travelPercent * scale,
          scale: HP_CONFIG.house.endScale,
          duration: 1,
          ease: "power1.in"
        }, 0);

        var cloudStart = HP_CONFIG.fgClouds.startPercent;
        var cloudEnd = HP_CONFIG.fgClouds.startPercent - (HP_CONFIG.fgClouds.travelPercent * scale);

        tl.to(fgClouds, {
          yPercent: cloudEnd,
          scale: isMobile ? 1 : HP_CONFIG.fgClouds.endScale,
          duration: 1,
          ease: "power1.out"
        }, 0);

        if (mobileGround && isMobile) {
          tl.to(mobileGround, {
            y: function(){
              var heroHeight = sticky.getBoundingClientRect().height;
              var cloudMovement = cloudEnd - cloudStart;
              return heroHeight * cloudMovement / 100;
            },
            duration: 1,
            ease: "power1.out",
            immediateRender: false
          }, 0);
        }

        if (cloudWipe) {
          var wipeStart = 0.76;
          var wipeDuration = 0.24;

          tl.to(cloudWipe, {
            yPercent: 0,
            duration: wipeDuration,
            ease: "power2.in"
          }, wipeStart);
        }

        return function(){
          tl.scrollTrigger && tl.scrollTrigger.kill();
          tl.kill();
        };
      }
    );
    }

    var statsSticky = root.querySelector('[data-hp-stats-sticky]');
    if (statsSticky) {
      var panels = Array.prototype.slice.call(root.querySelectorAll('[data-stat-panel]'));

      var setActivePanel = function(index){
        panels.forEach(function(p, i){
          p.classList.toggle('is-active', i === index);
        });
      };

      setActivePanel(0);

      ScrollTrigger.create({
        trigger: statsSticky,
        start: "top top",
        end: "+=" + STATS_CONFIG.scrollDistanceVH + "%",
        pin: true,
        invalidateOnRefresh: true,
        
        onUpdate: function(self){
          var idx = Math.round(self.progress * (panels.length - 1));
          idx = Math.max(0, Math.min(panels.length - 1, idx));
          setActivePanel(idx);
        }
      });
    }

    var videoSticky = root.querySelector('[data-hp-video-sticky]');
    if (videoSticky) {
      var videoFrame = root.querySelector('[data-hp-video-frame]');
      gsap.set(videoFrame, { scale: 0.32, borderRadius: "28px" });
      gsap.to(videoFrame, {
        scale: 1,
        borderRadius: "0px",
        ease: "none",
        scrollTrigger: {
          trigger: videoSticky,
          start: "top top",
          end: "+=150%",
          scrub: true,
          pin: true,
          invalidateOnRefresh: true
        }
      });
    }

    // Real slider/carousel: swipe, drag, arrows and dots — no scroll-jacking.
    var featured = root.querySelector('[data-hp-featured-properties]');
    if (featured) {
      var fTrackEl = featured.querySelector('[data-featured-track]');
      var fViewport = featured.querySelector('.hp-featured-viewport');
      var fCards = Array.from(featured.querySelectorAll('.hp-featured-property'));
      var fDots = Array.from(featured.querySelectorAll('[data-featured-dot]'));
      var fCount = featured.querySelector('.hp-featured-count .current');
      var fPrev = featured.querySelector('[data-featured-prev]');
      var fNext = featured.querySelector('[data-featured-next]');
      var fLen = fCards.length;
      var fIndex = 0;

      function fGoTo(index){
        fIndex = ((index % fLen) + fLen) % fLen;
        if (fTrackEl) fTrackEl.style.transform = 'translate3d(-' + (fIndex * 100) + '%,0,0)';
        fDots.forEach(function(dot,i){dot.classList.toggle('active', i === fIndex);});
        if (fCount) fCount.textContent = String(fIndex + 1).padStart(2,'0');
        fCards.forEach(function(card,i){card.inert = i !== fIndex;});
      }

      if (fPrev) fPrev.addEventListener('click', function(){fGoTo(fIndex - 1);});
      if (fNext) fNext.addEventListener('click', function(){fGoTo(fIndex + 1);});
      fDots.forEach(function(dot,i){dot.addEventListener('click', function(){fGoTo(i);});});

      var fDragging = false, fStartX = 0, fDelta = 0;
      function fPointerX(e){ return e.touches && e.touches.length ? e.touches[0].clientX : e.clientX; }
      function fDragStart(e){
        fDragging = true;
        fStartX = fPointerX(e);
        fDelta = 0;
        if (fTrackEl) fTrackEl.style.transition = 'none';
      }
      function fDragMove(e){
        if (!fDragging) return;
        fDelta = fPointerX(e) - fStartX;
        if (fTrackEl) fTrackEl.style.transform = 'translate3d(calc(-' + (fIndex * 100) + '% + ' + fDelta + 'px),0,0)';
      }
      function fDragEnd(){
        if (!fDragging) return;
        fDragging = false;
        if (fTrackEl) fTrackEl.style.transition = '';
        var threshold = Math.max(50, (fViewport ? fViewport.offsetWidth : 320) * 0.12);
        if (fDelta < -threshold) fGoTo(fIndex + 1);
        else if (fDelta > threshold) fGoTo(fIndex - 1);
        else fGoTo(fIndex);
      }
      if (fViewport) {
        fViewport.addEventListener('touchstart', fDragStart, {passive:true});
        fViewport.addEventListener('touchmove', fDragMove, {passive:true});
        fViewport.addEventListener('touchend', fDragEnd);
        fViewport.addEventListener('mousedown', fDragStart);
        window.addEventListener('mousemove', fDragMove);
        window.addEventListener('mouseup', fDragEnd);
      }

      featured.addEventListener('keydown', function(e){
        if (e.key === 'ArrowRight') fGoTo(fIndex + 1);
        if (e.key === 'ArrowLeft') fGoTo(fIndex - 1);
      });

      fGoTo(0);
    }

    var processRoot = root.querySelector('[data-hp-process-stack-final]');
    if (processRoot && processRoot.getAttribute('data-hp-gsap-stack') !== 'true') {
      processRoot.setAttribute('data-hp-gsap-stack', 'true');
      var processTrack = processRoot.querySelector('.hp-process-stack-final-track');
      var processStage = processRoot.querySelector('.hp-process-stack-final-stage');
      var processCards = Array.prototype.slice.call(processRoot.querySelectorAll('.hp-process-stack-final-card'));
      var processDots = Array.prototype.slice.call(processRoot.querySelectorAll('[data-dot]'));
      var processCounter = processRoot.querySelector('.hp-process-stack-final-counter .current');

      if (processTrack && processStage && processCards.length) {
        var activeProcessCard = -1;
        var setProcessCard = function(progress){
          var index = Math.round(progress * (processCards.length - 1));
          index = Math.max(0, Math.min(processCards.length - 1, index));
          if (index === activeProcessCard) return;
          activeProcessCard = index;
          processDots.forEach(function(dot, i){ dot.classList.toggle('active', i === index); });
          processCards.forEach(function(card, i){ card.classList.toggle('is-glass-active', i === index); });
          if (processCounter) processCounter.textContent = String(index).padStart(2, '0');
        };

        gsap.set(processCards, { yPercent: 100, force3D: true });
        gsap.set(processCards[0], { yPercent: 0 });
        setProcessCard(0);

        var processTimeline = gsap.timeline({ defaults: { ease: 'none' } });
        processCards.slice(1).forEach(function(card, index){
          processTimeline.to(card, { yPercent: 0, duration: 1, force3D: true }, index);
        });
        processTimeline.scrollTrigger = ScrollTrigger.create({
          animation: processTimeline,
          trigger: processTrack,
          start: 'top top',
          end: function(){ return '+=' + Math.max(1, processTrack.offsetHeight - processStage.offsetHeight); },
          scrub: 0.55,
          pin: processStage,
          pinSpacing: false,
          pinReparent: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function(self){ setProcessCard(self.progress); }
        });
      }
    }

    var storyRoot = root.querySelector('[data-rx-simple-story]');
    if (storyRoot && storyRoot.getAttribute('data-hp-gsap-story') !== 'true') {
      storyRoot.setAttribute('data-hp-gsap-story', 'true');
      var storyTrack = storyRoot.querySelector('.rx-simple-story-track');
      var storyStage = storyRoot.querySelector('.rx-simple-story-stage');
      var storyScenes = Array.prototype.slice.call(storyRoot.querySelectorAll('[data-scene]'));
      var storyIndex = Array.prototype.slice.call(storyRoot.querySelectorAll('.rx-simple-index span'));
      var activeStoryScene = -1;
      var setStoryScene = function(progress){
        var index = Math.round(progress * (storyScenes.length - 1));
        index = Math.max(0, Math.min(storyScenes.length - 1, index));
        if (index === activeStoryScene) return;
        activeStoryScene = index;
        storyScenes.forEach(function(scene, i){ scene.classList.toggle('active', i === index); });
        storyIndex.forEach(function(item, i){ item.classList.toggle('active', i === index); });
      };
      if (storyTrack && storyStage && storyScenes.length) {
        setStoryScene(0);
        ScrollTrigger.create({
          trigger: storyTrack,
          start: 'top top',
          end: function(){ return '+=' + Math.max(1, storyTrack.offsetHeight - storyStage.offsetHeight); },
          scrub: 0.45,
          pin: storyStage,
          pinSpacing: false,
          pinReparent: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function(self){ setStoryScene(self.progress); }
        });
      }
    }

    var servicesBgImg = root.querySelector('[data-hp-services-bg] .hp-services-bg-img');
    if (servicesBgImg) {
      gsap.to(servicesBgImg, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: servicesBgImg.closest('.hp-services'),
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    }

    var why = root.querySelector('[data-hp-why]');
    if (why) {
      var revealWhy = function(){
        why.querySelectorAll('[data-why-word]').forEach(function(word){word.classList.add('visible');});
        why.querySelectorAll('[data-why-reason]').forEach(function(reason){reason.classList.add('active');});
      };
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) revealWhy();
      else ScrollTrigger.create({trigger:why,start:'top 75%',once:true,onEnter:revealWhy});
    }

    var resizeTimeout;
    var lastViewportWidth = window.innerWidth;
    window.addEventListener('resize', function(){
      
      if (window.innerWidth === lastViewportWidth) return;
      lastViewportWidth = window.innerWidth;
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function(){
        ScrollTrigger.refresh(true);
        if (window.__heroParallaxLenis) window.__heroParallaxLenis.resize();
      }, 200);
    });

    if (typeof ResizeObserver !== 'undefined') {
      var roTimeout;
      var observedWidth = root.clientWidth;
      var observedHeight = root.clientHeight;
      var ro = new ResizeObserver(function(){
        
        var width = root.clientWidth;
        var height = root.clientHeight;
        if (width === observedWidth) return;
        observedWidth = width;
        observedHeight = height;
        clearTimeout(roTimeout);
        roTimeout = setTimeout(function(){
          ScrollTrigger.refresh(true);
          if (window.__heroParallaxLenis) window.__heroParallaxLenis.resize();
        }, 200);
      });
      ro.observe(root);
    }
  }

  function initExtraSections(root){
    if (!root || root.getAttribute('data-rp-initialized') === 'true') return;
    root.setAttribute('data-rp-initialized', 'true');

    var serviceItems = Array.prototype.slice.call(root.querySelectorAll('[data-service]'));
    serviceItems.forEach(function(service){
      service.addEventListener('mouseenter', function(){
        if (window.innerWidth <= 700) return;
        serviceItems.forEach(function(other){ other.classList.remove('is-hovered'); });
        service.classList.add('is-hovered');
      });
      service.addEventListener('click', function(){
        if (window.innerWidth > 700) return;
        var wasOpen = service.classList.contains('is-hovered');
        serviceItems.forEach(function(other){ other.classList.remove('is-hovered'); });
        if (!wasOpen) service.classList.add('is-hovered');
      });
    });

    var testimonials = root.querySelector('.hp-testimonials');
    if (testimonials) {
      var setTestimonialsVisibility = function(visible){
        testimonials.classList.toggle('hp-is-visible', visible);
      };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function(entries){
          setTestimonialsVisibility(entries[0].isIntersecting);
        }, { rootMargin: '180px 0px' }).observe(testimonials);
      } else {
        setTestimonialsVisibility(true);
      }
    }

    var newsTrack = root.querySelector('[data-news-track]');
    if (newsTrack) {
      var newsCards = Array.prototype.slice.call(newsTrack.querySelectorAll('.hp-news-card'));
      var newsPrev = root.querySelector('[data-news-prev]');
      var newsNext = root.querySelector('[data-news-next]');
      var newsDots = Array.prototype.slice.call(root.querySelectorAll('[data-news-dot]'));
      var newsRaf = null;

      var newsActiveIndex = function(){
        var scrollLeft = newsTrack.scrollLeft;
        var closest = 0;
        var closestDiff = Infinity;
        newsCards.forEach(function(card, index){
          var diff = Math.abs(card.offsetLeft - newsTrack.offsetLeft - scrollLeft);
          if (diff < closestDiff) { closestDiff = diff; closest = index; }
        });
        return closest;
      };

      var newsSyncUI = function(){
        newsRaf = null;
        var index = newsActiveIndex();
        newsDots.forEach(function(dot, i){ dot.classList.toggle('active', i === index); });
        if (newsPrev) newsPrev.disabled = index <= 0;
        if (newsNext) newsNext.disabled = index >= newsCards.length - 1;
      };

      var newsGoTo = function(index){
        index = Math.max(0, Math.min(newsCards.length - 1, index));
        var card = newsCards[index];
        if (!card) return;
        newsTrack.scrollTo({ left: card.offsetLeft - newsTrack.offsetLeft, behavior: 'smooth' });
      };

      if (newsPrev) newsPrev.addEventListener('click', function(){ newsGoTo(newsActiveIndex() - 1); });
      if (newsNext) newsNext.addEventListener('click', function(){ newsGoTo(newsActiveIndex() + 1); });
      newsDots.forEach(function(dot, i){ dot.addEventListener('click', function(){ newsGoTo(i); }); });

      newsTrack.addEventListener('scroll', function(){
        if (newsRaf !== null) return;
        newsRaf = requestAnimationFrame(newsSyncUI);
      }, { passive: true });

      newsSyncUI();
    }

    var footerCanvas = root.querySelector('[data-hp-footer-canvas]');
    if (footerCanvas) {
      var wrap = footerCanvas.closest('.hp-footer');
      var fReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var glowColor = [0.14, 0.42, 0.78]; // azul do site (~#2569c7), mais vivo que o resto da paleta para se destacar no escuro

      var gl = footerCanvas.getContext('webgl') || footerCanvas.getContext('experimental-webgl');

      if (!gl) {
        initFooterCanvas2DFallback();
      } else {
        var vertexSrc = [
          'attribute vec2 aPos;',
          'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
        ].join('\n');

        var fragmentSrc = [
          'precision highp float;',
          'uniform vec2 uResolution;',
          'uniform float uTime;',
          'uniform vec3 uGlowColor;',
          'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }',
          'float noise(vec2 p){',
          '  vec2 i = floor(p); vec2 f = fract(p);',
          '  float a = hash(i);',
          '  float b = hash(i + vec2(1.0, 0.0));',
          '  float c = hash(i + vec2(0.0, 1.0));',
          '  float d = hash(i + vec2(1.0, 1.0));',
          '  vec2 u = f * f * (3.0 - 2.0 * f);',
          '  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;',
          '}',
          'float fbm(vec2 p){',
          '  float v = 0.0; float amp = 0.55;',
          '  for (int i = 0; i < 5; i++) {',
          '    v += amp * noise(p);',
          '    p *= 2.02;',
          '    amp *= 0.55;',
          '  }',
          '  return v;',
          '}',
          'void main(){',
          '  vec2 uv = gl_FragCoord.xy / uResolution.xy;',
          '  vec2 p = uv * 2.0 - 1.0;',
          '  p.x *= uResolution.x / uResolution.y;',
          '  vec2 center = vec2(sin(uTime * 0.045) * 0.4, -0.55 + cos(uTime * 0.03) * 0.12);',
          '  float dist = length(p - center);',
          '  float n = fbm(p * 1.5 + uTime * 0.06);',
          '  dist += (n - 0.5) * 0.4;',
          '  float glow = smoothstep(1.3, 0.0, dist);',
          '  glow = pow(clamp(glow, 0.0, 1.0), 1.6);',
          '  vec3 baseColor = vec3(0.0, 0.0, 0.0);',
          '  vec3 col = mix(baseColor, uGlowColor, glow);',
          '  float grain = (hash(uv * uResolution.xy * 0.5 + uTime) - 0.5) * 0.02;',
          '  col += grain;',
          '  gl_FragColor = vec4(col, glow);',
          '}'
        ].join('\n');

        var compile = function(type, src){
          var shader = gl.createShader(type);
          gl.shaderSource(shader, src);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { return null; }
          return shader;
        };

        var vShader = compile(gl.VERTEX_SHADER, vertexSrc);
        var fShader = compile(gl.FRAGMENT_SHADER, fragmentSrc);
        var program = (vShader && fShader) ? gl.createProgram() : null;

        if (!program) {
          initFooterCanvas2DFallback();
        } else {
          gl.attachShader(program, vShader);
          gl.attachShader(program, fShader);
          gl.linkProgram(program);

          if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            initFooterCanvas2DFallback();
          } else {
            gl.useProgram(program);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            var quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

            var aPos = gl.getAttribLocation(program, 'aPos');
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            var uResolution = gl.getUniformLocation(program, 'uResolution');
            var uTime = gl.getUniformLocation(program, 'uTime');
            var uGlowColor = gl.getUniformLocation(program, 'uGlowColor');
            gl.uniform3f(uGlowColor, glowColor[0], glowColor[1], glowColor[2]);

            var fDpr = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 900 ? 1 : 2);

            var resizeFooterGl = function(){
              var w = wrap.clientWidth, h = wrap.clientHeight;
              footerCanvas.width = Math.max(1, Math.floor(w * fDpr));
              footerCanvas.height = Math.max(1, Math.floor(h * fDpr));
              gl.viewport(0, 0, footerCanvas.width, footerCanvas.height);
            };
            resizeFooterGl();
            window.addEventListener('resize', resizeFooterGl);
            if (window.ResizeObserver) new ResizeObserver(resizeFooterGl).observe(wrap);

            var fStart = performance.now();
            var footerInView = true;
            var footerFrame = null;
            var renderFooterGl = function(){
              footerFrame = null;
              var t = (performance.now() - fStart) / 1000;
              gl.uniform2f(uResolution, footerCanvas.width, footerCanvas.height);
              gl.uniform1f(uTime, t);
              gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
              if (!fReduce && footerInView) footerFrame = requestAnimationFrame(renderFooterGl);
            };
            if ('IntersectionObserver' in window) {
              footerInView = false;
              new IntersectionObserver(function(entries){
                footerInView = entries[0].isIntersecting;
                if (footerInView && !footerFrame && !fReduce) {
                  footerFrame = requestAnimationFrame(renderFooterGl);
                }
              }, { rootMargin: '160px 0px' }).observe(wrap);
            }
            renderFooterGl();
          }
        }
      }

      function initFooterCanvas2DFallback(){
        var ctx = footerCanvas.getContext('2d');
        if (!ctx) return;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var resize = function(){
          footerCanvas.width = Math.max(1, Math.floor(wrap.clientWidth * dpr));
          footerCanvas.height = Math.max(1, Math.floor(wrap.clientHeight * dpr));
        };
        resize();
        window.addEventListener('resize', resize);
        if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);
        var start = performance.now();
        var canvasInView = true;
        var canvasFrame = null;
        var draw = function(){
          canvasFrame = null;
          var w = footerCanvas.width, h = footerCanvas.height;
          var t = (performance.now() - start) / 1000;
          var cx = w * (0.5 + Math.sin(t * 0.045) * 0.2);
          var cy = h * (1.05 + Math.cos(t * 0.03) * 0.05);
          var r = Math.max(w, h) * 0.75;
          ctx.clearRect(0, 0, w, h);
          var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, 'rgba(36,107,199,0.55)');
          grad.addColorStop(0.5, 'rgba(36,107,199,0.22)');
          grad.addColorStop(1, 'rgba(10,14,18,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          if (!fReduce && canvasInView) canvasFrame = requestAnimationFrame(draw);
        };
        if ('IntersectionObserver' in window) {
          canvasInView = false;
          new IntersectionObserver(function(entries){
            canvasInView = entries[0].isIntersecting;
            if (canvasInView && !canvasFrame && !fReduce) {
              canvasFrame = requestAnimationFrame(draw);
            }
          }, { rootMargin: '160px 0px' }).observe(wrap);
        }
        draw();
      }
    }
  }

  function boot(){
    var roots = document.querySelectorAll('.hero-parallax');
    if (!roots.length) return;

    ensureLibraries().then(function(){
      if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.warn('[hero-parallax] GSAP ou ScrollTrigger não carregaram corretamente.');
        return;
      }
      roots.forEach(function(root){
        initHeroParallax(root);
        initExtraSections(root);
      });

      var refreshScrollTrigger = function(){
        ScrollTrigger.refresh(true);
        if (window.__heroParallaxLenis) window.__heroParallaxLenis.resize();
      };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refreshScrollTrigger);
      }
      window.addEventListener('load', refreshScrollTrigger, { once: true });
      
      var refreshQueued = false;
      Array.prototype.forEach.call(document.images, function(image){
        if (image.complete) return;
        image.addEventListener('load', function(){
          if (refreshQueued) return;
          refreshQueued = true;
          setTimeout(function(){
            refreshQueued = false;
            refreshScrollTrigger();
          }, 120);
        }, { once: true });
      });
      setTimeout(refreshScrollTrigger, 600);
    }).catch(function(err){
      console.warn('[hero-parallax] Falha ao carregar bibliotecas externas:', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('load', function(){
    var roots = document.querySelectorAll('.hero-parallax:not([data-hp-initialized="true"])');
    if (roots.length) boot();
  });

})();

(function(){
  "use strict";

  function initNav(){
    var nav = document.querySelector('[data-hp-nav]');
    if (!nav) return;
    if (nav.getAttribute('data-nav-ready') === 'true') return;
    nav.setAttribute('data-nav-ready', 'true');

    if (nav.parentElement !== document.body) {
      document.body.appendChild(nav);
    }

    var burger = nav.querySelector('[data-hp-nav-burger]');
    var menu = nav.querySelector('[data-hp-nav-menu]');
    
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-hp-nav-link], [data-hp-footer-link]'));

    if (!burger || !menu) return;

    var pill = nav.querySelector('.hp-nav-pill');
    var lastY = Math.max(0, window.scrollY), direction = 0, distance = 0, navFrame = 0;
    function updateHeader(){
      navFrame = 0;
      var y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
      var delta = y - lastY; lastY = y;
      if (y < 70 || menu.classList.contains('is-open')) { nav.classList.remove('hp-nav-hidden'); return; }
      var next = Math.sign(delta);
      if (next !== direction) { direction = next; distance = 0; }
      distance += Math.abs(delta);
      if (distance > (direction > 0 ? 14 : 6)) nav.classList.toggle('hp-nav-hidden', direction > 0);
    }
    window.addEventListener('scroll', function(){if (!navFrame) navFrame = requestAnimationFrame(updateHeader);}, {passive:true});
    nav.addEventListener('focusin', function(){nav.classList.remove('hp-nav-hidden');});
    menu.inert = true;
    function openMenu(){
      nav.classList.remove('hp-nav-hidden');
      menu.inert = false;
      burger.setAttribute('aria-label','Fechar menu');
      requestAnimationFrame(function(){menu.querySelector('a').focus({preventScroll:true});});
      menu.classList.add('is-open');
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('hp-nav-locked');
      if (window.__heroParallaxLenis) window.__heroParallaxLenis.stop();
    }

    function closeMenu(){
      menu.inert = true;
      burger.setAttribute("aria-label","Abrir menu");
      menu.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('hp-nav-locked');
      if (window.__heroParallaxLenis) window.__heroParallaxLenis.start();
    }

    burger.addEventListener('click', function(){
      if (menu.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        burger.focus({preventScroll:true});
      }
      if (e.key === 'Tab' && menu.classList.contains('is-open')) {
        var focusables = [burger].concat(Array.from(menu.querySelectorAll('a')));
        var index = focusables.indexOf(document.activeElement);
        e.preventDefault();
        focusables[(index + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length].focus();
      }
    });

    document.addEventListener('click', function(e){
      var link = e.target.closest('[data-hp-nav-link], [data-hp-footer-link]');
      if (!link) return;

      var href = link.getAttribute('href') || '';
      if (href.charAt(0) !== '#' || href.length < 2) return;

      var target = document.getElementById(href.slice(1));
      if (!target) return;

      e.preventDefault();
      closeMenu();
      if (href === '#vender') {
        document.querySelectorAll('#heroParallax1 [data-service]').forEach(function(item){item.classList.remove('is-hovered');});
        target.classList.add('is-hovered');
      }

      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          var offset = Math.min(110, Math.max(70, window.innerHeight * 0.1));
          var destination = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
          var lenis = window.__heroParallaxLenis;
          if (lenis) {
            lenis.scrollTo(destination, { duration: 1.15, immediate: false, force: true });
          } else {
            window.scrollTo({ top: destination, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
          }
        });
      });
    });

    window.addEventListener('resize', function(){
      if (window.innerWidth > 900 && menu.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav, { once: true });
  } else {
    initNav();
  }

  window.addEventListener('load', initNav);

  if (window.jQuery) {
    window.jQuery(window).on('elementor/frontend/init', function(){
      setTimeout(initNav, 100);
    });
  }
})();

(function(){
  function initReveal(){
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function(el){ el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function(el){ io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal, { once: true });
  } else {
    initReveal();
  }
})();
