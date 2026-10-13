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




/*
document.addEventListener('DOMContentLoaded', () => {
    const punkt = document.getElementById('animationsPunkt');

    const KREIS_RADIUS = 20;
    
    if (punkt) {
        window.addEventListener('mousemove', (event) => {
            // 1. Bildschirm-Mitte und Gesamtmaße ermitteln
            const breite = window.innerWidth;
            const hoehe = window.innerHeight;
            const mitteX = breite / 2;
            const mitteY = hoehe / 2;

            // 2. Ermittle die aktuelle Position des Mauszeigers
            const mausX = event.clientX;
            const mausY = event.clientY;

            // Basis-Zentrum festlegen (relativ zur Bildschirmmitte, wo der Punkt CSS-technisch startet)
            let zentrumX = 0;
            let zentrumY = 0;

            // Absolute Bildschirm-Koordinaten des aktuellen Zentrums (für die Winkelberechnung)
            let zentrumAbsolutX = mitteX;
            let zentrumAbsolutY = mitteY;

            // 3. Logik für die oberen 30% und unteren 70%
            // Wir berechnen die Grenze: Wenn die Maus höher als 30% der Fensterhöhe ist

            if (mausY < hoehe * 0.30) {
                // Maus ist oben! Jetzt prüfen wir links oder rechts:
                if (mausX < mitteX) {
                    // Ecke oben links (nahe bei CRS)
                    zentrumX = -mitteX + 40;
                    zentrumY = -mitteY + 40;
                    zentrumAbsolutX = 40;
                    zentrumAbsolutY = 40;
                } else {
                    // Ecke oben rechts (nahe bei Menu)
                    zentrumX = mitteX - 40;
                    zentrumY = -mitteY + 40;
                    zentrumAbsolutX = breite - 40;
                    zentrumAbsolutY = 40;
                }
            } else {
                 // Maus ist in den unteren 70% -> Punkt geht exakt zurück in die Mitte (0, 0)
                zielX = 0;
                zielY = 0;
                zentrumAbsolutX = mitteX;
                zentrumAbsolutY = mitteY;
            }

            // 4. DIE MAGIE: Winkel von der aktuellen Position zur Maus berechnen
            const deltaX = mausX - zentrumAbsolutX;
            const deltaY = mausY - zentrumAbsolutY;
            
            // atan2 liefert den exakten Winkel im Bogenmaß
            const winkel = Math.atan2(deltaY, deltaX);

            // 5. Position auf der Kreisbahn berechnen (Trigonometrie: Cosinus & Sinus)
            const kreisVersatzX = Math.cos(winkel) * KREIS_RADIUS;
            const kreisVersatzY = Math.sin(winkel) * KREIS_RADIUS;

              // Finale Koordinaten: Zentrum + Position auf dem Kreis
            const finalX = zentrumX + kreisVersatzX;
            const finalY = zentrumY + kreisVersatzY;
            
            // 6. Position anwenden
            punkt.style.transform = "translate(calc(-50% + " + finalX + "px), calc(-50% + " + finalY + "px))";
        });
    }
});
*/
