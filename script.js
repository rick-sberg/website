const crsButton = document.getElementById('crs-button');
const menuButton = document.getElementById('menu-button');
const menuDropdown = document.getElementById('menu-dropdown');

// 2. Logik definieren (Ersetze die 'alerts' später durch deine echten Funktionen)
function handleCrsAction() {
    alert('CRS!');
    // Hier kannst du später Code einfügen, der z.B. eine andere Unterseite lädt
}

// 3. Die Funktion schreiben, die das Menü öffnet/schließt
function toggleMenu() {
    //Schaltet die rote Farbe für den MENU-Schriftzug an/aus
    menuButton.classList.toggle('is-active');

    //Schaltet die Sichtbarkeit (inkl. Rechteck und Buttons) an/aus
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
    
    if (menuDropdown.classList.contains('is-open') && !navigationContainer.contains(event.target)) {
        menuButton.classList.remove('is-active');
        menuDropdown.classList.remove('is-open');
    }
});

/* UNTER-BUTTONS */
// alle Elemente mit sub-btn + speichern in Liste subButtons
const subButtons = document.querySelectorAll('.sub-btn');

// Schleife, um jeden Button in der Liste anzusprechen
subButtons.forEach(function(button) {
    
    // normaler Maus-Klick
    button.addEventListener('click', function() {
        const buttonName = button.textContent.trim();
        handleSubButtonClick(buttonName);
    });

    // Barrierefreiheit
    button.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const buttonName = button.textContent.trim();
            handleSubButtonClick(buttonName);
        }
    });
});

//Funktion handleSubButtonClick(buttonName) egal welcher Button geklickt:
function handleSubButtonClick(name) {
    console.log("Untermenü-Button geklickt: " + name);
    
    // schließt MENU
    toggleMenu();

    const workGallery = document.getElementById('work-gallery');

    // Prüfen mit if/else welches Wort geklickt
    if (name === 'work') {
        // Falls die Galerie schon offen ist: Schließen
        if (workGallery.classList.contains('is-visible')) {
            workGallery.classList.remove('is-visible');
        } else {
            /* Trick: Wir entfernen die Klasse kurz und fügen sie neu hinzu, 
               damit der Browser die CSS-Animation sauber neu startet */
            workGallery.classList.remove('is-visible');
            void workGallery.offsetWidth; // Zwingt den Browser zum CSS-Reset
            workGallery.classList.add('is-visible');
        }
    } else if (name === 'blog') {
        alert('Blog!');
        workGallery.classList.remove('is-visible');
    } else if (name === 'contact') {
        alert('Contact!');
        workGallery.classList.remove('is-visible');
    } 
}

const galleryClose = document.getElementById('gallery-close');
const workGallery = document.getElementById('work-gallery');

if (galleryClose) {
    galleryClose.addEventListener('click', function() {
        workGallery.classList.remove('is-visible');
    });

    galleryClose.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            workGallery.classList.remove('is-visible');
        }
    });
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
