const cursor = document.querySelector('.custom-cursor');
const canvas = document.getElementById('cursor-canvas');
const ctx = canvas.getContext('2d');

let currentRotation = 0;
let isHovering = false;
let mouseX = 0;
let mouseY = 0;

let idleTimer = null;
let isIdle = false;
let tendrils = [];
const IDLE_DELAY = 1000;

let colorTransition = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let isShrinking = false;
let isPaused = false;

// --- ZUSTANDSVARIABLEN FÜR MODUS A, B UND OFF ---
let currentAnimationMode = 'a'; // 'a' = Wurzeln, 'b' = Zeichnen, 'off' = Aus
let isDrawing = false;
let isSmoothing = false;
let smoothX = 0;
let smoothY = 0;
let drawPaths = [];
let currentPath = null;
let isFadingOutDrawing = false;
let drawingOpacity = 0.85;


class Tendril {
    constructor(x, y, angle, speed = 1.0) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.active = true;
        this.history = [{ x: this.x, y: this.y }];
        this.id = Math.random();
        this.parentId = null;
    }

    update() {
        if (isPaused) return;

        if (isShrinking) {
            this.active = false;

            for (let i = 0; i < 6; i++) {
                if (this.history.length > 0) {
                    this.history.pop();
                }
            }
            return;
        }

        if (!this.active) return;

        this.angle += (Math.random() - 0.5) * 0.08;

        const nextX = this.x + Math.cos(this.angle) * this.speed;
        const nextY = this.y + Math.sin(this.angle) * this.speed;

        let pathIsClear = true;

        if (this.history.length > 20) {
            for (let other of tendrils) {
                if (other === this || !other.active) continue;
                if (this.parentId && other.parentId === this.parentId) continue;
                if (other.id === this.parentId || this.id === other.parentId) continue;

                const dist = Math.hypot(nextX - other.x, nextY - other.y);
                if (dist < 5) {
                    pathIsClear = false;
                    break;
                }            
            }
        }

        if (pathIsClear) {
            this.x = nextX;
            this.y = nextY;
            this.history.push({ x: this.x, y: this.y });

            if (this.history.length > 30 && Math.random() < 0.008 && tendrils.length < 1200) {
                const branch1 = new Tendril(this.x, this.y, this.angle + 0.5);
                const branch2 = new Tendril(this.x, this.y, this.angle - 0.5);

                branch1.parentId = this.id;
                branch2.parentId = this.id;

                branch1.history = [...this.history];
                branch2.history = [...this.history];

                tendrils.push(branch1, branch2);
                this.active = false;
            }
        } else {
            this.active = false;
        }

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.active = false;            
        }
    }

    draw() {
        if (this.history.length < 2) return;
        ctx.beginPath();
        ctx.lineWidth = 1;

        const greenAndBlue = Math.round(255 * (1 - colorTransition));
        const opacity = 0.4 + (colorTransition * 0.2);

        ctx.strokeStyle = `rgba(255, ${greenAndBlue}, ${greenAndBlue}, ${opacity})`;

        ctx.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 1; i < this.history.length; i++) {
            ctx.lineTo(this.history[i].x, this.history[i].y);
        }
        ctx.stroke();
    }
}

function startGrowing() {
    isIdle = true;
    tendrils = [];

    const baseAngle = Math.random() * Math.PI;

    for (let i = 0; i < 5; i++) {
        const angle = baseAngle + (i * (2 * Math.PI / 5));
        
        const startX = mouseX + Math.cos(angle) * 2;
        const startY = mouseY + Math.sin(angle) * 2;
        
        tendrils.push(new Tendril(startX, startY, angle));        
    }
}

function stopGrowing() {
    isIdle = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tendrils = [];
}

function clearAllCanvas() {
    isIdle = false;
    isShrinking = false;
    tendrils = [];
    drawPaths = [];
    currentPath = null;
    isDrawing = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function fadeOutCanvasDrawing() {
    if (drawPaths.length === 0) return;
    isDrawing = false;
    currentPath = null;
    isFadingOutDrawing = true;
}

// --- MOUSE MOVE ---
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';

    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
    if (elementUnderCursor) {
        const tagName = elementUnderCursor.tagName.toLowerCase();
        const isInWorkGallery = elementUnderCursor.closest('.work-gallery');
        const isImage = tagName === 'img' || elementUnderCursor.closest('.gallery-item');
        const isBackground = (tagName === 'body' || tagName === 'html') && currentAnimationMode !== 'off';

        if (isBackground || (isInWorkGallery && !isImage)) {
            cursor.classList.remove('active-blend');
        } else {
            cursor.classList.add('active-blend');
        }
    }

    // Modus A: Wurzeln schrumpfen lassen
    if (currentAnimationMode === 'a') {
        isShrinking = true;
        isIdle = false;
        clearTimeout(idleTimer);
        idleTimer = null;
    }

    // Modus B: Auf Leinwand malen
    if (currentAnimationMode === 'b' && isDrawing && currentPath) {
        if (isSmoothing) {
            smoothX += (mouseX - smoothX) * 0.12;
            smoothY += (mouseY - smoothY) * 0.12;
            currentPath.push({ x: smoothX, y: smoothY });
        } else {
            smoothX = mouseX;
            smoothY = mouseY;
            currentPath.push({ x: mouseX, y: mouseY });
        }
    }
});

// --- HAUPTSCHLEIFE ---
function mainLoop() {
    const speed = isHovering ? 3.0 : 1.0;
    currentRotation += speed;
    cursor.style.setProperty('--cursor-rotation', currentRotation + 'deg');

    if (isHovering) {
        if (colorTransition < 1) colorTransition += 0.025;
        if (colorTransition > 1) colorTransition = 1;
    } else {
        if (colorTransition > 0) colorTransition -= 0.025;
        if (colorTransition < 0) colorTransition = 0;
    }

    // MODUS A: WURZEL-ANIMATION
    if (currentAnimationMode === 'a') {
        if ((isIdle || isShrinking || isPaused) && tendrils.length > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            tendrils.forEach(tendril => {
                tendril.update();
                tendril.draw();
            });

            if (!isPaused) {
                tendrils = tendrils.filter(t => t.history.length > 0);
            }
        }

        if (!isIdle && !isShrinking && tendrils.length === 0 && !idleTimer) {
            idleTimer = setTimeout(() => {
                if (currentAnimationMode === 'a') {
                    isShrinking = false;
                    startGrowing();
                }
                idleTimer = null;
            }, IDLE_DELAY);
        }

        if (isShrinking && tendrils.length === 0) {
            isShrinking = false;
            idleTimer = null;
        }
    }

    // MODUS B: LEINWAND ZEICHNEN
    if (currentAnimationMode === 'b') {
        if (isDrawing && isSmoothing && currentPath) {
            const dist = Math.hypot(mouseX - smoothX, mouseY - smoothY);
            if (dist > 0.5) {
                smoothX += (mouseX - smoothX) * 0.12;
                smoothY += (mouseY - smoothY) * 0.12;
                currentPath.push({ x: smoothX, y: smoothY });
            }
        }

        // Sanftes Ausblenden nach Drücken von X
        if (isFadingOutDrawing) {
            drawingOpacity -= 0.03; // Geschwindigkeit des Fades (kleiner = langsamer)
            if (drawingOpacity <= 0) {
                drawingOpacity = 0.85;
                isFadingOutDrawing = false;
                drawPaths = [];
                currentPath = null;
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgba(255, 255, 255, ${drawingOpacity})`;

        drawPaths.forEach(path => {
            if (path.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(path.x, path.y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
        });
    }

    requestAnimationFrame(mainLoop);
}

mainLoop();

// --- HOVER-ERKENNUNG FÜR CURSOR-STERN (INKL. NEUER BUTTONS) ---
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .filter, .filter-btn, .filter-opt, .anim-opt, [role="button"]')) {
        isHovering = true;
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .filter, .filter-btn, .filter-opt, .anim-opt, [role="button"]')) {
        isHovering = false;
    }
});

// --- KLICK-STEUERUNG ---
document.addEventListener('mousedown', (e) => {
    cursor.classList.add('clicked');

    if (currentAnimationMode === 'a') {
        isPaused = true;
    }

    if (currentAnimationMode === 'b') {
        if (e.target.closest('a, button, .filter, .filter-btn, .filter-opt, .anim-opt, .navigation, .brand, .work-gallery, [role="button"]')) {
            return;
        }

        if (!isDrawing) {
            isDrawing = true;
            smoothX = e.clientX;
            smoothY = e.clientY;
            currentPath = [{ x: smoothX, y: smoothY }];
            drawPaths.push(currentPath);
        } else {
            isDrawing = false;
            currentPath = null;
        }
    }
});

document.addEventListener('mouseup', () => {
    if (currentAnimationMode === 'a') {
        isPaused = false;
    }
    setTimeout(() => {
        cursor.classList.remove('clicked');
    }, 120); 
});

// --- TASTATUR 'G' (GLÄTTEN), 'X' (LÖSCHEN), 'S' (SPEICHERN) ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
        isSmoothing = true;
    }

    if (currentAnimationMode === 'b') {
        // X -> Leinwand sanft ausblenden
        if (e.key === 'x' || e.key === 'X') {
            fadeOutCanvasDrawing();
        }

        // S -> Zeichnung als PNG herunterladen
        if (e.key === 's' || e.key === 'S') {
            saveDrawingAsPNG();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'g' || e.key === 'G') {
        isSmoothing = false;
    }
});

// Hilfsfunktion: Erstellt ein PNG mit blauem Hintergrund (#0000FF) und weißer Linie
function saveDrawingAsPNG() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // 1. Blauen Hintergrund füllen (da dein body-Blau im CSS liegt und das echte Canvas transparent ist)
    tempCtx.fillStyle = '#0000FF';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 2. Deine gezeichneten Linien darüber kopieren
    tempCtx.drawImage(canvas, 0, 0);

    // 3. Download-Dialog im Browser auslösen
    const link = document.createElement('a');
    link.download = 'zeichnung.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}


// --- NAVIGATION OBEN ---
const crsButton = document.getElementById('crs-button');
const menuButton = document.getElementById('menu-button');
const menuDropdown = document.getElementById('menu-dropdown');

function handleCrsAction() {
    alert('CRS!');
}

function toggleMenu() {
    menuButton.classList.toggle('is-active');
    menuDropdown.classList.toggle('is-open');
}

if (crsButton) {
    crsButton.addEventListener('click', handleCrsAction);
    crsButton.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCrsAction();
        }
    });
}

if (menuButton) {
    menuButton.addEventListener('click', toggleMenu);
    menuButton.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleMenu();
        }
    });
}

/* SCHLIESSEN BEI KLICK AUSSERHALB MENU */
document.addEventListener('click', function(event) {
    const navigationContainer = document.querySelector('.navigation');
    
    if (menuDropdown && menuDropdown.classList.contains('is-open') && !navigationContainer.contains(event.target)) {
        menuButton.classList.remove('is-active');
        menuDropdown.classList.remove('is-open');
    }
});

/* UNTER-BUTTONS */
const subButtons = document.querySelectorAll('.sub-btn');

subButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        const buttonName = button.textContent.trim();
        handleSubButtonClick(buttonName);
    });

    button.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const buttonName = button.textContent.trim();
            handleSubButtonClick(buttonName);
        }
    });
});

function handleSubButtonClick(name) {
    menuButton.classList.remove('is-active');
    menuDropdown.classList.remove('is-open');

    const workGallery = document.getElementById('work-gallery');

    if (name === 'work') {
        if (workGallery.classList.contains('is-visible')) {
            document.body.classList.remove('work-open');
            workGallery.classList.add('is-closing');
            workGallery.classList.remove('is-visible');
            setTimeout(() => {
                workGallery.classList.remove('is-closing');
                if (!workGallery.classList.contains('is-visible')) {
                    resetAllFilters();
                }
            }, 450);
        } else {
            document.body.classList.add('work-open');
            workGallery.classList.remove('is-closing');
            resetAllFilters();
            workGallery.classList.remove('is-visible');
            void workGallery.offsetWidth; 
            workGallery.classList.add('is-visible');
        }
    } else if (name === 'blog') {
        alert('Blog!');
        resetAllFilters();
        workGallery.classList.remove('is-visible');
    } else if (name === 'contact') {
        alert('Contact!');
        resetAllFilters();
        workGallery.classList.remove('is-visible');
    } 
}

const galleryClose = document.getElementById('gallery-close');
const workGallery = document.getElementById('work-gallery');

if (galleryClose) {
    function closeWorkGallerySmoothly() {
        document.body.classList.remove('work-open');
        workGallery.classList.add('is-closing');
        workGallery.classList.remove('is-visible');

        setTimeout(() => {
            workGallery.classList.remove('is-closing');
            if (!workGallery.classList.contains('is-visible')) {
                resetAllFilters();
            }
        }, 450);
    }

    galleryClose.addEventListener('click', closeWorkGallerySmoothly);

    galleryClose.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            closeWorkGallerySmoothly();
        }
    });
}


// --- FILTER-MENU-STEUERUNG ---
const filterTrigger = document.getElementById('filter-button'); 
const filterMenuContainer = document.getElementById('filter-menu-container');
const filterOptions = document.querySelectorAll('.filter-opt');
const galleryItems = document.querySelectorAll('.gallery-item');

if (filterTrigger && filterMenuContainer) {
    filterTrigger.addEventListener('click', toggleFilterMenu);
    filterTrigger.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleFilterMenu();
        }
    });

    function toggleFilterMenu() {
        const isOpen = filterMenuContainer.classList.toggle('is-open');
        if (isOpen) {
            filterTrigger.textContent = 'filter:';
        } else {
            filterTrigger.textContent = 'filter';
        }
        checkActiveFilters();
    }

    filterOptions.forEach(function(opt) {
        opt.addEventListener('click', function(e) {
            e.stopPropagation(); 
            handleFilterSelection(opt);
        });

        opt.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleFilterSelection(opt);
            }
        });
    });
}

function handleFilterSelection(opt) {
    const groupType = opt.getAttribute('data-type'); 

    document.querySelectorAll('.filter-opt[data-type="' + groupType + '"]').forEach(function(item) {
        item.classList.remove('active');
    });

    opt.classList.add('active');

    applyMultiFilters();
    checkActiveFilters();
}

function applyMultiFilters() {
    const recencyEl = document.querySelector('.filter-opt.active[data-type="recency"]');
    const categoryEl = document.querySelector('.filter-opt.active[data-type="category"]');
    const authorEl = document.querySelector('.filter-opt.active[data-type="author"]');

    const activeRecency = recencyEl ? recencyEl.getAttribute('data-value') : 'all';
    const activeCategory = categoryEl ? categoryEl.getAttribute('data-value') : 'all';
    const activeAuthor = authorEl ? authorEl.getAttribute('data-value') : 'all';

    galleryItems.forEach(function(item) {
        const itemRecency = item.getAttribute('data-recency');
        const itemCategory = item.getAttribute('data-category');
        const itemAuthor = item.getAttribute('data-author');

        const matchRecency = (activeRecency === 'all' || itemRecency === activeRecency);
        const matchCategory = (activeCategory === 'all' || itemCategory === activeCategory);
        const matchAuthor = (activeAuthor === 'all' || itemAuthor === activeAuthor);

        if (matchRecency && matchCategory && matchAuthor) {
            item.classList.remove('hide');
            item.style.animation = 'none';
            void item.offsetWidth; 
            item.style.animation = null;
        } else {
            item.classList.add('hide');
        }
    });
}

function resetAllFilters() {
    filterOptions.forEach(function(opt) {
        opt.classList.remove('active');
    });

    const allPills = document.querySelectorAll('.filter-opt[data-value="all"]');
    allPills.forEach(function(allOpt) {
        allOpt.classList.add('active');
    });

    if (filterMenuContainer) {
        filterMenuContainer.classList.remove('is-open');
        filterMenuContainer.classList.remove('has-active-filters');
    }
    if (filterTrigger) {
        filterTrigger.textContent = 'filter';
    }

    applyMultiFilters();
}

function checkActiveFilters() {
    let hasActive = false;

    filterOptions.forEach(function(opt) {
        if (opt.classList.contains('active')) {
            const val = opt.getAttribute('data-value');
            if (val !== 'all') {
                hasActive = true;
            }
        }
    });

    const isMenuopen = filterMenuContainer.classList.contains('is-open');

    if (hasActive && !isMenuopen) {
        filterMenuContainer.classList.add('has-active-filters');
    } else {
        filterMenuContainer.classList.remove('has-active-filters');
    }
}

// --- ANIMATION-MENÜ-STEUERUNG UNTEN RECHTS ---
document.addEventListener('DOMContentLoaded', () => {
    const animTrigger = document.getElementById('animation-button');
    const animMenuContainer = document.getElementById('animation-menu-container');
    const animOptions = document.querySelectorAll('.anim-opt');
    const drawHint = document.getElementById('draw-hint');

    if (animTrigger && animMenuContainer) {
        animTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            animMenuContainer.classList.add('is-open');
        });

        animTrigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                animMenuContainer.classList.add('is-open');
            }
        });

        animOptions.forEach((opt) => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const clickedMode = opt.getAttribute('data-anim');

                if (clickedMode === currentAnimationMode) {
                    animMenuContainer.classList.remove('is-open');
                } else {
                    animOptions.forEach(item => item.classList.remove('active'));
                    opt.classList.add('active');

                    currentAnimationMode = clickedMode;
                    clearTimeout(idleTimer);
                    idleTimer = null;
                    clearAllCanvas();

                    if (drawHint) {
                        if (currentAnimationMode === 'b') {
                            drawHint.classList.add('is-visible');
                        } else {
                            drawHint.classList.remove('is-visible');
                        }
                    }

                    // Hintergrund-Diashow nur bei 'off' starten
                    if (currentAnimationMode === 'off') {
                        startBgSlideshow();
                    } else {
                        stopBgSlideshow();
                    }
                }
            });

            opt.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    opt.click();
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (animMenuContainer.classList.contains('is-open') && !animMenuContainer.contains(e.target)) {
                animMenuContainer.classList.remove('is-open');
            }
        });
    }
});

// --- HINTERGRUND-DIASHOW FÜR MODUS 'OFF' (MANUELLE AUSWAHL AUS HTML) ---
const bgSlideshow = document.getElementById('bg-slideshow');
let slideshowTimer = null;
let currentSlideIndex = 0;

function startBgSlideshow() {
    if (!bgSlideshow) return;
    
    // Liest nur die Bilder aus, die du selbst im HTML in #bg-slideshow eingetragen hast
    const slideElements = bgSlideshow.querySelectorAll('.bg-slide-img');
    if (slideElements.length === 0) return;

    bgSlideshow.classList.add('is-visible');

    clearInterval(slideshowTimer);

    // Alle 5 Sekunden (5000 ms) sanft zum nächsten Bild wechseln
    slideshowTimer = setInterval(() => {
        if (slideElements.length <= 1) return;

        slideElements[currentSlideIndex].classList.remove('is-active');
        currentSlideIndex = (currentSlideIndex + 1) % slideElements.length;
        slideElements[currentSlideIndex].classList.add('is-active');
    }, 5000);
}

function stopBgSlideshow() {
    if (!bgSlideshow) return;
    bgSlideshow.classList.remove('is-visible');
    clearInterval(slideshowTimer);
    slideshowTimer = null;
}
