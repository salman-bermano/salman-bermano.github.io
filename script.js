const pageTitles = {
    "index.html": "Home | Salman Bermano",
    "/": "Home | Salman Bermano", 

    "about.html": "About Me | Salman Bermano",
    "contact.html": "Contact Me | Salman Bermano",
    "my-work.html": "My Work | Salman Bermano"
};

const pageCache = {};

document.addEventListener('DOMContentLoaded', () => {

    const initialPath = getRelativeUrl(window.location.pathname);
    document.title = pageTitles[initialPath] || "Salman Bermano"; 

    updateActiveNav(initialPath);
    prefetchPages();

    document.body.addEventListener('click', e => {
        const link = e.target.closest('.spa-link');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            navigateTo(href);
        }
    });

    window.addEventListener('popstate', () => {
        const path = getRelativeUrl(window.location.pathname);

        document.title = pageTitles[path] || "Salman Bermano"; 
        renderPage(path);
    });
});

function getRelativeUrl(url) {

    let relative = url.replace(window.location.origin, '').replace(/^\//, '') || 'index.html';

    return relative === '' ? 'index.html' : relative;
}

function navigateTo(url) {
    history.pushState(null, null, url);

    const relativeUrl = getRelativeUrl(url);
    if (pageTitles[relativeUrl]) {
        document.title = pageTitles[relativeUrl];
    }

    renderPage(url);
}

async function renderPage(url) {
    const container = document.getElementById('router-view');
    const relativeUrl = getRelativeUrl(url);

    updateActiveNav(relativeUrl);
    container.classList.add('fade-out');

    setTimeout(async () => {

        let content = pageCache[relativeUrl];

        if (!content) {
            try {

                const resp = await fetch(relativeUrl);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

                const text = await resp.text();
                content = extractContent(text); 

                pageCache[relativeUrl] = content;

            } catch (err) {

                console.error('Load failed:', err);
                document.title = "404 Not Found"; 

                content = `
                    <div class="container py-5 text-center">
                        <h3 class="display-1">404</h3>
                        <p>Page not found.</p>
                        <a href="index.html" class="btn btn-primary spa-link">Go Home</a>
                    </div>`;
            }
        }

        container.innerHTML = content;
        window.scrollTo(0, 0);
        container.classList.remove('fade-out');

    }, 200);
}

function extractContent(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const content = doc.getElementById('router-view');
    return content ? content.innerHTML : '<h1>Content not found</h1>';
}

function updateActiveNav(path) {

    const cleanPath = path.replace(/^\//, '') || 'index.html';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');
        if (linkHref === cleanPath) {
            link.classList.add('active');
        }
    });
}

async function prefetchPages() {
    const links = document.querySelectorAll('.spa-link');
    for (const link of links) {
        const url = link.getAttribute('href');
        if (!pageCache[url]) {
            try {
                const resp = await fetch(url);
                if (resp.ok) {
                    const text = await resp.text();
                    pageCache[url] = extractContent(text); 
                }
            } catch (err) { }
        }
    }
}