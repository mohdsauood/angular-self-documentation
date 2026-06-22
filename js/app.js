/* ============================================
   Angular Self-Documentation — App JS
   Handles navigation, markdown loading, TOC
   ============================================ */

// ---------- Topic Registry ----------
const TOPICS = {
  fundamentals: [
    { file: 'fundamentals/00-your-definitions-corrected.md', label: 'Your Definitions Corrected' },
    { file: 'fundamentals/01-what-is-angular.md', label: 'What is Angular' },
    { file: 'fundamentals/02-components.md', label: 'Components' },
    { file: 'fundamentals/03-templating.md', label: 'Templating' },
    { file: 'fundamentals/04-routing.md', label: 'Routing' },
    { file: 'fundamentals/05-forms.md', label: 'Forms' },
    { file: 'fundamentals/06-dependency-injection.md', label: 'Dependency Injection' },
    { file: 'fundamentals/07-build-and-dev-tools.md', label: 'Build & Dev Tools' },
    { file: 'fundamentals/08-project-configuration.md', label: 'Project Configuration' },
    { file: 'fundamentals/09-styling-and-css.md', label: 'Styling & CSS' },
    { file: 'fundamentals/10-modules-and-architecture.md', label: 'Modules & Architecture' },
    { file: 'fundamentals/11-typescript-basics.md', label: 'TypeScript Basics' },
    { file: 'fundamentals/12-events-and-dom.md', label: 'Events & DOM' },
    { file: 'fundamentals/13-inputs-outputs.md', label: 'Inputs & Outputs' },
    { file: 'fundamentals/14-code-conventions.md', label: 'Code Conventions' },
    { file: 'fundamentals/15-lifecycle-hooks.md', label: 'Lifecycle Hooks' },
    { file: 'fundamentals/16-services.md', label: 'Services' },
    { file: 'fundamentals/17-interceptors.md', label: 'Interceptors' },
    { file: 'fundamentals/18-rxjs.md', label: 'RxJS' },
    { file: 'fundamentals/19-performance.md', label: 'Performance' },
    { file: 'fundamentals/20-signals.md', label: 'Signals' },
    { file: 'fundamentals/21-deferrable-views.md', label: 'Deferrable Views' },
    { file: 'fundamentals/22-directives-pipes-ngrx-rxjs-interview.md', label: 'Directives, Pipes, NgRx, RxJS Interview' },
    { file: 'fundamentals/23-shadow-dom.md', label: 'Shadow DOM' },
    { file: 'fundamentals/24-change-detection.md', label: 'Change Detection' },
    { file: 'fundamentals/25-aria-accessibility.md', label: 'ARIA & Accessibility' },
  ],
  roadmap: [
    { file: 'roadmap/roadmap-beginner-to-6-year-developer.md', label: 'Beginner → 6-Year Developer' },
  ],
  root: [
    { file: 'README.md', label: 'README' },
    { file: 'TOPIC-INDEX.md', label: 'Topic Index' },
    { file: 'DOCUMENTATION-TONE-GUIDE.md', label: 'Documentation Tone Guide' },
    { file: 'last-changes.md', label: 'Last Changes' },
  ]
};

const DOCS_BASE = 'docs/';

// ---------- State ----------
let currentFile = null;

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  setupMobileToggle();
  handleInitialRoute();
  window.addEventListener('hashchange', handleRouteChange);
});

// ---------- Build Left Navigation ----------
function buildNav() {
  const navFundamentals = document.getElementById('navFundamentals');
  const navRoadmap = document.getElementById('navRoadmap');

  TOPICS.fundamentals.forEach(t => {
    navFundamentals.appendChild(createNavLink(t));
  });
  TOPICS.roadmap.forEach(t => {
    navRoadmap.appendChild(createNavLink(t));
  });

  const navMeta = document.getElementById('navMeta');
  TOPICS.root.forEach(t => {
    navMeta.appendChild(createNavLink(t));
  });
}

function createNavLink(topic) {
  const a = document.createElement('a');
  a.href = '#' + topic.file;
  a.textContent = topic.label;
  a.setAttribute('data-file', topic.file);
  a.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(topic.file);
  });
  return a;
}

// ---------- Navigation ----------
function navigateTo(file) {
  window.location.hash = file;
}

function handleInitialRoute() {
  const hash = window.location.hash.slice(1);
  if (hash) {
    loadDocument(hash);
  }
}

function handleRouteChange() {
  const hash = window.location.hash.slice(1);
  if (hash) {
    loadDocument(hash);
  } else {
    showWelcome();
  }
}

// ---------- Document Loading ----------
async function loadDocument(file) {
  const welcome = document.getElementById('welcomeScreen');
  const article = document.getElementById('contentArticle');

  welcome.style.display = 'none';
  article.style.display = 'block';
  article.innerHTML = '<div class="content-loading"><p>Loading…</p></div>';

  try {
    const url = DOCS_BASE + file;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const rawMarkdown = await resp.text();
    const html = marked.parse(rawMarkdown);
    article.innerHTML = html;
    currentFile = file;

    // Style tables, add IDs to headings, etc.
    postProcessArticle(article);
    // Build TOC
    buildTOC(article);
    // Update active nav
    updateActiveNav(file);
  } catch (err) {
    article.innerHTML = `
      <div class="content-loading">
        <h2>😕 Could not load document</h2>
        <p>${err.message}</p>
        <p><small>File: ${DOCS_BASE}${file}</small></p>
      </div>`;
    console.error('Failed to load document:', err);
  }
}

function showWelcome() {
  document.getElementById('welcomeScreen').style.display = 'block';
  document.getElementById('contentArticle').style.display = 'none';
  document.getElementById('tocNav').innerHTML = '';
  currentFile = null;
  updateActiveNav(null);
}

// ---------- Post-Process Article ----------
function postProcessArticle(article) {
  // Add IDs to all headings for TOC linking
  const headings = article.querySelectorAll('h1, h2, h3, h4');
  const usedIds = new Set();

  headings.forEach((h, i) => {
    const raw = h.textContent.trim();
    let id = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    // Deduplicate
    if (usedIds.has(id)) {
      id = id + '-' + (i + 1);
    }
    usedIds.add(id);
    h.id = id;
  });

  // Make external links open in new tab
  article.querySelectorAll('a[href^="http"]').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });

  // Fix internal links pointing to other .md files
  article.querySelectorAll('a[href$=".md"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('http')) {
      // Resolve relative path
      const base = currentFile ? currentFile.split('/').slice(0, -1).join('/') + '/' : '';
      const resolved = resolveRelativePath(base + href);
      a.href = '#' + resolved;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(resolved);
      });
    }
  });
}

function resolveRelativePath(path) {
  // Normalize '../' and './'
  const parts = path.split('/');
  const result = [];
  for (const p of parts) {
    if (p === '.' || p === '') continue;
    if (p === '..') {
      result.pop();
    } else {
      result.push(p);
    }
  }
  return result.join('/');
}

// ---------- Table of Contents ----------
function buildTOC(article) {
  const tocNav = document.getElementById('tocNav');
  const headings = article.querySelectorAll('h2, h3, h4');
  tocNav.innerHTML = '';

  if (headings.length === 0) {
    tocNav.innerHTML = '<span style="font-size:0.8rem;color:var(--text-muted);">No sections</span>';
    return;
  }

  headings.forEach(h => {
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent.trim();
    a.className = 'toc-' + h.tagName.toLowerCase();
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
    });
    tocNav.appendChild(a);
  });

  // Highlight active TOC item on scroll
  setupTOCSpy();
}

let tocSpyAttached = false;
function setupTOCSpy() {
  if (tocSpyAttached) return;
  tocSpyAttached = true;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateTOCActive();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function updateTOCActive() {
  const headings = document.querySelectorAll('.content-article h2, .content-article h3, .content-article h4');
  const tocLinks = document.querySelectorAll('.toc-nav a');
  if (headings.length === 0 || tocLinks.length === 0) return;

  let current = null;
  headings.forEach(h => {
    const rect = h.getBoundingClientRect();
    if (rect.top <= 120) {
      current = h.id;
    }
  });

  tocLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

// ---------- Active Nav ----------
function updateActiveNav(file) {
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-file') === file);
  });
}

// ---------- Mobile Nav Toggle ----------
function setupMobileToggle() {
  const toggle = document.getElementById('mobileNavToggle');
  const sidebar = document.getElementById('sidebarLeft');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking a nav link on mobile
  sidebar.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && window.innerWidth <= 768) {
      sidebar.classList.remove('open');
    }
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        e.target !== toggle &&
        !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}
