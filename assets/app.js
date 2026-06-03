/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PMG Embedded â€” single-page app
   Data is loaded from data/config.yaml, data/projects.yaml, data/team.yaml
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const state = { projects: [], team: [], config: {}, services: [], loadError: null };

// â”€â”€ Data loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function loadYaml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
  return jsyaml.load(await res.text());
}

async function loadData() {
  try {
    const [projects, team, config, services] = await Promise.all([
      loadYaml('data/projects.yaml'),
      loadYaml('data/team.yaml'),
      loadYaml('data/config.yaml'),
      loadYaml('data/services.yaml'),
    ]);
    state.projects     = projects || [];
    state.config       = config   || {};
    state.services     = services || [];
    state.about        = (team && team.about)   || {};
    state.clients      = (team && team.clients) || [];
    state.teamMembers  = (team && team.members) || [];
    state.team         = state.teamMembers;
  } catch (err) {
    console.error('Failed to load site data:', err);
    state.loadError = err.message;
  }
}

// â”€â”€ Router â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function triggerFade() {
  const app = document.getElementById('app');
  app.classList.remove('page-enter');
  void app.offsetWidth;
  app.classList.add('page-enter');
}

function router() {
  document.getElementById('project-slideshow')?._removeKeyHandler?.();
  document.getElementById('lightbox')?._removeLbHandler?.();
  document.body.style.overflow = '';

  const hash = window.location.hash;

  // Project detail
  const projectMatch = hash.match(/^#project\/(.+)/);
  if (projectMatch) {
    const project = state.projects.find(p => p.id === projectMatch[1]);
    if (project) {
      triggerFade();
      window.scrollTo({ top: 0, behavior: 'instant' });
      renderProject(project);
      return;
    }
  }

  // All projects page
  if (hash === '#all-projects') {
    triggerFade();
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderProjectsList();
    return;
  }

  // Service detail
  const serviceMatch = hash.match(/^#service\/(.+)/);
  if (serviceMatch) {
    const service = state.services.find(s => s.id === serviceMatch[1]);
    if (service) {
      triggerFade();
      window.scrollTo({ top: 0, behavior: 'instant' });
      renderService(service);
      return;
    }
  }

  // Home page
  const onHome = !!document.getElementById('home');
  const sectionId = hash.replace(/^#/, '');

  if (onHome) {
    // Already on home â€” just scroll, no re-render, no fade
    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    return;
  }

  // Navigating to home from another page
  triggerFade();
  window.scrollTo({ top: 0, behavior: 'instant' });
  renderHome();
  if (sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'instant' });
  }
}

// â”€â”€ Home page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function renderHome() {
  document.getElementById('app').innerHTML =
    heroHTML() + servicesHTML() + projectsHTML() + aboutHTML() + partnersHTML() + contactHTML();

  initProjectCards();
  initSlideshow();
  initContactForm();
  initScrollReveal();
  initActiveNav();
  initProjectsCarousel();
  initServiceCards();
  initAboutReadMore();
}

// â”€â”€ All-projects page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function renderProjectsList() {
  const visible = state.projects.filter(p => !p.hidden);

  document.getElementById('app').innerHTML = `
  <div class="projects-list-page">
    <div class="container">
      <a href="#" class="back-link" id="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to home
      </a>
      <div class="section-header">
        <h2>All Projects</h2>
        <p class="section-sub">Our full portfolio of hardware engineering work</p>
      </div>
      <div class="projects-grid">
        ${visible.map((p, i) => projectCardHTML(p, i)).join('')}
      </div>
    </div>
  </div>`;

  document.getElementById('back-btn').addEventListener('click', e => {
    e.preventDefault();
    window.location.hash = '';
  });

  initProjectCards();
  initScrollReveal();
}

// â”€â”€ Service detail page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function renderService(s) {
  const allProjects = state.projects || [];
  const relevant = (s.projects || [])
    .map(id => allProjects.find(p => p.id === id))
    .filter(Boolean)
    .filter(p => !p.hidden);

  const subsHTML = (s.subs || []).map(sub => `
    <div class="sv-sub-card">
      <div class="sv-sub-icon"><i class="ti ${sub.icon}" aria-hidden="true"></i></div>
      <h4 class="sv-sub-title">${sub.title}</h4>
      <p class="sv-sub-desc">${sub.desc}</p>
      ${(sub.tags && sub.tags.length) ? `<div class="project-tags">${sub.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
    </div>`).join('');

  const relTotalPages = Math.ceil(relevant.length / 3);
  const relDots = relTotalPages > 1
    ? `<div class="carousel-dots" id="rel-carousel-dots">
        ${Array.from({ length: relTotalPages }, (_, i) =>
          `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-page="${i}" aria-label="Page ${i + 1}"></button>`
        ).join('')}
       </div>`
    : '<div></div>';
  const projectsHTML = relevant.length ? `
    <div class="sv-divider"></div>
    <div class="section-header-row">
      <div class="section-header" style="margin-bottom:0">
        <h2>Relevant projects</h2>
      </div>
      <a href="#all-projects" class="view-all-link">
        View all ${svgArrowRight(14)}
      </a>
    </div>
    <div id="rel-cards" class="projects-grid" style="margin-top:32px">
      ${relevant.slice(0, 3).map((p, i) => projectCardHTML(p, i)).join('')}
    </div>
    ${relTotalPages > 1 ? `
    <div class="carousel-controls">
      ${relDots}
      <div class="carousel-arrows">
        <button class="carousel-btn" id="rel-prev" aria-label="Previous projects" disabled>
          ${svgChevronLeft()}
        </button>
        <button class="carousel-btn" id="rel-next" aria-label="Next projects">
          ${svgChevronRight()}
        </button>
      </div>
    </div>` : ''}` : '';

  const svgIconMap = {
    'pcb-design':              svgChip(),
    'embedded-programming':    svgCode(),
    'mechanical-design':       svgGear(),
    'prototype-to-production': svgRocket(),
  };
  const otherServices = (state.services || []).filter(sv => sv.id !== s.id);
  const otherServicesHTML = otherServices.length ? `
    <div class="sv-divider"></div>
    <div class="section-header-row">
      <div class="section-header" style="margin-bottom:0">
        <h2>Other services</h2>
      </div>
    </div>
    <div class="services-grid sv-other-grid" style="margin-top:32px">
      ${otherServices.map((sv, i) => `
        <div class="service-card reveal reveal-d${i + 1}" data-id="${sv.id}" style="cursor:pointer">
          <div class="service-icon-wrap">
            <div class="service-icon">${svgIconMap[sv.id] || `<i class="ti ${sv.icon || ''}" aria-hidden="true"></i>`}</div>
          </div>
          <h3>${sv.title}</h3>
          <p>${sv.tagline || ''}</p>
          <span class="service-card-cta">Learn more ${svgArrowRight(12)}</span>
        </div>`).join('')}
    </div>` : '';

  document.getElementById('app').innerHTML = `
  <div class="service-page">
    <div class="container">
      <a href="#" class="back-link" id="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to home
      </a>

      <div class="sv-hero">
        <span class="sv-badge">Services</span>
        <h1 class="sv-title">${s.title}</h1>
        <p class="sv-desc">${s.description || ''}</p>
      </div>

      <div class="sv-divider"></div>

      <div class="sv-subs-grid">
        ${subsHTML}
      </div>

      ${otherServicesHTML}

      ${projectsHTML}

    </div>
  </div>
  ${contactHTML()}`;

  document.getElementById('back-btn').addEventListener('click', e => {
    e.preventDefault();
    window.location.hash = '';
  });

  initProjectCards();
  initServiceCards();
  initRelevantProjectsCarousel(relevant);
  initContactForm();
  initScrollReveal();
}

// â”€â”€ Home HTML builders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function heroHTML() {
  const c = state.config;
  const tagline = c.tagline || 'From concept to<br><em>production-ready</em><br>hardware.';
  const desc    = c.description || 'PCB design, embedded firmware, and mechanical engineering &mdash; full product bringup from prototype to production.';

  const slides = (state.projects || []).filter(p => !p.hidden && p.thumbnail && p.thumbnail.trim() && p.featured);

  const visual = slides.length
    ? `<div class="hero-visual-inner">
        <div class="hero-slideshow" id="hero-slideshow">
          <div class="hero-slideshow-badge">Featured Projects</div>
          ${slides.map((p, i) => `
            <div class="slideshow-slide${i === 0 ? ' active' : ''}" data-id="${p.id}" role="button" tabindex="0" aria-label="View ${p.title}">
              <img src="${p.thumbnail}" alt="${p.title}" class="slideshow-img" loading="lazy">
              <div class="slideshow-caption">
                <div class="slideshow-caption-text">
                  <span class="slideshow-title">${p.title}</span>
                </div>
              </div>
            </div>`).join('')}
          ${slides.length > 1 ? `
            <button class="hero-slide-btn hero-slide-prev" aria-label="Previous project">&#8249;</button>
            <button class="hero-slide-btn hero-slide-next" aria-label="Next project">&#8250;</button>
            <div class="slideshow-dots">
              ${slides.map((_, i) => `<button class="slideshow-dot${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('')}
            </div>` : ''}
        </div>
      </div>`
    : `<div class="pcb-grid"></div>`;

  return `
  <section class="hero" id="home">
    <div class="container">
      <div class="hero-content">
        <h1 class="hero-title">${tagline}</h1>
        <p class="hero-desc">${desc}</p>
        <div class="hero-actions">
          <a href="#contact" class="btn btn-primary">Get in touch</a>
          <a href="#projects-home" class="btn btn-ghost">See our work ↓</a>
        </div>
      </div>
      <div class="hero-visual">
        ${visual}
      </div>
    </div>
  </section>`;
}

function statsHTML() {
  const stats = [
    { number: '30+',  label: 'Projects delivered' },
    { number: '3+',   label: 'Engineering disciplines' },
    { number: '15+',  label: 'Countries served' },
    { number: '2020', label: 'Year founded' },
  ];
  return `
  <div class="stats-strip">
    <div class="container">
      <div class="stats-row">
        ${stats.map((s, i) => `
          <div class="stat-item reveal reveal-d${i + 1}">
            <div class="stat-number">${s.number}</div>
            <div class="stat-label">${s.label}</div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function aboutHTML() {
  const intro   = (state.about && state.about.intro) || '';
  const clients = state.clients || [];
  const members = state.teamMembers || [];

  const teamGrid = members.length ? `
    <div class="team-grid">
      ${members.map((m, i) => `
        <div class="team-member reveal reveal-d${(i % 4) + 1}">
          <div class="member-photo">
            ${m.linkedin
              ? `<a href="${m.linkedin}" class="member-photo-link" target="_blank" rel="noopener noreferrer" aria-label="${m.name} on LinkedIn">
                   ${m.photo ? `<img src="${m.photo}" alt="${m.name}" loading="lazy">` : `<div class="photo-placeholder">${(m.name || '?')[0]}</div>`}
                   <div class="member-photo-overlay">${svgLinkedIn()}</div>
                 </a>`
              : m.photo ? `<img src="${m.photo}" alt="${m.name}" loading="lazy">` : `<div class="photo-placeholder">${(m.name || '?')[0]}</div>`}
          </div>
          <div class="member-info">
            <h4>${m.name || ''}</h4>
            <p class="member-role">${m.role || ''}</p>
            ${m.email ? `<a href="mailto:${m.email}" class="member-link">${m.email}</a>` : ''}
          </div>
        </div>`).join('')}
    </div>` : '';

  return `
  <section class="about-section" id="about">
    <div class="container">
      <div class="section-header reveal">
        <h2>About</h2>
      </div>
      ${intro ? (() => {
        const sentences = intro.match(/[^.!?]+[.!?]+(\s|$)/g) || [intro];
        const visible = sentences.slice(0, 3).join('').trim();
        const rest    = sentences.slice(3).join('').trim();
        return `<p class="about-intro">
          ${visible}${rest ? `
          <span class="about-intro-rest"> ${rest}</span>
          <button class="about-read-more-btn" id="about-read-more">Read more</button>` : ''}
        </p>`;
      })() : ''}
      ${(state.about && state.about.stats && state.about.stats.length) ? `
      <div class="stats-row about-stats">
        ${state.about.stats.map(s => `
          <div class="stat-item">
            <div class="stat-number">${s.number}</div>
            <div class="stat-label">${s.label}</div>
          </div>`).join('')}
      </div>` : ''}
      <div class="about-divider"></div>
      <h3 class="about-sub-heading">Who we work with</h3>
      <div class="clients-grid">
        ${clients.map(c => `
          <div class="client-card">
            <h3 class="client-card-title">${c.title}</h3>
            <p class="client-card-desc">${c.desc}</p>
          </div>`).join('')}
      </div>
      <div class="about-divider"></div>
      <h3 class="about-sub-heading">Team</h3>
      ${teamGrid}
    </div>
  </section>`;
}

function servicesHTML() {
  const svgIcons = {
    'pcb-design':              svgChip(),
    'embedded-programming':    svgCode(),
    'mechanical-design':       svgGear(),
    'prototype-to-production': svgRocket(),
  };
  const hardcoded = [
    { id: 'pcb-design',              title: 'PCB Design',              desc: 'From schematic capture to production-ready Gerber files. Multi-layer boards, high-speed design, mixed-signal layouts. One of our engineers trained at CERN.' },
    { id: 'embedded-programming',    title: 'Firmware Development',              desc: 'Bare-metal and RTOS firmware. STM32, NXP, TI, Nordic. Drivers, communication protocols, power management, and OTA updates.' },
    { id: 'mechanical-design',       title: 'Mechatronics & Mechanical Design',  desc: 'Mechatronics engineering, 3D CAD modeling, enclosure design, and DFM for manufacturing. Our team built two complete robots that took first place at the international Eurobot 2019 competition.' },
    { id: 'prototype-to-production', title: 'Full Product Development',           desc: 'From first idea to production-ready hardware product. Full project management, manufacturer sourcing, and bring-up support.' },
  ];
  const source = (state.services && state.services.length) ? state.services : hardcoded;
  const services = source.map(s => ({
    id:   s.id,
    icon: svgIcons[s.id] || `<i class="ti ${s.icon || ''}" aria-hidden="true"></i>`,
    title: s.title,
    desc:  s.tagline || s.desc || '',
  }));

  return `
  <section class="services" id="services">
    <div class="container">
      <div class="section-header reveal">
        <h2>What we do</h2>
      </div>
      <div class="services-grid">
        ${services.map((s, i) => `
          <div class="service-card reveal reveal-d${i + 1}" data-id="${s.id}" style="cursor:pointer">
            <div class="service-icon-wrap">
              <div class="service-icon">${s.icon}</div>
            </div>
            <h3>${s.title}</h3>
            <p>${s.desc}</p>
            <span class="service-card-cta">Learn more ${svgArrowRight(12)}</span>
          </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function projectsHTML() {
  const visible = state.projects.filter(p => !p.hidden);
  if (!visible.length) {
    const notice = state.loadError
      ? `<p style="color:#ef4444;font-size:14px;padding:8px 0;line-height:1.7">
           Could not load projects.yaml.<br>
           If testing locally, start the HTTP server first:<br>
           <code style="background:#1e293b;padding:4px 8px;border-radius:4px;font-size:13px">python3 -m http.server 8000</code><br>
           Error: ${state.loadError}
         </p>`
      : `<p style="color:var(--text-dim);font-size:14px">No projects yet. Add them to data/projects.yaml</p>`;
    return `
      <section class="projects-section" id="projects-home">
        <div class="container">
          <div class="section-header"><h2>Projects</h2></div>
          ${notice}
        </div>
      </section>`;
  }

  const totalPages = Math.ceil(visible.length / 3);
  const firstThree = visible.slice(0, 3);

  const dots = totalPages > 1
    ? `<div class="carousel-dots" id="carousel-dots">
        ${Array.from({ length: totalPages }, (_, i) =>
          `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-page="${i}" aria-label="Page ${i + 1}"></button>`
        ).join('')}
       </div>`
    : '<div></div>';

  return `
  <section class="projects-section" id="projects-home">
    <div class="container">
      <div class="section-header-row">
        <div class="section-header reveal">
          <h2>Projects</h2>
          <p class="section-sub">A selection of work we can share publicly</p>
        </div>
        <a href="#all-projects" class="view-all-link">
          View all ${svgArrowRight(14)}
        </a>
      </div>
      <div id="projects-cards" class="projects-grid">
        ${firstThree.map((p, i) => projectCardHTML(p, i)).join('')}
      </div>
      ${totalPages > 1 ? `
      <div class="carousel-controls">
        ${dots}
        <div class="carousel-arrows">
          <button class="carousel-btn" id="carousel-prev" aria-label="Previous projects" disabled>
            ${svgChevronLeft()}
          </button>
          <button class="carousel-btn" id="carousel-next" aria-label="Next projects">
            ${svgChevronRight()}
          </button>
        </div>
      </div>` : ''}
    </div>
  </section>`;
}

function projectCardHTML(p, i) {
  const thumb = (p.thumbnail || '').trim();
  const bgStyle = thumb ? `background-image:url('${thumb}')` : '';
  const delay = `reveal-d${(i % 3) + 1}`;

  return `
  <div class="project-card reveal ${delay}" data-id="${p.id}" role="button" tabindex="0" aria-label="Open ${p.title}">
    <div class="project-thumb" style="${bgStyle}">
      ${!thumb ? `<span class="thumb-placeholder-letter">${(p.title || '?')[0].toUpperCase()}</span>` : ''}
      <div class="project-thumb-overlay"></div>
    </div>
    <div class="project-card-body">
      <h3 class="project-title">${p.title || ''}</h3>
      <p class="project-summary">${p.summary || ''}</p>
      <div class="project-tags">
        ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <span class="project-card-cta">View project ${svgArrowRight(12)}</span>
    </div>
  </div>`;
}

function partnersHTML() {
  const partners = (state.config.partners || []);
  if (!partners.length) return '';

  return `
  <section class="partners-section" id="partners">
    <div class="container">
      <div class="section-header reveal">
        <h2>Partners</h2>
      </div>
      <div class="partners-row">
        ${partners.map((p, i) => `
          <a href="${p.url}" class="partner-card reveal reveal-d${(i % 4) + 1}" target="_blank" rel="noopener noreferrer" aria-label="${p.name}">
            ${p.logo
              ? `<img src="${p.logo}" alt="${p.name}" class="partner-logo" loading="lazy">`
              : `<span class="partner-name-text">${p.name}</span>`}
          </a>`).join('')}
      </div>
    </div>
  </section>`;
}


function contactHTML() {
  const c     = state.config;
  const name  = c.name  || 'PMG Robotics';
  const email = c.email || '';
  const year  = new Date().getFullYear();

  const rightContent = c.form_endpoint
    ? `<h3>Work with us</h3>
       <p>Have a hardware project? Let's talk about it.</p>
       <div id="form-success" class="form-success">
         <strong>Message sent!</strong> We'll get back to you shortly.
       </div>
       <p id="form-error" class="form-error-global"></p>
       <form id="contact-form" class="contact-form" novalidate>
         <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
         <div class="form-row">
           <div class="form-field">
             <input type="text" name="name" id="field-name" placeholder="Your name" required class="form-input">
             <span class="form-field-error" id="err-name"></span>
           </div>
           <div class="form-field">
             <input type="email" name="email" id="field-email" placeholder="Your email" required class="form-input">
             <span class="form-field-error" id="err-email"></span>
           </div>
         </div>
         <div class="form-field">
           <textarea name="message" id="field-message" placeholder="Tell us about your project..." required class="form-input form-textarea"></textarea>
           <span class="form-field-error" id="err-message"></span>
         </div>
         <button type="submit" class="btn btn-primary" id="form-submit-btn" style="width:100%">Send message</button>
       </form>`
    : `<h3>Work with us</h3>
       <p>Have a hardware project? Let's talk about it.</p>
       ${email
         ? `<a href="mailto:${email}" class="btn btn-primary">${email}</a>`
         : `<p style="color:var(--text-dim);font-size:13px">(add your email to data/config.yaml)</p>`}`;

  return `
  <footer class="contact-section" id="contact">
    <div class="container">
      <div class="contact-grid">
        <div class="contact-left reveal">
          <h2>Let's build something.</h2>
          <p class="contact-tagline">${c.footer_desc || 'PCB design, embedded firmware, and mechanical engineering for hardware startups and established companies.'}</p>
          <div class="contact-meta">
            <span class="contact-meta-item">
              <i class="ti ti-map-pin"></i> Novi Sad, Serbia
            </span>
            ${email ? `<a href="mailto:${email}" class="contact-meta-item">
              <i class="ti ti-mail"></i> ${email}
            </a>` : ''}
          </div>
        </div>
        <div class="contact-right reveal reveal-d2">
          ${rightContent}
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${year} ${name} &middot; Novi Sad, Serbia</p>
      </div>
    </div>
  </footer>`;
}

// â”€â”€ Project detail page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function renderProject(p) {
  const images = p.images || [];
  const multi = images.length > 1;
  const galleryHTML = images.length ? `
    <div class="project-slideshow" id="project-slideshow">
      ${images.map((img, i) => `
        <div class="project-slide${i === 0 ? ' active' : ''}">
          <img src="${img}" alt="${p.title} photo ${i + 1}" loading="lazy">
        </div>`).join('')}
      ${multi ? `
        <button class="project-slide-btn project-slide-prev" aria-label="Previous image">&#8249;</button>
        <button class="project-slide-btn project-slide-next" aria-label="Next image">&#8250;</button>
        <div class="slideshow-dots project-slideshow-dots">
          ${images.map((_, i) => `<button class="slideshow-dot${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="Go to image ${i + 1}"></button>`).join('')}
        </div>` : ''}
    </div>` : '';

  const descHTML = (() => {
    const lines = (p.description || '').split('\n').map(l => l.trim());
    let html = '', buf = [];
    const flush = () => { if (buf.length) { html += `<p>${buf.join(' ')}</p>`; buf = []; } };
    for (const l of lines) {
      if (!l)                    { flush(); continue; }
      if (l.startsWith('### '))  { flush(); html += `<h4>${l.slice(4)}</h4>`; }
      else if (l.startsWith('## ')) { flush(); html += `<h3>${l.slice(3)}</h3>`; }
      else if (l.startsWith('# '))  { flush(); html += `<h2>${l.slice(2)}</h2>`; }
      else                       { buf.push(l); }
    }
    flush();
    return html;
  })();

  const specsHTML = (p.specs && p.specs.length) ? `
    <p class="specs-section-label">Specifications</p>
    <div class="spec-pills">
      ${p.specs.map(s => `<div class="spec-pill"><span class="k">${s.key}</span><span class="v">${s.value}</span></div>`).join('')}
    </div>` : '';


  const others = state.projects.filter(op => !op.hidden && op.id !== p.id);
  const moreTotalPages = Math.ceil(others.length / 3);
  const moreDots = moreTotalPages > 1
    ? `<div class="carousel-dots" id="more-carousel-dots">
        ${Array.from({ length: moreTotalPages }, (_, i) =>
          `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-page="${i}" aria-label="Page ${i + 1}"></button>`
        ).join('')}
       </div>`
    : '<div></div>';
  const othersHTML = others.length ? `
  <section class="more-projects-strip">
    <div class="container">
      <div class="section-header-row">
        <div class="section-header">
          <h2>More projects</h2>
        </div>
        <a href="#all-projects" class="view-all-link">
          View all ${svgArrowRight(14)}
        </a>
      </div>
      <div id="more-projects-cards" class="projects-grid">
        ${others.slice(0, 3).map((op, i) => projectCardHTML(op, i)).join('')}
      </div>
      ${moreTotalPages > 1 ? `
      <div class="carousel-controls">
        ${moreDots}
        <div class="carousel-arrows">
          <button class="carousel-btn" id="more-prev" aria-label="Previous projects" disabled>
            ${svgChevronLeft()}
          </button>
          <button class="carousel-btn" id="more-next" aria-label="Next projects">
            ${svgChevronRight()}
          </button>
        </div>
      </div>` : ''}
    </div>
  </section>` : '';

  document.getElementById('app').innerHTML = `
  <div class="project-detail">
    <div class="container">
      <a href="#" class="back-link" id="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        All projects
      </a>
      <div class="project-detail-header">
        <h1 class="project-detail-title">${p.title || ''}</h1>
      </div>
      <div class="project-detail-body">
        <div class="project-detail-image">${galleryHTML}</div>
        <div class="project-detail-text">
          <div class="project-description">${descHTML}</div>
        </div>
      </div>
      ${specsHTML}
    </div>
  </div>
  <div class="lightbox" id="lightbox" aria-modal="true" role="dialog">
    <button class="lightbox-close" id="lb-close" aria-label="Close lightbox">&times;</button>
    <button class="lightbox-nav lb-prev" id="lb-prev" aria-label="Previous image">&#8249;</button>
    <div class="lightbox-stage">
      <img class="lightbox-img" id="lb-img" src="" alt="">
    </div>
    <button class="lightbox-nav lb-next" id="lb-next" aria-label="Next image">&#8250;</button>
    <div class="lightbox-counter" id="lb-counter"></div>
  </div>
  ${othersHTML}
  ${contactHTML()}`;

  document.getElementById('back-btn').addEventListener('click', e => {
    e.preventDefault();
    if (history.length > 1 && document.referrer.includes(location.hostname)) {
      history.back();
    } else {
      window.location.hash = '#all-projects';
    }
  });

  initProjectSlideshow();
  initLightbox(images);
  initProjectCards();
  initMoreProjectsCarousel(others);
  initContactForm();
  initScrollReveal();
}

function initLightbox(images) {
  if (!images || !images.length) return;
  const lb      = document.getElementById('lightbox');
  const lbImg   = document.getElementById('lb-img');
  const lbCnt   = document.getElementById('lb-counter');
  const lbClose = document.getElementById('lb-close');
  const lbPrev  = document.getElementById('lb-prev');
  const lbNext  = document.getElementById('lb-next');
  if (!lb || !lbImg) return;

  const single = images.length === 1;
  let current = 0;
  let downX = 0, downY = 0;

  function show(idx) {
    current = ((idx % images.length) + images.length) % images.length;
    lbImg.src = images[current];
    lbImg.alt = `Image ${current + 1} of ${images.length}`;
    if (lbCnt) lbCnt.textContent = single ? '' : `${current + 1} / ${images.length}`;
    if (lbPrev) lbPrev.style.visibility = single ? 'hidden' : 'visible';
    if (lbNext) lbNext.style.visibility = single ? 'hidden' : 'visible';
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 200);
  }

  document.querySelectorAll('.project-slide img').forEach((img, idx) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('mousedown', e => { downX = e.clientX; downY = e.clientY; });
    img.addEventListener('click', e => {
      if (Math.abs(e.clientX - downX) > 5 || Math.abs(e.clientY - downY) > 5) return;
      show(idx);
    });
  });

  let lbTouchX = null;
  lb.addEventListener('touchstart', e => { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (lbTouchX === null) return;
    const delta = lbTouchX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) show(delta > 0 ? current + 1 : current - 1);
    lbTouchX = null;
  });

  lbClose?.addEventListener('click', close);
  lbPrev?.addEventListener('click', () => show(current - 1));
  lbNext?.addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target === document.querySelector('.lightbox-stage')) close(); });

  function keyHandler(e) {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  }
  document.addEventListener('keydown', keyHandler);
  lb._removeLbHandler = () => document.removeEventListener('keydown', keyHandler);
}

function initProjectSlideshow() {
  const container = document.getElementById('project-slideshow');
  if (!container) return;
  const slides = container.querySelectorAll('.project-slide');
  const dots   = container.querySelectorAll('.slideshow-dot');
  if (slides.length < 2) return;

  let current = 0;

  function goTo(idx) {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }

  container.querySelector('.project-slide-prev')?.addEventListener('click', () => goTo(current - 1));
  container.querySelector('.project-slide-next')?.addEventListener('click', () => goTo(current + 1));
  dots.forEach(dot => dot.addEventListener('click', () => goTo(parseInt(dot.dataset.idx))));

  function keyHandler(e) {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  }
  document.addEventListener('keydown', keyHandler);

  let dragStartX = null;
  const THRESHOLD = 50;
  function onDragStart(x) { dragStartX = x; }
  function onDragEnd(x) {
    if (dragStartX === null) return;
    const delta = dragStartX - x;
    if (Math.abs(delta) >= THRESHOLD) goTo(delta > 0 ? current + 1 : current - 1);
    dragStartX = null;
  }
  container.addEventListener('mousedown',  e => onDragStart(e.clientX));
  container.addEventListener('mouseup',    e => onDragEnd(e.clientX));
  container.addEventListener('mouseleave', e => { if (dragStartX !== null) onDragEnd(e.clientX); });
  container.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX),    { passive: true });
  container.addEventListener('touchend',   e => onDragEnd(e.changedTouches[0].clientX));
  container.style.cursor = 'grab';
  container.addEventListener('mousedown', () => { container.style.cursor = 'grabbing'; });
  container.addEventListener('mouseup',   () => { container.style.cursor = 'grab'; });
  container.addEventListener('mouseleave',() => { container.style.cursor = 'grab'; });

  container._removeKeyHandler = () => document.removeEventListener('keydown', keyHandler);
}

// â”€â”€ Interaction helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function initProjectCards() {
  document.querySelectorAll('.project-card').forEach(card => {
    const go = () => { window.location.hash = `project/${card.dataset.id}`; };
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(); });
  });
}

function initServiceCards() {
  document.querySelectorAll('.service-card[data-id]').forEach(card => {
    const go = () => { window.location.hash = `service/${card.dataset.id}`; };
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  });
}

function initAboutReadMore() {
  const btn  = document.getElementById('about-read-more');
  const rest = document.querySelector('.about-intro-rest');
  if (!btn || !rest) return;
  btn.addEventListener('click', () => {
    const expanded = rest.classList.toggle('about-intro-rest--visible');
    btn.textContent = expanded ? 'Show less' : 'Read more';
  });
}

function initProjectsCarousel() {
  const visible = state.projects.filter(p => !p.hidden);
  if (visible.length <= 3) return;

  const totalPages = Math.ceil(visible.length / 3);
  let currentPage = 0;

  function goToPage(page) {
    const container = document.getElementById('projects-cards');
    if (!container) return;
    currentPage = Math.max(0, Math.min(page, totalPages - 1));

    container.classList.add('fading');
    setTimeout(() => {
      const slice = visible.slice(currentPage * 3, currentPage * 3 + 3);
      container.innerHTML = slice.map((p, i) => projectCardHTML(p, i)).join('');
      container.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      container.classList.remove('fading');
      initProjectCards();
      updateUI();
      const section = document.getElementById('projects-home');
      if (section) {
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
        window.scrollTo({ top: section.offsetTop - navH, behavior: 'instant' });
      }
    }, 220);
  }

  function updateUI() {
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    if (prev) prev.disabled = currentPage === 0;
    if (next) next.disabled = currentPage === totalPages - 1;
    document.querySelectorAll('#carousel-dots .carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentPage);
    });
  }

  document.getElementById('carousel-prev')?.addEventListener('click', () => goToPage(currentPage - 1));
  document.getElementById('carousel-next')?.addEventListener('click', () => goToPage(currentPage + 1));
  document.querySelectorAll('#carousel-dots .carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => goToPage(parseInt(dot.dataset.page)));
  });

  function keyHandler(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const section = document.getElementById('projects-home');
    if (!section) { document.removeEventListener('keydown', keyHandler); return; }
    const rect = section.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.65 && rect.bottom > window.innerHeight * 0.35;
    if (!inView) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft')  goToPage(currentPage - 1);
    if (e.key === 'ArrowRight') goToPage(currentPage + 1);
  }
  document.addEventListener('keydown', keyHandler);
}

function initRelevantProjectsCarousel(projects) {
  if (projects.length <= 3) return;
  const totalPages = Math.ceil(projects.length / 3);
  let currentPage = 0;

  function goToPage(page) {
    const container = document.getElementById('rel-cards');
    if (!container) return;
    currentPage = Math.max(0, Math.min(page, totalPages - 1));
    container.classList.add('fading');
    setTimeout(() => {
      const slice = projects.slice(currentPage * 3, currentPage * 3 + 3);
      container.innerHTML = slice.map((p, i) => projectCardHTML(p, i)).join('');
      container.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      container.classList.remove('fading');
      initProjectCards();
      updateUI();
      const section = container.closest('section');
      if (section) {
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
        window.scrollTo({ top: section.offsetTop - navH, behavior: 'instant' });
      }
    }, 220);
  }

  function updateUI() {
    const prev = document.getElementById('rel-prev');
    const next = document.getElementById('rel-next');
    if (prev) prev.disabled = currentPage === 0;
    if (next) next.disabled = currentPage === totalPages - 1;
    document.querySelectorAll('#rel-carousel-dots .carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentPage);
    });
  }

  document.getElementById('rel-prev')?.addEventListener('click', () => goToPage(currentPage - 1));
  document.getElementById('rel-next')?.addEventListener('click', () => goToPage(currentPage + 1));
  document.querySelectorAll('#rel-carousel-dots .carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => goToPage(parseInt(dot.dataset.page)));
  });
}

function initMoreProjectsCarousel(projects) {
  if (projects.length <= 3) return;
  const totalPages = Math.ceil(projects.length / 3);
  let currentPage = 0;

  function goToPage(page) {
    const container = document.getElementById('more-projects-cards');
    if (!container) return;
    currentPage = Math.max(0, Math.min(page, totalPages - 1));
    container.classList.add('fading');
    setTimeout(() => {
      const slice = projects.slice(currentPage * 3, currentPage * 3 + 3);
      container.innerHTML = slice.map((p, i) => projectCardHTML(p, i)).join('');
      container.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      container.classList.remove('fading');
      initProjectCards();
      updateUI();
      const section = container.closest('section');
      if (section) {
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
        window.scrollTo({ top: section.offsetTop - navH, behavior: 'instant' });
      }
    }, 220);
  }

  function updateUI() {
    const prev = document.getElementById('more-prev');
    const next = document.getElementById('more-next');
    if (prev) prev.disabled = currentPage === 0;
    if (next) next.disabled = currentPage === totalPages - 1;
    document.querySelectorAll('#more-carousel-dots .carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentPage);
    });
  }

  document.getElementById('more-prev')?.addEventListener('click', () => goToPage(currentPage - 1));
  document.getElementById('more-next')?.addEventListener('click', () => goToPage(currentPage + 1));
  document.querySelectorAll('#more-carousel-dots .carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => goToPage(parseInt(dot.dataset.page)));
  });
}

function initSlideshow() {
  const container = document.getElementById('hero-slideshow');
  if (!container) return;
  const slides = container.querySelectorAll('.slideshow-slide');
  const dots   = container.querySelectorAll('.slideshow-dot');
  if (slides.length < 2) return;

  let current = 0;
  let timer;

  function goTo(idx) {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 3000);
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => { goTo(parseInt(dot.dataset.idx)); startTimer(); });
  });

  container.querySelector('.hero-slide-prev')?.addEventListener('click', e => { e.stopPropagation(); goTo(current - 1); startTimer(); });
  container.querySelector('.hero-slide-next')?.addEventListener('click', e => { e.stopPropagation(); goTo(current + 1); startTimer(); });

  container.querySelectorAll('.slideshow-slide').forEach(slide => {
    slide.addEventListener('click', e => {
      if (e.target.closest('.slideshow-dots')) return;
      if (slide.dataset.id) window.location.hash = `project/${slide.dataset.id}`;
    });
  });

  document.addEventListener('keydown', function heroKeyHandler(e) {
    if (!document.getElementById('hero-slideshow')) {
      document.removeEventListener('keydown', heroKeyHandler);
      return;
    }
    // Only fire when hero is visible (not scrolled past)
    const hero = document.getElementById('home');
    if (hero && hero.getBoundingClientRect().bottom < 0) return;
    if (e.key === 'ArrowLeft')  { goTo(current - 1); startTimer(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); startTimer(); }
  });

  startTimer();
}

function initNavScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  function update() {
    const onHome = !window.location.hash.startsWith('#project/') && window.location.hash !== '#all-projects';
    navbar.classList.toggle('nav-at-top', onHome && window.scrollY < 80);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('hashchange', update);
  update();
}

function initScrollReveal() {}

function initActiveNav() {
  if (!window.IntersectionObserver) return;
  const sections = ['services', 'projects-home', 'about', 'contact'];
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const link = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (link) link.classList.toggle('active', e.isIntersecting);
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
}

function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const endpoint = (state.config.form_endpoint || '').trim();
  if (!endpoint) return;

  function setError(fieldId, errId, msg) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById(errId);
    if (!field || !err) return;
    if (msg) {
      field.classList.add('input-error');
      err.textContent = msg;
    } else {
      field.classList.remove('input-error');
      err.textContent = '';
    }
  }

  function validateField(field) {
    const id  = field.id;
    const val = field.value.trim();
    if (id === 'field-name') {
      setError('field-name', 'err-name', val ? '' : 'Name is required.');
      return !!val;
    }
    if (id === 'field-email') {
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      setError('field-email', 'err-email', !val ? 'Email is required.' : !valid ? 'Please enter a valid email.' : '');
      return !!val && valid;
    }
    if (id === 'field-message') {
      setError('field-message', 'err-message', val ? '' : 'Message is required.');
      return !!val;
    }
    return true;
  }

  ['field-name', 'field-email', 'field-message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('focus', () => {
      if (el.classList.contains('input-error')) {
        el.classList.remove('input-error');
        el.classList.add('input-ok');
        const errId = id.replace('field-', 'err-');
        const err = document.getElementById(errId);
        if (err) err.textContent = '';
      }
    });
    if (el) el.addEventListener('blur', () => {
      el.classList.remove('input-ok');
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Honeypot check
    if (form.querySelector('input[name="_gotcha"]')?.value) return;

    const nameOk    = validateField(document.getElementById('field-name'));
    const emailOk   = validateField(document.getElementById('field-email'));
    const messageOk = validateField(document.getElementById('field-message'));
    if (!nameOk || !emailOk || !messageOk) return;

    const btn     = document.getElementById('form-submit-btn');
    const success = document.getElementById('form-success');
    const error   = document.getElementById('form-error');

    btn.disabled    = true;
    btn.textContent = 'Sending…';
    error.textContent = '';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        form.style.display = 'none';
        success.style.display = 'block';
      } else {
        const json = await res.json().catch(() => ({}));
        error.textContent = json.error || 'Something went wrong. Please try again.';
        btn.disabled    = false;
        btn.textContent = 'Send message';
      }
    } catch {
      error.textContent = 'Could not send. Check your connection and try again.';
      btn.disabled    = false;
      btn.textContent = 'Send message';
    }
  });
}

function initNavLogoLink() {
  document.getElementById('nav-logo')?.addEventListener('click', e => {
    e.preventDefault();
    if (window.location.hash.startsWith('#project/') || window.location.hash === '#all-projects') {
      window.location.hash = '';
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

// â”€â”€ SVG Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function svgArrowRight(size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>`;
}

function svgChevronLeft() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>`;
}

function svgChevronRight() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;
}

function svgPCBTrace() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="8" width="8" height="8" rx="1"/>
    <line x1="8" y1="11" x2="4" y2="11"/>
    <line x1="4" y1="11" x2="4" y2="4"/>
    <line x1="4" y1="4" x2="12" y2="4"/>
    <circle cx="4" cy="11" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="4" cy="4" r="1.4" fill="currentColor" stroke="none"/>
    <line x1="16" y1="13" x2="20" y2="13"/>
    <line x1="20" y1="13" x2="20" y2="20"/>
    <line x1="20" y1="20" x2="12" y2="20"/>
    <circle cx="20" cy="13" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="20" cy="20" r="1.4" fill="currentColor" stroke="none"/>
    <line x1="12" y1="8" x2="12" y2="4"/>
    <line x1="16" y1="8" x2="16" y2="4"/>
  </svg>`;
}

function svgChip() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <rect x="8" y="8" width="8" height="8" rx="1"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="7"  y1="1" x2="7"  y2="3"/>
    <line x1="17" y1="1" x2="17" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="7"  y1="21" x2="7"  y2="23"/>
    <line x1="17" y1="21" x2="17" y2="23"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="1"  y1="7"  x2="3"  y2="7"/>
    <line x1="1"  y1="17" x2="3"  y2="17"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="21" y1="7"  x2="23" y2="7"/>
    <line x1="21" y1="17" x2="23" y2="17"/>
  </svg>`;
}

function svgCode() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>`;
}

function svgGear() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65
      1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9
      19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0
      4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65
      0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65
      0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06
      -.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2
      2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>`;
}

function svgLinkedIn() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853
      0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9
      1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337
      7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063
      2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0
      .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24
      23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>`;
}

function svgRocket() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0
      0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35
      22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>`;
}

// â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function init() {
  await loadData();
  initHamburger();
  initNavLogoLink();
  initNavScroll();
  router();
  window.addEventListener('hashchange', router);
}

init();
