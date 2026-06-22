
(function() {
  'use strict';

  const ThemeManager = {
    currentTheme: 'theme-dark',
    init() {
      const saved = localStorage.getItem('theme');
      if (saved) { this.currentTheme = saved; this.apply(saved); }
      else { this.apply('theme-dark'); }
      this.bindEvents();
    },
    apply(theme) {
      document.body.classList.remove('theme-dark', 'theme-light', 'theme-neural', 'theme-aurora');
      document.body.classList.add(theme);
      this.currentTheme = theme;
      localStorage.setItem('theme', theme);
      document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === theme);
      });
      const btn = document.querySelector('.theme-btn i');
      if (btn) {
        const iconMap = { 'theme-dark': 'fa-moon', 'theme-light': 'fa-sun', 'theme-neural': 'fa-brain', 'theme-aurora': 'fa-aurora' };
        btn.className = `fas ${iconMap[theme] || 'fa-moon'}`;
      }
    },
    bindEvents() {
      const toggleBtn = document.querySelector('.theme-btn');
      const dropdown = document.querySelector('.theme-dropdown');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdown?.classList.toggle('active'); });
      }
      document.querySelectorAll('.theme-option').forEach(opt => {
        opt.addEventListener('click', () => { this.apply(opt.dataset.theme); dropdown?.classList.remove('active'); });
      });
      document.addEventListener('click', () => { dropdown?.classList.remove('active'); });
    }
  };

  const MobileMenu = {
    init() {
      const btn = document.querySelector('.mobile-menu-btn');
      const nav = document.querySelector('.nav-links');
      if (btn && nav) {
        btn.addEventListener('click', () => {
          nav.classList.toggle('active');
          const icon = btn.querySelector('i');
          if (icon) { icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-xmark'); }
        });
        nav.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
            nav.classList.remove('active');
            const icon = btn.querySelector('i');
            if (icon) { icon.classList.add('fa-bars'); icon.classList.remove('fa-xmark'); }
          });
        });
      }
    }
  };

  const ScrollAnimations = {
    init() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }
  };

  // ENHANCED NETWORK CANVAS - More visible, shinier neurons
  const NetworkCanvas = {
    canvas: null, ctx: null, nodes: [], links: [], animationId: null,
    init() {
      this.canvas = document.getElementById('networkCanvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      this.createNodes();
      this.animate();
      window.addEventListener('resize', () => { this.resize(); this.createNodes(); });
    },
    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },
    createNodes() {
      const count = Math.min(100, Math.floor(window.innerWidth / 12));
      this.nodes = [];
      for (let i = 0; i < count; i++) {
        this.nodes.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: Math.random() * 2.5 + 1.5,
          opacity: Math.random() * 0.4 + 0.4,
          pulse: Math.random() * Math.PI * 2
        });
      }
    },
    getColors() {
      const body = document.body;
      let lineColor, nodeColor;
      const style = getComputedStyle(body);
      const lineVar = style.getPropertyValue('--network-line').trim();
      const nodeVar = style.getPropertyValue('--network-node').trim();
      if (lineVar) lineColor = lineVar;
      else lineColor = '255, 215, 0';
      if (nodeVar) nodeColor = nodeVar;
      else nodeColor = '255, 215, 0';
      return { lineColor, nodeColor };
    },
    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const { lineColor, nodeColor } = this.getColors();
      const time = Date.now() * 0.001;

      // Draw connections first (behind nodes)
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const dx = this.nodes[i].x - this.nodes[j].x;
          const dy = this.nodes[i].y - this.nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const opacity = (1 - dist / 180) * 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
            this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
            this.ctx.strokeStyle = `rgba(${lineColor}, ${opacity})`;
            this.ctx.lineWidth = 1.2;
            this.ctx.stroke();
          }
        }
      }

      // Draw nodes with glow
      this.nodes.forEach((node, idx) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;

        // Glow
        const glowRadius = node.radius * 4;
        const glow = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
        const pulseOpacity = node.opacity + Math.sin(time * 2 + node.pulse) * 0.15;
        glow.addColorStop(0, `rgba(${nodeColor}, ${pulseOpacity * 0.6})`);
        glow.addColorStop(0.5, `rgba(${nodeColor}, ${pulseOpacity * 0.2})`);
        glow.addColorStop(1, `rgba(${nodeColor}, 0)`);
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = glow;
        this.ctx.fill();

        // Core
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${nodeColor}, ${pulseOpacity})`;
        this.ctx.fill();
      });

      this.animationId = requestAnimationFrame(() => this.animate());
    }
  };

  const NavbarScroll = {
    init() {
      const nav = document.querySelector('.glass-nav');
      if (!nav) return;
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          nav.style.padding = '0.75rem 2rem';
          nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
        } else {
          nav.style.padding = '1rem 2rem';
          nav.style.boxShadow = 'none';
        }
      });
    }
  };

  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  };

  const CounterAnimation = {
    init() {
      const counters = document.querySelectorAll('.counter');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.target);
            const duration = parseInt(entry.target.dataset.duration) || 2000;
            this.animate(entry.target, target, duration);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(c => observer.observe(c));
    },
    animate(el, target, duration) {
      const start = performance.now();
      const animate = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(easeOut * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(animate);
        else el.textContent = target.toLocaleString();
      };
      requestAnimationFrame(animate);
    }
  };

  const DownloadEffect = {
    init() {
      document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', function(e) {
          const ripple = document.createElement('span');
          ripple.style.cssText = `position: absolute; border-radius: 50%; background: rgba(255,255,255,0.3); transform: scale(0); animation: rippleEffect 0.6s ease-out; pointer-events: none;`;
          const rect = this.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          ripple.style.width = ripple.style.height = size + 'px';
          ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
          ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
          this.style.position = 'relative';
          this.style.overflow = 'hidden';
          this.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        });
      });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    MobileMenu.init();
    ScrollAnimations.init();
    NetworkCanvas.init();
    NavbarScroll.init();
    SmoothScroll.init();
    CounterAnimation.init();
    DownloadEffect.init();
  });

  const style = document.createElement('style');
  style.textContent = `@keyframes rippleEffect { to { transform: scale(4); opacity: 0; } }`;
  document.head.appendChild(style);
})();
