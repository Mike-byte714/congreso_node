/**
 * ============================================================
 * TESCo 2026 — Congreso Internacional de Ingeniería Industrial
 * Archivo principal de JavaScript
 * ============================================================
 *
 * Funcionalidades:
 *  1.  Carrusel Hero con autoplay y soporte táctil
 *  2.  Cuenta regresiva hacia el evento
 *  3.  Mapa interactivo con Leaflet
 *  4.  Modo oscuro con persistencia
 *  5.  Menú hamburguesa móvil
 *  6.  Selector de idioma
 *  7.  Desplazamiento suave (smooth scroll)
 *  8.  Encabezado fijo (sticky header)
 *  9.  Modales de ponentes
 * 10.  Galería lightbox
 * 11.  Animaciones al hacer scroll
 * 12.  Validación de formularios
 * 13.  Animación de contadores
 *
 * Todos los comentarios están en español.
 * Escrito en ES6+ — sin dependencias externas (excepto Leaflet).
 */

'use strict';

/* ==========================================================
   1. CARRUSEL — Sección Hero
   ========================================================== */

/**
 * Inicializa el carrusel de la sección Hero.
 * Soporta navegación por flechas, indicadores (dots),
 * autoplay con pausa al pasar el cursor y gestos táctiles.
 */
const initCarousel = () => {
  const track      = document.querySelector('.carousel-track');
  const slides     = document.querySelectorAll('.carousel-slide');
  const prevBtn    = document.querySelector('.carousel-prev');
  const nextBtn    = document.querySelector('.carousel-next');
  const dotsWrap   = document.querySelector('.carousel-dots');

  // Si no hay carrusel en la página, salir
  if (!track || slides.length === 0) return;

  let currentIndex  = 0;
  let autoPlayTimer = null;
  const INTERVAL    = 5000; // Milisegundos entre diapositivas

  // — Variables para soporte táctil —
  let touchStartX = 0;
  let touchEndX   = 0;
  const SWIPE_THRESHOLD = 50; // Píxeles mínimos para considerar un deslizamiento

  /* ---------- Funciones principales ---------- */

  /**
   * Muestra la diapositiva en la posición indicada.
   * @param {number} index — Índice de la diapositiva (base 0).
   */
  const goToSlide = (index) => {
    // Normalizar índice para permitir ciclo infinito
    if (index < 0)               index = slides.length - 1;
    if (index >= slides.length)  index = 0;

    // Desactivar diapositiva y dot actuales
    slides.forEach((slide) => slide.classList.remove('active'));
    if (dotsWrap) {
      dotsWrap.querySelectorAll('.dot').forEach((d) => d.classList.remove('active'));
    }

    // Activar la nueva diapositiva
    slides[index].classList.add('active');
    if (dotsWrap && dotsWrap.children[index]) {
      dotsWrap.children[index].classList.add('active');
    }

    currentIndex = index;
  };

  /** Avanza a la siguiente diapositiva. */
  const nextSlide = () => goToSlide(currentIndex + 1);

  /** Retrocede a la diapositiva anterior. */
  const prevSlide = () => goToSlide(currentIndex - 1);

  /** Inicia la reproducción automática. */
  const startAutoPlay = () => {
    stopAutoPlay(); // Evitar temporizadores duplicados
    autoPlayTimer = setInterval(nextSlide, INTERVAL);
  };

  /** Detiene la reproducción automática. */
  const stopAutoPlay = () => {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  };

  /* ---------- Crear indicadores (dots) ---------- */
  if (dotsWrap) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('dot');
      dot.setAttribute('aria-label', `Ir a diapositiva ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        goToSlide(i);
        startAutoPlay(); // Reiniciar temporizador tras interacción
      });
      dotsWrap.appendChild(dot);
    });
  }

  /* ---------- Eventos de navegación ---------- */
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoPlay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoPlay(); });

  /* ---------- Pausa / reanudación al pasar el cursor ---------- */
  track.addEventListener('mouseenter', stopAutoPlay);
  track.addEventListener('mouseleave', startAutoPlay);

  /* ---------- Soporte táctil (swipe) ---------- */
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoPlay();
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        nextSlide(); // Deslizar a la izquierda → siguiente
      } else {
        prevSlide(); // Deslizar a la derecha → anterior
      }
    }
    startAutoPlay();
  }, { passive: true });

  /* ---------- Navegación con teclado ---------- */
  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { prevSlide(); startAutoPlay(); }
    if (e.key === 'ArrowRight') { nextSlide(); startAutoPlay(); }
  });

  /* ---------- Estado inicial ---------- */
  goToSlide(0);
  startAutoPlay();
};


/* ==========================================================
   2. CUENTA REGRESIVA
   ========================================================== */

/**
 * Inicializa la cuenta regresiva hacia el inicio del congreso.
 * Zona horaria: America/Mexico_City (UTC-6 estándar / UTC-5 horario de verano).
 * Fecha objetivo: 4 de noviembre de 2026, 09:00:00.
 */
const initCountdown = () => {
  const daysEl    = document.getElementById('countdown-days');
  const hoursEl   = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');

  // Si no existen los elementos, salir
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  // Fecha objetivo en zona horaria de la Ciudad de México
  // Noviembre es mes 10 (base 0 = 10, pero usamos cadena ISO)
  // UTC-6 estándar para noviembre (sin horario de verano)
  const TARGET_DATE = new Date('2026-11-04T09:00:00-06:00');

  /**
   * Formatea un número a dos dígitos con cero inicial.
   * @param {number} n
   * @returns {string}
   */
  const pad = (n) => String(n).padStart(2, '0');

  /** Actualiza los elementos de la cuenta regresiva. */
  const updateCountdown = () => {
    const now  = new Date();
    const diff = TARGET_DATE - now;

    // Si el evento ya comenzó
    if (diff <= 0) {
      daysEl.textContent    = '00';
      hoursEl.textContent   = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';

      // Mostrar mensaje de evento iniciado
      const container = daysEl.closest('.countdown') || daysEl.parentElement?.parentElement;
      if (container) {
        container.innerHTML = `
          <p class="countdown-ended">
            🎉 ¡El congreso ha iniciado! / The congress has started! / 大会已开始！
          </p>`;
      }

      clearInterval(countdownTimer);
      return;
    }

    // Calcular días, horas, minutos y segundos restantes
    const totalSeconds = Math.floor(diff / 1000);
    const days         = Math.floor(totalSeconds / 86400);
    const hours        = Math.floor((totalSeconds % 86400) / 3600);
    const minutes      = Math.floor((totalSeconds % 3600) / 60);
    const seconds      = totalSeconds % 60;

    daysEl.textContent    = pad(days);
    hoursEl.textContent   = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  };

  // Ejecutar inmediatamente y luego cada segundo
  updateCountdown();
  const countdownTimer = setInterval(updateCountdown, 1000);
};


/* ==========================================================
   3. MAPA INTERACTIVO (Leaflet)
   ========================================================== */

/**
 * Inicializa un mapa interactivo con Leaflet.
 * Muestra marcadores circulares personalizados para los países
 * representados en el congreso.
 */
const initMap = () => {
  const mapContainer = document.getElementById('map');
  if (!mapContainer || typeof L === 'undefined') return;

  // Crear instancia del mapa centrada en la Ciudad de México
  const map = L.map('map', {
    center:         [19.4326, -99.1332],
    zoom:           2,
    scrollWheelZoom: false, // Evitar zoom accidental al hacer scroll
    zoomControl:    true,
  });

  // Capa de tiles de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  // Lista de países participantes con coordenadas
  const countries = [
    { name: 'México',     lat: 19.43,   lng: -99.13  },
    { name: 'EE. UU.',    lat: 38.90,   lng: -77.03  },
    { name: 'España',     lat: 40.41,   lng: -3.70   },
    { name: 'Brasil',     lat: -15.79,  lng: -47.88  },
    { name: 'Colombia',   lat: 4.71,    lng: -74.07  },
    { name: 'Argentina',  lat: -34.60,  lng: -58.38  },
    { name: 'Chile',      lat: -33.44,  lng: -70.65  },
    { name: 'China',      lat: 39.90,   lng: 116.40  },
    { name: 'Japón',      lat: 35.68,   lng: 139.69  },
    { name: 'Alemania',   lat: 52.52,   lng: 13.40   },
  ];

  // Estilo del marcador circular turquesa
  const markerStyle = {
    radius:      8,
    fillColor:   '#0f766e',
    color:       '#065f56',
    weight:      2,
    opacity:     1,
    fillOpacity: 0.85,
  };

  // Agregar marcadores al mapa
  countries.forEach(({ name, lat, lng }) => {
    L.circleMarker([lat, lng], markerStyle)
      .addTo(map)
      .bindPopup(`<strong>${name}</strong>`);
  });

  // Invalidar tamaño cuando el contenedor se hace visible
  // (útil si el mapa está en una pestaña oculta)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        map.invalidateSize();
      }
    });
  });
  observer.observe(mapContainer);
};


/* ==========================================================
   4. MODO OSCURO
   ========================================================== */

/**
 * Inicializa la funcionalidad de modo oscuro.
 * Guarda la preferencia del usuario en localStorage.
 * Alterna el ícono entre luna (fa-moon) y sol (fa-sun).
 */
const initDarkMode = () => {
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (!toggleBtn) return;

  const STORAGE_KEY = 'theme';
  const htmlEl      = document.documentElement;

  /**
   * Aplica el tema indicado y actualiza el ícono.
   * @param {'dark'|'light'} theme
   */
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      htmlEl.setAttribute('data-theme', 'dark');
    } else {
      htmlEl.removeAttribute('data-theme');
    }

    // Actualizar ícono del botón
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.classList.remove('fa-moon', 'fa-sun');
      icon.classList.add(theme === 'dark' ? 'fa-sun' : 'fa-moon');
    }

    // Actualizar aria-label para accesibilidad
    toggleBtn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
    );
  };

  // Cargar preferencia guardada o detectar preferencia del sistema
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // Respetar preferencia del sistema operativo
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  // Alternar tema al hacer clic
  toggleBtn.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme     = currentTheme === 'dark' ? 'light' : 'dark';

    applyTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  });

  // Escuchar cambios en la preferencia del sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
};


/* ==========================================================
   5. MENÚ HAMBURGUESA MÓVIL
   ========================================================== */

/**
 * Inicializa el menú de navegación responsivo.
 * Abre/cierra el menú con el botón hamburguesa,
 * y lo cierra al hacer clic en un enlace o fuera del menú.
 */
const initMobileMenu = () => {
  const toggleBtn = document.getElementById('menu-toggle') || document.querySelector('.hamburger');
  const navMenu   = document.querySelector('.nav-menu');

  if (!toggleBtn || !navMenu) return;

  /** Abre o cierra el menú. */
  const toggleMenu = () => {
    navMenu.classList.toggle('nav-active');
    toggleBtn.classList.toggle('active');

    // Actualizar atributo aria para accesibilidad
    const isOpen = navMenu.classList.contains('nav-active');
    toggleBtn.setAttribute('aria-expanded', isOpen);

    // Bloquear scroll del body cuando el menú está abierto
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  /** Cierra el menú si está abierto. */
  const closeMenu = () => {
    navMenu.classList.remove('nav-active');
    toggleBtn.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  // Evento del botón hamburguesa
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Cerrar al hacer clic en un enlace de navegación
  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Cerrar al hacer clic fuera del menú
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      closeMenu();
    }
  });

  // Cerrar al presionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Cerrar al redimensionar la ventana a escritorio
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
  });
};


/* ==========================================================
   6. SELECTOR DE IDIOMA (Dropdown toggle)
   ========================================================== */

/**
 * Inicializa el dropdown de idioma.
 * Los links <a> dentro del dropdown navegan directamente al
 * LangController.php — no se necesita JS para cambiar idioma.
 * Solo manejamos abrir/cerrar el menú con clic.
 */
const initLanguageSwitcher = () => {
  const dropdownBtn = document.querySelector('.lang-dropdown-btn');
  const dropdownContent = document.querySelector('.lang-dropdown-content');

  if (!dropdownBtn || !dropdownContent) return;

  // Abrir/cerrar al hacer clic en el botón
  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdownContent.classList.toggle('open');
    dropdownBtn.setAttribute('aria-expanded', isOpen);
  });

  // Cerrar si se hace clic fuera del dropdown
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-dropdown')) {
      dropdownContent.classList.remove('open');
      dropdownBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Cerrar al seleccionar un idioma (el link navegará normalmente)
  dropdownContent.querySelectorAll('.lang-btn').forEach((link) => {
    link.addEventListener('click', () => {
      dropdownContent.classList.remove('open');
    });
  });
};


/* ==========================================================
   7. DESPLAZAMIENTO SUAVE (Smooth Scroll)
   ========================================================== */

/**
 * Habilita desplazamiento suave para todos los enlaces
 * ancla internos (href que comienzan con #).
 * Incluye un desplazamiento (offset) para compensar
 * el encabezado fijo.
 */
const initSmoothScroll = () => {
  const HEADER_OFFSET = 80; // Altura del header fijo en píxeles

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');

      // Ignorar enlaces vacíos o solo "#"
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const targetPosition = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

      window.scrollTo({
        top:      targetPosition,
        behavior: 'smooth',
      });

      // Actualizar el hash en la URL sin causar salto
      history.pushState(null, '', href);
    });
  });
};


/* ==========================================================
   8. ENCABEZADO FIJO (Sticky Header)
   ========================================================== */

/**
 * Agrega la clase .scrolled al header cuando el usuario
 * ha desplazado la página más de 100px, permitiendo
 * cambios de estilo (sombra, fondo, etc.) vía CSS.
 */
const initStickyHeader = () => {
  const header         = document.querySelector('header');
  if (!header) return;

  const SCROLL_THRESHOLD = 100;
  let ticking = false;

  /** Verifica la posición de scroll y actualiza la clase. */
  const handleScroll = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    ticking = false;
  };

  // Usar requestAnimationFrame para optimizar rendimiento
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });

  // Verificar estado inicial (por si la página carga a mitad)
  handleScroll();
};


/* ==========================================================
   9. MODALES DE PONENTES
   ========================================================== */

/**
 * Inicializa los modales para mostrar biografías de ponentes.
 * Se abren al hacer clic en .speaker-bio-btn y se cierran
 * con el botón .modal-close, clic fuera del modal o tecla Escape.
 */
const initSpeakerModals = () => {
  const bioButtons = document.querySelectorAll('.speaker-bio-btn');
  if (bioButtons.length === 0) return;

  // Verificar si existe un modal genérico; si no, crear uno
  let modal        = document.querySelector('.modal');
  let modalContent = null;

  if (!modal) {
    modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" aria-label="Cerrar modal">&times;</button>
        <div class="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modalContent = modal.querySelector('.modal-content');
  const modalBody  = modal.querySelector('.modal-body');
  const closeBtn   = modal.querySelector('.modal-close');

  /**
   * Abre el modal con la información del ponente.
   * @param {HTMLElement} button — Botón que activó el modal.
   */
  const openModal = (button) => {
    // Obtener datos del ponente desde atributos data-*
    const name        = button.dataset.name        || 'Ponente';
    const institution = button.dataset.institution  || '';
    const bio         = button.dataset.bio          || 'Información no disponible.';
    const photo       = button.dataset.photo        || '';

    // Construir contenido del modal
    let html = '';
    if (photo) {
      html += `<img src="${photo}" alt="${name}" class="modal-speaker-photo" loading="lazy">`;
    }
    html += `<h3 class="modal-speaker-name">${name}</h3>`;
    if (institution) {
      html += `<p class="modal-speaker-institution">${institution}</p>`;
    }
    html += `<p class="modal-speaker-bio">${bio}</p>`;

    if (modalBody) modalBody.innerHTML = html;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Enfocar el botón de cierre para accesibilidad
    if (closeBtn) closeBtn.focus();
  };

  /** Cierra el modal. */
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Eventos para abrir el modal
  bioButtons.forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn));
  });

  // Cerrar con botón X
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Cerrar al hacer clic fuera del contenido
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
};


/* ==========================================================
   10. GALERÍA LIGHTBOX
   ========================================================== */

/**
 * Inicializa una galería lightbox simple.
 * Al hacer clic en una imagen de la galería se muestra
 * una versión ampliada con navegación entre imágenes.
 */
const initGallery = () => {
  const galleryImages = document.querySelectorAll('.gallery img, .gallery-grid img');
  if (galleryImages.length === 0) return;

  let currentImageIndex = 0;

  // Crear el overlay del lightbox
  const lightbox = document.createElement('div');
  lightbox.classList.add('lightbox-overlay');
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="Cerrar galería">&times;</button>
    <button class="lightbox-prev" aria-label="Imagen anterior">&#10094;</button>
    <img class="lightbox-image" src="" alt="Imagen ampliada">
    <button class="lightbox-next" aria-label="Imagen siguiente">&#10095;</button>
    <span class="lightbox-counter"></span>
  `;
  document.body.appendChild(lightbox);

  const lbImage   = lightbox.querySelector('.lightbox-image');
  const lbClose   = lightbox.querySelector('.lightbox-close');
  const lbPrev    = lightbox.querySelector('.lightbox-prev');
  const lbNext    = lightbox.querySelector('.lightbox-next');
  const lbCounter = lightbox.querySelector('.lightbox-counter');

  /**
   * Abre el lightbox con la imagen indicada.
   * @param {number} index — Índice de la imagen.
   */
  const openLightbox = (index) => {
    if (index < 0) index = galleryImages.length - 1;
    if (index >= galleryImages.length) index = 0;

    currentImageIndex = index;
    const img = galleryImages[index];

    // Usar data-full si existe, de lo contrario usar src
    lbImage.src = img.dataset.full || img.src;
    lbImage.alt = img.alt || `Imagen ${index + 1}`;
    lbCounter.textContent = `${index + 1} / ${galleryImages.length}`;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  /** Cierra el lightbox. */
  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lbImage.src = '';
  };

  // Abrir lightbox al hacer clic en una imagen
  galleryImages.forEach((img, i) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => openLightbox(i));
  });

  // Navegación dentro del lightbox
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => openLightbox(currentImageIndex - 1));
  lbNext.addEventListener('click', () => openLightbox(currentImageIndex + 1));

  // Cerrar al hacer clic fuera de la imagen
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Navegación con teclado
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    switch (e.key) {
      case 'Escape':     closeLightbox(); break;
      case 'ArrowLeft':  openLightbox(currentImageIndex - 1); break;
      case 'ArrowRight': openLightbox(currentImageIndex + 1); break;
    }
  });

  // Soporte táctil para el lightbox
  let lbTouchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    lbTouchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const diff = lbTouchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        openLightbox(currentImageIndex + 1);
      } else {
        openLightbox(currentImageIndex - 1);
      }
    }
  }, { passive: true });
};


/* ==========================================================
   11. ANIMACIONES AL HACER SCROLL
   ========================================================== */

/**
 * Usa IntersectionObserver para activar animaciones
 * cuando los elementos con la clase .animate-on-scroll
 * entran al viewport (20% de visibilidad).
 */
const initScrollAnimations = () => {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  if (animatedElements.length === 0) return;

  // Configuración del observador
  const observerOptions = {
    root:       null,        // Viewport del navegador
    rootMargin: '0px',
    threshold:  0.2,         // 20% del elemento visible
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        obs.unobserve(entry.target); // Solo animar una vez
      }
    });
  }, observerOptions);

  // Observar cada elemento
  animatedElements.forEach((el) => observer.observe(el));
};


/* ==========================================================
   12. VALIDACIÓN DE FORMULARIOS
   ========================================================== */

/**
 * Inicializa la validación del lado del cliente para formularios.
 * Valida campos requeridos, formato de correo electrónico,
 * coincidencia de contraseñas, tipo y tamaño de archivos.
 */
const initFormValidation = () => {
  const forms = document.querySelectorAll('form[data-validate]');
  if (forms.length === 0) return;

  // Tamaño máximo de archivo en bytes (10 MB)
  const MAX_FILE_SIZE    = 10 * 1024 * 1024;
  const ALLOWED_FILE_EXT = ['.pdf'];

  /**
   * Expresión regular para validar correo electrónico.
   * Sigue el estándar RFC 5322 de manera simplificada.
   */
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  /**
   * Muestra un mensaje de error debajo del campo.
   * @param {HTMLElement} field — Campo del formulario.
   * @param {string} message — Mensaje de error.
   */
  const showError = (field, message) => {
    clearError(field);
    field.classList.add('input-error');

    const errorEl = document.createElement('span');
    errorEl.classList.add('error-message');
    errorEl.textContent = message;

    // Insertar el mensaje después del campo
    field.parentNode.insertBefore(errorEl, field.nextSibling);
  };

  /**
   * Limpia el mensaje de error de un campo.
   * @param {HTMLElement} field — Campo del formulario.
   */
  const clearError = (field) => {
    field.classList.remove('input-error');
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) existingError.remove();
  };

  /**
   * Valida un campo individual.
   * @param {HTMLElement} field — Campo a validar.
   * @returns {boolean} — true si el campo es válido.
   */
  const validateField = (field) => {
    const value = field.value.trim();
    const type  = field.type;
    const name  = field.name;

    // — Campo requerido —
    if (field.hasAttribute('required') && !value && type !== 'file') {
      showError(field, 'Este campo es obligatorio.');
      return false;
    }

    // — Validar correo electrónico —
    if (type === 'email' && value && !EMAIL_REGEX.test(value)) {
      showError(field, 'Ingrese un correo electrónico válido.');
      return false;
    }

    // — Validar coincidencia de contraseñas —
    if (name === 'confirm_password' || name === 'password_confirm') {
      const form     = field.closest('form');
      const password = form?.querySelector('input[name="password"]');
      if (password && value !== password.value) {
        showError(field, 'Las contraseñas no coinciden.');
        return false;
      }
    }

    // — Validar archivo —
    if (type === 'file' && field.files.length > 0) {
      const file = field.files[0];

      // Verificar extensión
      const fileName = file.name.toLowerCase();
      const hasValidExt = ALLOWED_FILE_EXT.some((ext) => fileName.endsWith(ext));
      if (!hasValidExt) {
        showError(field, `Solo se permiten archivos: ${ALLOWED_FILE_EXT.join(', ')}`);
        return false;
      }

      // Verificar tamaño
      if (file.size > MAX_FILE_SIZE) {
        const maxMB = MAX_FILE_SIZE / (1024 * 1024);
        showError(field, `El archivo no debe superar ${maxMB} MB.`);
        return false;
      }
    }

    // — Validar longitud mínima —
    const minLength = field.getAttribute('minlength');
    if (minLength && value.length < parseInt(minLength, 10)) {
      showError(field, `Mínimo ${minLength} caracteres.`);
      return false;
    }

    clearError(field);
    return true;
  };

  // Aplicar validación a cada formulario
  forms.forEach((form) => {
    const fields = form.querySelectorAll('input, select, textarea');

    // Validar en tiempo real al perder el foco
    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        // Limpiar error al empezar a escribir
        if (field.classList.contains('input-error')) {
          validateField(field);
        }
      });
    });

    // Validar al enviar el formulario
    form.addEventListener('submit', (e) => {
      let isValid = true;

      fields.forEach((field) => {
        if (!validateField(field)) {
          isValid = false;
        }
      });

      if (!isValid) {
        e.preventDefault();

        // Desplazar al primer error
        const firstError = form.querySelector('.input-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
      }
    });
  });
};


/* ==========================================================
   13. ANIMACIÓN DE CONTADORES (Sección de estadísticas)
   ========================================================== */

/**
 * Anima contadores numéricos de 0 al valor objetivo.
 * Se activa cuando la sección de estadísticas entra en el viewport.
 * Usa data-target para definir el valor final.
 * Duración de la animación: 2 segundos.
 */
const initCounterAnimation = () => {
  const counters = document.querySelectorAll('[data-target]');
  if (counters.length === 0) return;

  const ANIMATION_DURATION = 2000; // 2 segundos en milisegundos

  /**
   * Anima un contador individual.
   * @param {HTMLElement} counter — Elemento del contador.
   */
  const animateCounter = (counter) => {
    const target    = parseInt(counter.dataset.target, 10);
    if (isNaN(target)) return;

    const startTime = performance.now();
    const startVal  = 0;

    /**
     * Función de easing (ease-out quad) para animación más natural.
     * @param {number} t — Progreso normalizado (0 a 1).
     * @returns {number}
     */
    const easeOutQuad = (t) => t * (2 - t);

    /** Actualiza el valor del contador en cada frame. */
    const updateCounter = (currentTime) => {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedVal = easeOutQuad(progress);
      const current  = Math.floor(startVal + (target - startVal) * easedVal);

      // Formatear número con separadores de miles
      counter.textContent = current.toLocaleString('es-MX');

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        // Asegurar que el valor final sea exacto
        counter.textContent = target.toLocaleString('es-MX');
      }
    };

    requestAnimationFrame(updateCounter);
  };

  // Observar cuando los contadores entran al viewport
  const observerOptions = {
    root:       null,
    rootMargin: '0px',
    threshold:  0.2,
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target); // Animar solo una vez
      }
    });
  }, observerOptions);

  counters.forEach((counter) => observer.observe(counter));
};


/* ==========================================================
   14. UTILIDADES ADICIONALES
   ========================================================== */

/**
 * Muestra notificaciones tipo toast.
 * @param {string} message — Mensaje a mostrar.
 * @param {'success'|'error'|'info'|'warning'} type — Tipo de notificación.
 * @param {number} duration — Duración en milisegundos (por defecto 4000).
 */
const showToast = (message, type = 'info', duration = 4000) => {
  // Crear contenedor de toasts si no existe
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.classList.add('toast-container');
    document.body.appendChild(container);
  }

  // Crear el toast
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  toast.textContent = message;
  container.appendChild(toast);

  // Animar entrada
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  // Eliminar tras la duración
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
};

/**
 * Función de debounce para optimizar eventos frecuentes.
 * @param {Function} func — Función a ejecutar.
 * @param {number} wait — Tiempo de espera en milisegundos.
 * @returns {Function}
 */
const debounce = (func, wait = 100) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

/**
 * Función de throttle para limitar la frecuencia de ejecución.
 * @param {Function} func — Función a ejecutar.
 * @param {number} limit — Intervalo mínimo en milisegundos.
 * @returns {Function}
 */
const throttle = (func, limit = 100) => {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
};


/* ==========================================================
   15. BOTÓN "VOLVER ARRIBA"
   ========================================================== */

/**
 * Inicializa un botón de "volver arriba" que aparece
 * cuando el usuario ha desplazado la página hacia abajo.
 */
const initBackToTop = () => {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  const SHOW_THRESHOLD = 300; // Mostrar después de 300px de scroll

  // Mostrar/ocultar botón según la posición de scroll
  const toggleVisibility = () => {
    if (window.scrollY > SHOW_THRESHOLD) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', throttle(toggleVisibility, 150), { passive: true });

  // Desplazar al inicio al hacer clic
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Verificar estado inicial
  toggleVisibility();
};


/* ==========================================================
   16. PRECARGA DE IMÁGENES Y LAZY LOADING
   ========================================================== */

/**
 * Implementa lazy loading nativo con fallback para
 * navegadores que no soportan loading="lazy".
 */
const initLazyLoading = () => {
  // Verificar soporte nativo
  if ('loading' in HTMLImageElement.prototype) {
    // El navegador soporta lazy loading nativo
    document.querySelectorAll('img[data-src]').forEach((img) => {
      img.src     = img.dataset.src;
      img.loading = 'lazy';
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    });
    return;
  }

  // Fallback con IntersectionObserver
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (lazyImages.length === 0) return;

  const imageObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.removeAttribute('data-src');
        obs.unobserve(img);
      }
    });
  }, {
    rootMargin: '100px', // Cargar 100px antes de que sea visible
  });

  lazyImages.forEach((img) => imageObserver.observe(img));
};


/* ==========================================================
   17. INDICADOR DE PROGRESO DE LECTURA
   ========================================================== */

/**
 * Muestra una barra de progreso en la parte superior
 * de la página que indica cuánto ha desplazado el usuario.
 */
const initReadingProgress = () => {
  const progressBar = document.querySelector('.reading-progress');
  if (!progressBar) return;

  const updateProgress = () => {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
  };

  window.addEventListener('scroll', () => {
    requestAnimationFrame(updateProgress);
  }, { passive: true });

  updateProgress();
};


/* ==========================================================
   18. ACCESIBILIDAD — NAVEGACIÓN CON TECLADO
   ========================================================== */

/**
 * Mejora la navegación con teclado añadiendo
 * un indicador visual de foco solo cuando se usa
 * el teclado (no el ratón).
 */
const initAccessibility = () => {
  let usingKeyboard = false;

  // Detectar uso de teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      usingKeyboard = true;
      document.body.classList.add('keyboard-nav');
    }
  });

  // Detectar uso de ratón
  document.addEventListener('mousedown', () => {
    usingKeyboard = false;
    document.body.classList.remove('keyboard-nav');
  });

  // Agregar skip-to-content si no existe
  if (!document.querySelector('.skip-to-content')) {
    const skipLink = document.createElement('a');
    skipLink.classList.add('skip-to-content');
    skipLink.href      = '#main-content';
    skipLink.textContent = 'Saltar al contenido principal';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
};


/* ==========================================================
   19. INICIALIZACIÓN GENERAL
   ========================================================== */

/**
 * Punto de entrada principal.
 * Inicializa todos los módulos dentro de DOMContentLoaded.
 * Cada inicialización está envuelta en try/catch para evitar
 * que un error en un módulo detenga la ejecución de los demás.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Lista de funciones de inicialización con sus nombres descriptivos
  const modules = [
    { name: 'Carrusel Hero',              init: initCarousel         },
    { name: 'Cuenta Regresiva',           init: initCountdown        },
    { name: 'Mapa Interactivo',           init: initMap              },
    { name: 'Modo Oscuro',               init: initDarkMode         },
    { name: 'Menú Móvil',                init: initMobileMenu       },
    { name: 'Selector de Idioma',         init: initLanguageSwitcher },
    { name: 'Desplazamiento Suave',       init: initSmoothScroll     },
    { name: 'Encabezado Fijo',            init: initStickyHeader     },
    { name: 'Modales de Ponentes',        init: initSpeakerModals    },
    { name: 'Galería Lightbox',           init: initGallery          },
    { name: 'Animaciones de Scroll',      init: initScrollAnimations },
    { name: 'Validación de Formularios',  init: initFormValidation   },
    { name: 'Animación de Contadores',    init: initCounterAnimation },
    { name: 'Botón Volver Arriba',        init: initBackToTop        },
    { name: 'Carga Diferida de Imágenes', init: initLazyLoading      },
    { name: 'Progreso de Lectura',        init: initReadingProgress  },
    { name: 'Accesibilidad',             init: initAccessibility    },
  ];

  // Inicializar cada módulo de forma segura
  modules.forEach(({ name, init }) => {
    try {
      init();
    } catch (error) {
      console.error(`[TESCo 2026] Error al inicializar "${name}":`, error);
    }
  });

  // Mensaje de confirmación en la consola
  console.log(
    '%c✅ TESCo 2026 — Todos los módulos inicializados correctamente.',
    'color: #0f766e; font-weight: bold; font-size: 14px;'
  );
});
