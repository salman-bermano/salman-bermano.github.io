const pageCache = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Router Loaded. Current Path:', window.location.pathname);
    
    updateActiveNav(window.location.pathname);
    prefetchPages();

    document.body.addEventListener('click', e => {
        const link = e.target.closest('.spa-link');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            console.log('Link Clicked:', href);
            navigateTo(href);
        }
    });
    window.addEventListener('popstate', () => {
        console.log('Popstate Event:', window.location.pathname);
        renderPage(window.location.pathname);
    });
});

function updateCopyrightYear() {
    const el = document.getElementById("copyright-date");
    if (!el) return;
  
    const now = new Date();
    const currentYear = now.getFullYear();
  
    el.textContent = el.textContent.replace(
      /(\b20\d{2}\s*[–-]\s*)(20\d{2})$/,
      (match, prefix) => prefix + currentYear
    );
}

async function prefetchPages() {
    const links = document.querySelectorAll('.spa-link');
    for (const link of links) {
        const url = link.getAttribute('href');
        if (!pageCache[url]) {
            const absoluteUrl = new URL(url, window.location.origin).href;
            try {
                const resp = await fetch(absoluteUrl);
                if (resp.ok) {
                    const text = await resp.text();
                    pageCache[url] = extractContent(text); 
                    console.log(`Cached: ${url}`);
                }
            } catch (err) { console.warn(`Prefetch failed for ${url}`, err); }
        }
    }
}

function navigateTo(url) {
    history.pushState(null, null, url);
    renderPage(url);
}

async function renderPage(url) {
    const container = document.getElementById('router-view');
    const relativeUrl = url.replace(window.location.origin, '').replace(/^\//, '') || 'index.html';
    updateActiveNav(relativeUrl);
    container.classList.add('fade-out');

    setTimeout(async () => {
        let content = pageCache[relativeUrl] || pageCache[url] || pageCache['/' + relativeUrl];

        if (!content) {
            console.log(`Not in cache, fetching: ${relativeUrl}`);
            try {
                const fetchTarget = relativeUrl === '' ? 'index.html' : relativeUrl;
                const absoluteTarget = new URL(fetchTarget, window.location.origin).href;
                const resp = await fetch(absoluteTarget);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const text = await resp.text();
                content = extractContent(text);
                pageCache[relativeUrl] = content;
            } catch (err) {
                console.error('Load failed:', err);
                content = `<div class="container py-5 text-center">
                    <h3>Page not found</h3>
                    <p>Tried to load: ${relativeUrl}</p>
                    <a href="index.html" class="btn btn-primary spa-link">go home</a>
                </div>`;
            }
        }

        container.innerHTML = content;
        window.scrollTo(0, 0);
        container.classList.remove('fade-out');
        const form = document.getElementById('contact-form');
        if(form) { }
        
    }, 200);
}

function extractContent(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const content = doc.getElementById('router-view');
    return content ? content.innerHTML : '<h1>Content not found in fetched file</h1>';
}

const routes = {
    "/": {
      title: "Home – My SPA",
      render: () => `<h1>Home</h1><p>Welcome to the homepage!</p>`
    },
    "/about.html": {
      title: "About – My SPA",
      render: () => `<h1>About</h1><p>About this app.</p>`
    },
    "/contact.html": {
      title: "Contact – My SPA",
      render: () => `<h1>Contact</h1><p>Contact us here.</p>`
    },
    "my-work.html": {
        title: "",
        render: () => ``
    }
  };

  function renderRoute() {
    const path = location.hash.slice(1) || "/";
    
    const route = routes[path] || {
      title: "404 – Not Found",
      render: () => "<h1>404</h1><p>Page not found.</p>"
    };
  
    document.title = route.title;
    document.getElementById("app").innerHTML = route.render();
  }

function updateActiveNav(path) {
    const cleanPath = path.replace(/^\//, '') || 'index.html';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');
        if (linkHref === cleanPath || linkHref === '/' + cleanPath) {
            link.classList.add('active');
        }
    });
}