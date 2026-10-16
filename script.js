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
        }   else {
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

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';

    isShrinking = true;
    isIdle = false;

    clearTimeout(idleTimer);

    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
    if (elementUnderCursor) {
        const tagName = elementUnderCursor.tagName.toLowerCase();
        const isInWorkGallery = elementUnderCursor.closest('.work-gallery');
        const isImage = tagName === 'img' || elementUnderCursor.closest('.gallery-item');
        const isBackground = (tagName === 'body' || tagName === 'html');

        if (isBackground || (isInWorkGallery && !isImage)) {
            cursor.classList.remove('active-blend');
        } else {
            cursor.classList.add('active-blend');
        }
    }
});

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
            isShrinking = false;
            startGrowing();
            idleTimer = null;
        }, IDLE_DELAY);
    }

    if (isShrinking && tendrils.length === 0) {
        isShrinking = false;
        idleTimer = null;
    }
    
    requestAnimationFrame(mainLoop);
}

mainLoop();

const hoverElements = document.querySelectorAll('a, button, .filter, [role="button"]');
hoverElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        isHovering = true;
    });

    element.addEventListener('mouseleave', () => {
        isHovering = false;
    });
});

document.addEventListener('mousedown', () => {
  cursor.classList.add('clicked');
  isPaused = true;
});

document.addEventListener('mouseup', () => {
    isPaused = false;
    setTimeout(() => {
        cursor.classList.remove('clicked');
    }, 120); 
});

const crsButton = document.getElementById('crs-button');
const menuButton = document.getElementById('menu-button');
const menuDropdown = document.getElementById('menu-dropdown');

// 2. Logik definieren
function handleCrsAction() {
    alert('CRS!');
}

// 3. Die Funktion schreiben, die das Menü öffnet/schließt
function toggleMenu() {
    menuButton.classList.toggle('is-active');
    menuDropdown.classList.toggle('is-open');
}

// 4. Event-Listener für den Klick
crsButton.addEventListener('click', handleCrsAction);
menuButton.addEventListener('click', toggleMenu);

// 5. Event-Listener für die Tastatur (barrierefrei)
crsButton.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCrsAction();
    }
});

menuButton.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMenu();
    }
});

/* SCHLIESSEN BEI KLICK AUSSERHALB MENU*/
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
    console.log("Untermenü-Button geklickt: " + name);
    
    // Schließt das Hauptmenü
    menuButton.classList.remove('is-active');
    menuDropdown.classList.remove('is-open');

    const workGallery = document.getElementById('work-gallery');

    if (name === 'work') {
        if (workGallery.classList.contains('is-visible')) {
            resetAllFilters(); 
            workGallery.classList.remove('is-visible'); 
        } else {
            // Falls sie zu war, stellen wir sicher, dass sie sauber ohne Filter öffnet
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
    galleryClose.addEventListener('click', function() {
        resetAllFilters(); 
        workGallery.classList.remove('is-visible'); 
    });

    galleryClose.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            resetAllFilters();
            workGallery.classList.remove('is-visible');
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

// Setzt alle Auswahlen wieder auf die "all"-Standardwerte zurück
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
