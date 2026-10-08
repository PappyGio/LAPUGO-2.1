const DATA_PATH = new URL("site-data.json", document.baseURI).href;

let siteData = null;

async function loadSiteData() {
    if (siteData) return siteData;

    // Prefer the embedded static copy so the site also works when opened
    // directly from a folder and remains reliable on Vercel/GitHub Pages.
    if (window.LAPUGO_DATA && typeof window.LAPUGO_DATA === "object") {
        siteData = window.LAPUGO_DATA;
        return siteData;
    }

    // JSON remains as a fallback for developers who update site-data.json.
    const response = await fetch(DATA_PATH, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Unable to load ${DATA_PATH}`);
    }

    siteData = await response.json();
    return siteData;
}

function imageUrl(key) {
    return siteData.images[key].url;
}

function renderNavigation() {
    const nav = document.querySelector("#navLinks");
    if (!nav) return;

    const current = document.body.dataset.page || "home";
    const links = [
        ["home", "index.html", "Home"],
        ["destinations", "destinations.html", "Explore Cebu"],
        ["heritage", "destinations.html?type=Heritage", "Heritage"],
        ["nature", "destinations.html?type=Nature", "Nature"],
        ["tours", "tours.html", "Tours"],
        ["gallery", "gallery.html", "Gallery"],
        ["about", "about.html", "About"],
        ["contact", "contact.html", "Contact"],
        ["booking", "booking.html", "Book Now"]
    ];

    nav.innerHTML = links.map(([key, href, label]) => {
        const active = current === key || (
            current === "destinations" && ["destinations", "heritage", "nature"].includes(key)
        );
        return `<a class="${active ? "active" : ""} ${key === "booking" ? "nav-cta" : ""}" href="${href}">${label}</a>`;
    }).join("");

    nav.insertAdjacentHTML("beforeend", `<button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle dark mode" title="Toggle dark mode">☀</button>`);
}

function renderFooter() {
    const footer = document.querySelector("#siteFooter");
    if (!footer) return;

    const photos = (siteData.galleryPhotos || []).slice(0, 5).map((photo, index) => `
        <img src="${photo.image}" alt="${photo.title}" loading="lazy">
    `).join("");

    footer.innerHTML = `
        <div class="container">
            <div class="footer-gallery">${photos}</div>

            <div class="footer-grid">
                <div>
                    <img src="logo-transparent.png" alt="LapuGo Travel & Tours logo">
                    <p>Explore. Check. Choose. Then, let's go. Cebu experiences made easier, clearer and more convenient.</p>
                </div>
                <div>
                    <h3>Explore Cebu</h3>
                    <a href="destinations.html">All Destinations</a>
                    <a href="destinations.html?type=Heritage">Heritage Cebu</a>
                    <a href="destinations.html?type=Nature">Natural Cebu</a>
                    <a href="tours.html">Tour Packages</a>
                </div>
                <div>
                    <h3>LapuGo</h3>
                    <a href="services.html">Services</a>
                    <a href="gallery.html">Gallery</a>
                    <a href="blog.html">Travel Blog</a>
                    <a href="about.html">About Us</a>
                </div>
                <div>
                    <h3>Contact</h3>
                    <a href="tel:+639162883866">${siteData.site.mobile}</a>
                    <a href="mailto:${siteData.site.email}">${siteData.site.email}</a>
                    <a href="contact.html#map">${siteData.site.location}</a>
                    <a href="booking.html">Send an Inquiry</a>
                </div>
            </div>

            <div class="footer-bottom">
                <span>© 2026 LapuGo Travel & Tours. Academic website prototype.</span>
                <span>${siteData.site.tagline}</span>
            </div>
        </div>
    `;
}

function setupMenu() {
    const toggle = document.querySelector("#menuToggle");
    const nav = document.querySelector("#navLinks");

    if (toggle && nav) {
        toggle.addEventListener("click", () => {
            nav.classList.toggle("open");
            toggle.setAttribute("aria-expanded", nav.classList.contains("open"));
        });
    }

    const themeToggle = document.querySelector("#themeToggle");
    const saved = localStorage.getItem("lapugo-theme");
    document.documentElement.dataset.theme = saved === "light" ? "light" : "dark";
    updateThemeButton();

    themeToggle?.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem("lapugo-theme", next);
        updateThemeButton();
    });
}

function updateThemeButton() {
    const button = document.querySelector("#themeToggle");
    if (!button) return;
    const dark = document.documentElement.dataset.theme !== "light";
    button.textContent = dark ? "☀" : "◐";
    button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    button.setAttribute("aria-label", button.title);
}

function showToast(message) {
    let toast = document.querySelector("#toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

function setupForms() {
    document.querySelectorAll("form[data-demo-form]").forEach(form => {
        form.addEventListener("submit", event => {
            event.preventDefault();

            const name = form.querySelector("[name='name']")?.value?.trim() || "Traveler";

            showToast(
                `Thanks, ${name}! Your request has been prepared for LapuGo. Connect the form to your preferred email/CRM before production use.`
            );

            form.reset();
        });
    });
}

function renderDestinations() {
    const grid = document.querySelector("#destinationGrid");
    if (!grid) return;

    const search = document.querySelector("#destinationSearch");
    const filters = document.querySelector("#destinationFilters");
    const requestedType = new URLSearchParams(location.search).get("type");
    const initialType = ["Heritage", "Nature"].includes(requestedType) ? requestedType : "All";

    const expanded = [
        ...(siteData.destinationCategories?.Heritage || []).map(item => ({
            name: item[0], image: item[1], description: item[2], type: "Heritage", tags: ["Heritage"]
        })),
        ...(siteData.destinationCategories?.Nature || []).map(item => ({
            name: item[0], image: item[1], description: item[2], type: "Nature", tags: ["Nature"]
        }))
    ];

    const items = [...(siteData.destinations || [])];
    expanded.forEach(item => {
        if (!items.some(existing => existing.name === item.name)) items.push(item);
    });

    function draw(filter = initialType, term = "") {
        const normalized = term.toLowerCase().trim();
        const results = items.filter(item => {
            const matchesFilter = filter === "All" || item.type === filter;
            const searchable = [item.name, item.type, item.description, ...(item.tags || [])]
                .join(" ").toLowerCase();
            return matchesFilter && searchable.includes(normalized);
        });

        grid.innerHTML = results.length
            ? results.map(item => `
                <article class="card">
                    <img class="card-image" src="${item.image?.url || imageUrl(item.image)}" alt="${item.name}, Cebu" loading="lazy">
                    <div class="card-body">
                        <span class="tag">${item.type}</span>
                        <h3>${item.name}</h3>
                        <p>${item.description}</p>
                        <div class="meta">${(item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("")}</div>
                        <a class="btn btn-dark" href="booking.html?destination=${encodeURIComponent(item.name)}">Ask About This</a>
                    </div>
                </article>
            `).join("")
            : `<div class="notice" style="grid-column:1/-1">No destination matched your search.</div>`;
    }

    const types = ["All", "Heritage", "Nature"];
    filters.innerHTML = types.map(type =>
        `<button class="filter-btn ${type === initialType ? "active" : ""}" type="button">${type}</button>`
    ).join("");

    filters.addEventListener("click", event => {
        const button = event.target.closest(".filter-btn");
        if (!button) return;
        filters.querySelectorAll(".filter-btn").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        draw(button.textContent.trim(), search?.value || "");
    });

    search?.addEventListener("input", () => {
        const active = filters.querySelector(".active")?.textContent.trim() || "All";
        draw(active, search.value);
    });

    draw(initialType);
}

function getTourImage(tour) {
    if (tour.image && siteData.images[tour.image]?.url) return siteData.images[tour.image].url;
    if (tour.id === "island-hopping-adventure") return siteData.images.caohaganReal.url;
    if (tour.id === "cebu-heritage-overnight") return siteData.images.heritage.url;
    return imageUrl(tour.image);
}

function renderTours() {
    const grid = document.querySelector("#tourGrid");
    if (!grid) return;

    grid.innerHTML = siteData.tours.map(tour => `
        <article class="card tour-card">
            <img class="card-image" src="${getTourImage(tour)}" alt="${tour.title}" loading="lazy">
            <div class="card-body">
                <span class="tag">${tour.duration}</span>
                <h3>${tour.title}</h3>
                <p>${tour.short}</p>
                <div class="meta"><span class="price">${tour.price}</span></div>
                <div class="actions" style="margin-top:18px;">
                    <a class="btn btn-dark" href="tour-details.html?tour=${encodeURIComponent(tour.id)}">View Itinerary</a>
                    <a class="btn btn-outline" href="booking.html?tour=${encodeURIComponent(tour.title)}">Inquire</a>
                </div>
            </div>
        </article>
    `).join("");
}

function renderTourDetail() {
    const target = document.querySelector("#tourDetail");
    if (!target) return;

    const requestedId = new URLSearchParams(location.search).get("tour");
    const tour = siteData.tours.find(item => item.id === requestedId) || siteData.tours[0];
    const heroImage = getTourImage(tour);

    const keywordMap = {
        "south-cebu": /oslob|kawasan|moalboal|tumalog|whale/i,
        "three-island": /caohagan|hilutungan|sulpa|island/i,
        "island-hopping-adventure": /caohagan|island/i,
        "cebu-heritage-overnight": /magellan|basilica|fort|heritage|cebu city/i,
        "kawasan-pescador": /pescador|moalboal|kawasan|sardine/i,
        "cebu-safari": /safari|lion|savanna|zebra|bird|adventure/i,
        "bantayan-3d2n": /bantayan|kota|virgin island|paradise beach/i
    };
    const matcher=keywordMap[tour.id] || /cebu/i;
    let photos=(siteData.galleryPhotos||[]).filter(photo=>matcher.test(`${photo.title} ${photo.description}`));
    if(!photos.length) photos=(siteData.galleryPhotos||[]).slice(0,4);

    const ratesHtml=tour.rates?`<div class="rate-table-wrap"><h3>Rates</h3><table class="rate-table"><thead><tr><th>No. of Pax</th><th>Rate per Person</th></tr></thead><tbody>${Object.entries(tour.rates).map(([pax,rate])=>`<tr><td>${pax}</td><td>${rate}</td></tr>`).join("")}</tbody></table></div>`:"";
    const scheduleHtml=tour.parkSchedule?`<div class="form-card" style="margin-top:22px;"><h2>Park Schedule</h2><ul class="check-list">${tour.parkSchedule.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:"";
    const bringHtml=tour.whatToBring?`<div class="form-card" style="margin-top:22px;"><h2>What to Bring</h2><ul class="check-list">${tour.whatToBring.map(x=>`<li>${x}</li>`).join("")}</ul></div>`:"";
    const policyHtml=tour.policies?`<div class="form-card" style="margin-top:22px;"><h2>Policy</h2><ul class="check-list">${tour.policies.map(x=>`<li>${x}</li>`).join("")}</ul>${tour.payment?`<div class="notice" style="margin-top:20px;"><strong>Payment:</strong> ${tour.payment}</div>`:""}</div>`:"";
    const video=tour.id==='bantayan-3d2n'?siteData.videos.find(v=>v.youtubeId==='73ijH-daPXs'):null;

    target.innerHTML=`
        <div class="tour-detail-hero">
            <img src="${heroImage}" alt="${tour.title}" loading="eager">
            <div class="tour-detail-overlay">
                <span class="tag">${tour.duration}</span>
                <h1>${tour.title}</h1>
                <p>${tour.short}</p>
                <div class="actions"><a class="btn btn-primary" href="booking.html?tour=${encodeURIComponent(tour.title)}">Inquire / Book Now</a><a class="btn btn-secondary" href="tours.html">Back to Tours</a></div>
            </div>
        </div>

        <div class="grid grid-2" style="margin-top:35px;">
            <div class="form-card"><span class="eyebrow">Overview</span><h2>${tour.title}</h2><p style="margin-top:14px;">${tour.overview||tour.short}</p>${tour.route?`<div class="notice" style="margin-top:20px;"><strong>Route:</strong> ${tour.route}</div>`:""}${tour.accommodation?`<div class="notice" style="margin-top:12px;"><strong>Accommodation:</strong> ${tour.accommodation}</div>`:""}${tour.rateNote?`<div class="notice" style="margin-top:12px;"><strong>Rate note:</strong> ${tour.rateNote}</div>`:""}</div>
            <div class="form-card"><span class="eyebrow">At a glance</span><h2>Highlights</h2><ul class="check-list">${(tour.highlights||[]).map(x=>`<li>${x}</li>`).join("")}</ul></div>
        </div>

        ${ratesHtml}

        <div class="grid grid-2" style="margin-top:45px;">
            <div class="form-card"><h2>Itinerary</h2><div class="timeline" style="margin-top:25px;">${tour.itinerary.map(row=>`<div class="timeline-item"><div class="timeline-time">${row[0]}<br><small>${row[1]}</small></div><div><strong>${row[2]}</strong></div></div>`).join("")}</div></div>
            <div><div class="form-card"><h2>Guaranteed Inclusions</h2><ul class="check-list">${tour.includes.map(x=>`<li>${x}</li>`).join("")}</ul>${(tour.addons||[]).length?`<h3 style="margin-top:28px;">Optional Add-ons / Activities</h3><ul class="check-list">${tour.addons.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}<h3 style="margin-top:28px;">Exclusions</h3><ul class="check-list">${tour.excludes.map(x=>`<li>${x}</li>`).join("")}</ul>${tour.pickup?`<div class="notice" style="margin-top:25px;"><strong>Pickup:</strong> ${tour.pickup}</div>`:""}${tour.notes?`<div class="notice" style="margin-top:12px;"><strong>Important:</strong> ${tour.notes}</div>`:""}</div>${bringHtml}</div>
        </div>

        ${scheduleHtml}${policyHtml}

        <section class="section" style="padding-bottom:0;"><div class="section-heading"><div class="eyebrow">Real travel photography</div><h2>See the experience</h2><p>These images come from travel blogs/articles and are displayed with courtesy credits and links to the original source.</p></div><div class="grid grid-2">${photos.map(photo=>`<figure class="card photo-card" style="overflow:hidden;"><img src="${photo.image}" alt="${photo.title}" style="height:330px;object-fit:cover;" loading="lazy"><figcaption class="card-body"><h3>${photo.title}</h3><p style="margin-top:7px;">${photo.description}</p><div class="photo-credit">${photo.credit}</div><a class="photo-source" href="${photo.source}" target="_blank" rel="noopener">View original source →</a></figcaption></figure>`).join("")}</div></section>

        ${video?`<section class="section" style="padding-bottom:0;"><div class="section-heading"><div class="eyebrow">Bantayan video</div><h2>Preview the island</h2><p>This YouTube video was supplied by LapuGo for this package page.</p></div>${videoCardMarkup(video)}</section>`:""}

        <section class="section" style="padding-bottom:0;"><div class="section-heading"><div class="eyebrow">Interactive map</div><h2>Follow the route</h2><p>Explore the main stops and surrounding area before booking.</p></div><iframe class="map-frame" title="Interactive map for ${tour.title}" src="https://www.google.com/maps?q=${encodeURIComponent(tour.mapQuery||tour.title+' Cebu Philippines')}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></section>
    `;
}

function videoCardMarkup(video){return `<article class="video-card"><a class="video-thumb" href="${video.url}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg" alt="${video.title}" loading="lazy"><span class="video-play">▶</span></a><div class="video-copy"><span class="tag">YouTube</span><h3 style="margin-top:9px;">${video.title}</h3><p style="margin-top:8px;">${video.description}</p><div class="video-credit">${video.credit}</div><a class="btn btn-dark" style="margin-top:15px;" href="${video.url}" target="_blank" rel="noopener">Play on YouTube →</a></div></article>`;}

function renderGallery() {
    const grid = document.querySelector("#galleryGrid");
    if (!grid) return;

    const gallery = siteData.galleryPhotos || [];

    grid.innerHTML = gallery.map((photo, index) => `
        <figure class="gallery-item"
                data-full="${photo.image}"
                data-caption="${photo.title} — ${photo.description}"
                data-credit="${photo.credit}">
            <img src="${photo.image}" alt="${photo.title}, Cebu" loading="lazy">
            <figcaption class="gallery-caption">
                <strong>${photo.title}</strong>
                <span>${photo.description}</span>
            </figcaption>
        </figure>
    `).join("");

    const modal = document.querySelector("#galleryModal");

    grid.addEventListener("click", event => {
        const item = event.target.closest(".gallery-item");
        if (!item || !modal) return;

        modal.querySelector("img").src = item.dataset.full;
        modal.querySelector(".modal-caption").innerHTML = `
            <strong>${item.dataset.caption.split(" — ")[0]}</strong>
            <p style="margin-top:6px;">${item.dataset.caption.split(" — ").slice(1).join(" — ")}</p>
            <div class="photo-credit">${item.dataset.credit}</div>
        `;
        modal.classList.add("open");
    });

    modal?.addEventListener("click", event => {
        if (event.target.classList.contains("modal") || event.target.classList.contains("modal-close")) {
            modal.classList.remove("open");
        }
    });
}

function renderVideoCards() {
    const grid=document.querySelector("#videoGrid");
    if(!grid) return;
    grid.innerHTML=siteData.videos.map(video=>videoCardMarkup(video)).join("");
}

function fillBookingFromQuery() {
    const params = new URLSearchParams(location.search);
    const tour = params.get("tour");
    const destination = params.get("destination");

    const message = document.querySelector("[name='message']");
    if (!message) return;

    const context = [tour && `Tour: ${tour}`, destination && `Destination: ${destination}`]
        .filter(Boolean)
        .join("\n");

    if (context) {
        message.value = `${context}\n\nPreferred travel date:\nNumber of travelers:\nPickup location:\nQuestions / preferences:\n`;
    }
}

function renderTikTokFeature() {
    const container = document.querySelector("#tiktokFeature");
    if (!container || !siteData.tiktokFeature) return;

    const t = siteData.tiktokFeature;
    const playerUrl = `https://www.tiktok.com/player/v1/${encodeURIComponent(t.id)}?autoplay=1&muted=1&loop=1&controls=1&description=1&music_info=1&rel=0`;

    container.innerHTML = `
        <div class="tiktok-shell homepage-tiktok-shell">
            <div class="tiktok-player-wrap">
                <iframe
                    id="lapugoTikTokPlayer"
                    src="${playerUrl}"
                    title="${t.title}"
                    allow="autoplay; fullscreen"
                    allowfullscreen
                    loading="eager"
                    referrerpolicy="strict-origin-when-cross-origin">
                </iframe>
                <div class="tiktok-scroll-badge" id="tiktokScrollBadge" aria-hidden="true">▶ Auto-play on scroll</div>
            </div>
            <div class="tiktok-credit">
                <strong>${t.title}</strong>
                <span>${t.description}</span>
                <span>Courtesy of ${t.creator} on TikTok.</span>
                <span class="tiktok-status" id="tiktokStatus" aria-live="polite">Preparing TikTok player…</span>
                <button class="tiktok-play-btn" id="tiktokPlayButton" type="button">▶ Play TikTok</button>
                <a href="${t.url}" target="_blank" rel="noopener noreferrer">Open original TikTok →</a>
            </div>
        </div>
    `;

    const frame = container.querySelector("#lapugoTikTokPlayer");
    const playButton = container.querySelector("#tiktokPlayButton");
    const status = container.querySelector("#tiktokStatus");
    const badge = container.querySelector("#tiktokScrollBadge");
    if (!frame) return;

    let isInView = false;
    let playerReady = false;
    let observer = null;

    const setStatus = (message) => {
        if (status) status.textContent = message;
    };

    const sendTikTokCommand = (type) => {
        if (!frame.contentWindow) return;
        frame.contentWindow.postMessage(
            { "x-tiktok-player": true, type, value: undefined },
            "https://www.tiktok.com"
        );
    };

    const play = () => {
        sendTikTokCommand("play");
        setStatus("Playing TikTok");
        badge?.classList.add("is-playing");
    };

    const pause = () => {
        sendTikTokCommand("pause");
        setStatus("Paused while off-screen");
        badge?.classList.remove("is-playing");
    };

    const updatePlayback = () => {
        if (!playerReady) return;
        if (isInView) {
            play();
        } else {
            pause();
        }
    };

    window.addEventListener("message", event => {
        if (event.origin !== "https://www.tiktok.com") return;
        if (!event.data || event.data["x-tiktok-player"] !== true) return;

        if (event.data.type === "onPlayerReady") {
            playerReady = true;
            setStatus("TikTok ready — scrolling into view will play it automatically.");
            updatePlayback();
        }

        if (event.data.type === "onStateChange") {
            if (event.data.value === 1) {
                setStatus("Playing TikTok");
                badge?.classList.add("is-playing");
            } else if (event.data.value === 2) {
                setStatus("Paused");
                badge?.classList.remove("is-playing");
            }
        }

        if (event.data.type === "onPlayerError") {
            setStatus("Autoplay was blocked by the browser. Tap Play TikTok to start playback.");
            badge?.classList.remove("is-playing");
        }
    });

    playButton?.addEventListener("click", () => {
        playerReady = true;
        isInView = true;
        play();
    });

    frame.addEventListener("load", () => {
        setStatus("TikTok player loaded — checking whether it is in view…");
        window.setTimeout(() => {
            if (!playerReady) {
                // The player normally sends onPlayerReady. This timeout only keeps the UI useful
                // if a browser suppresses the ready event.
                setStatus("TikTok loaded. Scroll into view or tap Play TikTok.");
            }
            updatePlayback();
        }, 700);
    });

    if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
            entries => {
                const entry = entries[0];
                isInView = entry.isIntersecting && entry.intersectionRatio >= 0.35;
                updatePlayback();
            },
            {
                threshold: [0, 0.35, 0.6, 1],
                rootMargin: "40px 0px 40px 0px"
            }
        );
        observer.observe(frame);
    } else {
        isInView = true;
    }
}

function renderAttractionSlideshow() {
    const slider = document.querySelector("#attractionSlider");
    if (!slider || !siteData.homepageSlides?.length) return;

    const slides = siteData.homepageSlides;
    slider.innerHTML = `
        ${slides.map((slide,index)=>`
            <article class="attraction-slide ${index===0?'active':''}">
                <img src="${slide.image}" alt="${slide.title} — ${slide.subtitle}" loading="${index===0?'eager':'lazy'}">
                <div class="container slide-content">
                    <div class="slide-copy">
                        <span class="slide-category">${slide.category}</span>
                        <div class="eyebrow" style="margin-top:18px;">Cebu · ${slide.subtitle}</div>
                        <h1>${slide.title}</h1>
                        <p>${slide.description}</p>
                        <div class="hero-actions" style="margin-top:26px;">
                            <a class="btn btn-primary" href="destinations.html?type=${encodeURIComponent(slide.category)}">Explore ${slide.category}</a>
                            <a class="btn btn-secondary" href="gallery.html">View Gallery</a>
                        </div>
                    </div>
                </div>
            </article>
        `).join('')}
        <div class="slide-controls">
            <div class="slide-dots">
                ${slides.map((_,i)=>`<button class="slide-dot ${i===0?'active':''}" data-slide-to="${i}" aria-label="Slide ${i+1}"></button>`).join('')}
            </div>
            <div class="slide-arrows">
                <button class="slide-arrow" data-slide-prev aria-label="Previous slide">←</button>
                <button class="slide-arrow" data-slide-next aria-label="Next slide">→</button>
            </div>
        </div>
    `;

    const slideEls=[...slider.querySelectorAll('.attraction-slide')];
    const dotEls=[...slider.querySelectorAll('.slide-dot')];
    let current=0, timer;

    function goTo(index,restart=true){
        current=(index+slides.length)%slides.length;
        slideEls.forEach((el,i)=>el.classList.toggle('active',i===current));
        dotEls.forEach((el,i)=>el.classList.toggle('active',i===current));
        if(restart) startTimer();
    }
    function startTimer(){
        clearInterval(timer);
        timer=setInterval(()=>goTo(current+1,false),6500);
    }
    slider.querySelector('[data-slide-next]')?.addEventListener('click',()=>goTo(current+1));
    slider.querySelector('[data-slide-prev]')?.addEventListener('click',()=>goTo(current-1));
    dotEls.forEach(dot=>dot.addEventListener('click',()=>goTo(Number(dot.dataset.slideTo))));
    slider.addEventListener('mouseenter',()=>clearInterval(timer));
    slider.addEventListener('mouseleave',startTimer);
    startTimer();
}

function init() {
    loadSiteData()
        .then(() => {
            renderNavigation();
            renderFooter();
            setupMenu();
            renderAttractionSlideshow();
            setupForms();
            renderDestinations();
            renderTours();
            renderTourDetail();
            renderGallery();
            renderVideoCards();
            renderTikTokFeature();
            fillBookingFromQuery();
        })
        .catch(error => {
            console.error(error);
            showToast("The website data could not be loaded. Check that you are running the project through a local server.");
        });
}

document.addEventListener("DOMContentLoaded", init);
