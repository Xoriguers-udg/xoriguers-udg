/*
 * The CMS preview pane: each form shows, beside it, roughly what the page will
 * look like, drawn with the site's own CSS (admin/preview.css). Not a copy of
 * every page: the banner, the text, the photos and the castells, which is what
 * an editor changes. Parts the page computes from elsewhere (the next
 * actuacions, the best castells) get a short note instead.
 *
 * Loaded by src/pages/admin/index.astro before CMS.init(). Plain JS with Decap's
 * `h` (React.createElement), so it needs no build step.
 *
 * Template names follow Decap's rule: a folder collection is matched by its
 * name, a file in a files collection by the file's name.
 */
(() => {
  const BASE = (window.XORI_BASE || '/').replace(/\/$/, '');
  const h = window.h;

  // images: a new upload comes back from getAsset as a blob: URL; a stored one
  // as its public path, which on GitHub Pages needs the /xoriguers-udg prefix
  const imatge = (getAsset, cami) => {
    if (!cami) return null;
    const asset = getAsset(cami);
    const url = asset ? String(asset) : cami;
    return url.startsWith('/images/') ? BASE + url : url;
  };
  const dada = (entry, ...cami) => entry.getIn(['data', ...cami]);
  // always an array: a field saved in some other shape (an older version of
  // the form) must not take the whole preview down with it
  const llista = (entry, camp) => {
    const v = dada(entry, camp);
    const js = v && v.toJS ? v.toJS() : v;
    return Array.isArray(js) ? js : [];
  };
  const dataLlarga = (v) => {
    if (!v) return '';
    const d = v instanceof Date ? v : new Date(`${String(v).slice(0, 10)}T12:00:00`);
    return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  };
  const nota = (text) => h('p', { className: 'previa-nota' }, text);

  const Banner = ({ titol, foto }) =>
    h('header', { className: 'page-hero' },
      h('div', { className: `page-hero-inner${foto ? ' amb-foto' : ''}` },
        h('div', { className: 'page-hero-text' }, h('h1', { className: 'page-hero-title display' }, titol)),
        foto && h('div', { className: 'page-hero-photo' }, h('img', { src: foto, alt: '' }))));

  const senseFoto = 'Sense foto pròpia, la capçalera fa servir la de «Configuració».';

  /* ---------- Pàgines ---------- */

  // a plain page: the banner over its text
  const pagina = (titolPerDefecte) => ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    return h('div', { className: 'previa' },
      h(Banner, { titol: dada(entry, 'titol') || titolPerDefecte, foto }),
      !foto && nota(senseFoto),
      h('div', { className: 'pagina' }, h('div', { className: 'cos' }, widgetFor('body'))));
  };

  // the homepage's sections, as «Seccions de la portada» lists them
  // (src/lib/portada.ts): rows of section, checkbox and heading, in order
  const SECCIONS = [
    ['presentacio', 'Qui som'], ['properes', 'Pròximes actuacions'], ['ultimsCastells', 'Últims castells'],
    ['activitats', 'Activitats'], ['uneix', 'Uneix-te'], ['noticies', 'Notícies'],
    ['album', 'Últim àlbum'], ['instagram', 'Instagram'],
  ];
  const clauDe = (v) => (SECCIONS.find(([clau, nom]) => v === clau || v === nom) || [])[0];

  const Inici = ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    const files = llista(entry, 'seccions').filter((f) => clauDe(f.seccio));
    const fila = (clau) => files.find((f) => clauDe(f.seccio) === clau);
    const amagada = (f) => f.amaga === true || f.mostra === false;
    const mostra = (clau) => (files.length ? !!fila(clau) && !amagada(fila(clau)) : true);
    const titol = (clau, perDefecte) => (fila(clau) && fila(clau).titol) || perDefecte;
    const visibles = files.filter((f) => !amagada(f)).map((f) => f.seccio);
    const amagades = SECCIONS.filter(([clau]) => !mostra(clau)).map(([, nom]) => nom);
    return h('div', { className: 'previa' },
      files.length > 0 && nota(`Ordre de la portada: ${visibles.join(', ')}.`),
      amagades.length > 0 && nota(`Amagades: ${amagades.join(', ')}.`),
      h('section', { className: 'inici-hero' },
        h('div', { className: 'inici-hero-text' },
          h('h1', { className: 'display' }, dada(entry, 'titol')),
          h('div', { className: 'previa-botons' },
            h('span', { className: 'btn btn-accent' }, dada(entry, 'ctaText') || 'Vine a assajar'),
            h('span', { className: 'btn btn-outline previa-boto-fosc' }, dada(entry, 'boto2Text') || 'Veure agenda'))),
        foto && h('div', { className: 'inici-hero-foto' }, h('img', { src: foto, alt: '' }))),
      h('div', { className: 'pagina' },
        mostra('presentacio') && h('section', null,
          h('h2', { className: 'seccio' }, titol('presentacio', 'Qui som')),
          h('div', { className: 'cos' }, widgetFor('body'))),
        mostra('properes') && h('section', null,
          h('h2', { className: 'seccio' }, titol('properes', 'Pròximes actuacions')),
          nota('Aquí surten les pròximes actuacions de l’Agenda.'))));
  };

  const LaColla = ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    const colla = imatge(getAsset, dada(entry, 'fotoColla'));
    return h('div', { className: 'previa' },
      h(Banner, { titol: dada(entry, 'titol') || 'La colla', foto }),
      h('div', { className: 'pagina' }, h('div', { className: 'cos colla-primer' }, widgetFor('body'))),
      colla && h('img', { className: 'colla-foto', src: colla, alt: '' }),
      h('div', { className: 'pagina' },
        h('div', { className: 'cos colla-resta' }, widgetFor('body')),
        nota('A sota surten «Els nostres millors castells», calculats de l’Agenda, i els horaris d’assaig d’Uneix-te.')));
  };

  // the page's own markup and classes (src/pages/uneix-te.astro), drawn by its
  // own stylesheet (src/styles/pagines/uneix-te.css)
  const UneixTe = ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    const curs = dada(entry, 'curs');
    const cursJs = curs && curs.toJS ? curs.toJS() : null;
    const dades = (cursJs && Array.isArray(cursJs.dades) ? cursJs.dades : []);
    const assajos = llista(entry, 'assajos');
    return h('div', { className: 'previa' },
      h(Banner, { titol: dada(entry, 'titol') || 'Uneix-te', foto }),
      !foto && nota(senseFoto),
      h('div', { className: 'pagina pg-uneix-te' },
        h('div', { className: 'obertura' },
          h('div', { className: 'pagina-intro lead' }, widgetFor('body')),
          cursJs && (cursJs.titol || cursJs.text || dades.length > 0) && h('section', { className: 'curs' },
            cursJs.titol && h('h2', { className: 'curs-titol' }, cursJs.titol),
            cursJs.text && h('p', { className: 'curs-text' }, cursJs.text),
            dades.length > 0 && h('dl', { className: 'curs-dades' },
              dades.map((d, i) => h('div', { className: 'curs-dada', key: i }, h('dt', null, d.etiqueta), h('dd', null, d.valor)))))),
        assajos.length > 0 && h('div', { className: 'assajos-grid' },
          assajos.map((a, i) => h('section', { className: 'assaig', key: i },
            h('div', { className: 'assaig-text' },
              h('h2', { className: 'assaig-titol' }, a.titol),
              a.text && h('p', null, a.text))))),
        assajos.length > 0 && nota('A la web, cada assaig porta el seu mapa a sota.')));
  };

  // the page's own markup and classes (src/pages/xorimusics.astro), drawn by
  // its own stylesheet (src/styles/pagines/xorimusics.css)
  const Xorimusics = ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    const partitures = llista(entry, 'partitures');
    return h('div', { className: 'previa' },
      h(Banner, { titol: dada(entry, 'titol') || 'Xorimúsics', foto }),
      !foto && nota(senseFoto),
      h('div', { className: 'pagina pg-xorimusics' },
        h('div', { className: 'obertura' }, h('div', { className: 'pagina-intro lead' }, widgetFor('body'))),
        partitures.length === 0
          ? nota('Encara no hi ha cap partitura. Quan n’afegeixis una, la pàgina en mostrarà la llista.')
          : h('section', { className: 'partitures' },
            h('h2', null, 'Partitures'),
            h('p', { className: 'partitures-intro' }, 'Els tocs que fem a les diades, per estudiar-los a casa.'),
            h('ul', { className: 'files' },
              partitures.map((p, i) => h('li', { key: i },
                h('span', { className: 'fila partitura' },
                  h('svg', { className: 'partitura-icona', width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, 'aria-hidden': true },
                    h('path', { d: 'M9 18V5l11-2v13' }), h('circle', { cx: 6, cy: 18, r: 3 }), h('circle', { cx: 17, cy: 16, r: 3 })),
                  h('span', { className: 'fila-titol' }, p.titol),
                  p.instrument && h('span', { className: 'pill pill-blue' }, p.instrument),
                  h('span', { className: 'fila-meta partitura-obre' }, p.fitxer ? 'Obre el PDF' : 'Falta el PDF'))))))));
  };

  const IntroColaboradors = ({ widgetFor }) =>
    h('div', { className: 'previa' },
      h(Banner, { titol: 'Col·laboradors' }),
      h('div', { className: 'pagina' },
        h('div', { className: 'cos' }, widgetFor('body')),
        nota('Aquest text només surt quan hi ha algun patrocinador, a sobre dels logotips.')));

  /* ---------- Capçaleres de les llistes ---------- */

  const capcalera = (titol, que) => ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    return h('div', { className: 'previa' },
      h(Banner, { titol: dada(entry, 'titol') || titol, foto }),
      !foto && nota(senseFoto),
      h('div', { className: 'pagina' },
        h('div', { className: 'cos' }, widgetFor('body')),
        nota(`A sota surt ${que}.`)));
  };

  /* ---------- Agenda: src/pages/agenda/[id].astro ---------- */

  const estats = {
    descarregat: ['pill-moss', 'Descarregat'],
    carregat: ['pill-gold', 'Carregat'],
    intent: ['pill-neutral', 'Intent'],
  };
  const tipus = { Actuacio: 'Actuació' };

  const Agenda = ({ entry, widgetFor, getAsset }) => {
    const cartell = imatge(getAsset, dada(entry, 'cartell'));
    const lloc = [dada(entry, 'lloc'), dada(entry, 'poblacio')].filter(Boolean).join(', ');
    const colles = llista(entry, 'collesParticipants');
    const castells = llista(entry, 'castells');
    const ambFotos = castells.some((c) => c.foto);
    // the same rule as src/lib/fitxa.ts: only an entry with something beyond its
    // row gets a page; the rest are a row in the agenda or the historial
    const omplert = (v) => typeof v === 'string' && v.trim() !== '';
    const teFitxa = omplert(dada(entry, 'body')) || !!cartell || colles.some(omplert) || castells.some((c) => omplert(c.foto));
    return h('div', { className: 'previa' },
      !teFitxa && nota('Ara surt com una fila a l’agenda o a l’historial, amb el nom, la data, el lloc i els castells. Tindrà pàgina pròpia quan hi afegeixis una foto d’un castell, un cartell, un text o les colles participants.'),
      // the page's own markup and classes (src/pages/agenda/[id].astro), drawn
      // by its own stylesheet (src/styles/pagines/fitxa.css)
      h('div', { className: 'pagina pg-fitxa' },
        h('div', { className: `fitxa${cartell ? ' amb-cartell' : ''}` },
          h('div', { className: 'fitxa-cos' },
            h('h1', { className: 'fitxa-titol' }, dada(entry, 'nom')),
            h('div', { className: 'fitxa-meta' },
              h('span', null, dataLlarga(dada(entry, 'data'))),
              dada(entry, 'hora') && h('span', null, dada(entry, 'hora')),
              lloc && h('span', null, lloc)),
            h('div', { className: 'etiquetes' },
              dada(entry, 'tipus') && h('span', { className: 'pill pill-blue' }, tipus[dada(entry, 'tipus')] || dada(entry, 'tipus')),
              dada(entry, 'cancelada') && h('span', { className: 'pill pill-danger' }, 'Cancel·lada'),
              dada(entry, 'estat') === 'esborrany' && h('span', { className: 'pill pill-neutral' }, 'Esborrany: no surt a la web')),
            colles.length > 0 && h('div', { className: 'chips' },
              h('span', { className: 'chips-etiqueta' }, 'Colles'),
              colles.map((c, i) => h('span', { className: 'chip', key: i }, c))),
            h('div', { className: 'body' }, widgetFor('body')),
            dada(entry, 'observacio') && h('p', { className: 'observacio' }, dada(entry, 'observacio'))),
          cartell && h('img', { className: 'cartell', src: cartell, alt: '' })),
        castells.length > 0 && h('section', { className: 'castells' },
          h('div', { className: 'castells-cap' },
            h('h2', null, 'Castells fets'),
            h('span', { className: 'compte' }, `${castells.length} ${castells.length === 1 ? 'castell' : 'castells'}`)),
          h('ul', { className: `castells-row${ambFotos ? ' amb-fotos' : ''}` },
            castells.map((c, i) => {
              const foto = imatge(getAsset, c.foto);
              const [classe, text] = estats[c.estat] || ['pill-neutral', c.estat || '—'];
              return h('li', { className: 'castell', key: i },
                foto ? h('img', { className: 'castell-foto', src: foto, alt: '' })
                  : ambFotos && h('span', { className: 'castell-marc' }),
                h('span', { className: 'notation display' }, c.castell || '…'),
                h('span', { className: 'castell-peu' },
                  h('span', { className: `pill ${classe}` }, text),
                  c.ronda && h('span', { className: 'ronda' }, `Ronda ${c.ronda}`)));
            })))));
  };

  /* ---------- Notícies: src/pages/noticies/[id].astro ---------- */

  // the page's own markup and classes (src/pages/noticies/[id].astro), drawn by
  // its own stylesheet (src/styles/pagines/noticia.css)
  const Noticia = ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    return h('div', { className: 'previa' },
      h('article', { className: 'pagina estreta pg-noticia' },
        h('h1', { className: 'fitxa-titol' }, dada(entry, 'titol')),
        h('p', { className: 'fitxa-meta' },
          h('span', null, dataLlarga(dada(entry, 'data'))),
          dada(entry, 'estat') === 'esborrany' && h('span', { className: 'pill pill-neutral' }, 'Esborrany: no surt a la web')),
        dada(entry, 'resum') && nota(`Resum, a la llista i a la portada: ${dada(entry, 'resum')}`),
        foto && h('img', { className: 'hero-img', src: foto, alt: '' }),
        h('div', { className: 'body' }, widgetFor('body'))));
  };

  /* ---------- Galeria: src/pages/galeria/[id].astro ---------- */

  // the page's own markup and classes (src/pages/galeria/[id].astro), drawn by
  // its own stylesheet (src/styles/pagines/album.css)
  const Album = ({ entry, getAsset }) => {
    const fotos = llista(entry, 'fotos').map((f) => imatge(getAsset, f)).filter(Boolean);
    return h('div', { className: 'previa' },
      h('div', { className: 'pagina pg-album' },
        h('h1', { className: 'fitxa-titol' }, dada(entry, 'nom')),
        h('p', { className: 'fitxa-meta' },
          h('span', null, dataLlarga(dada(entry, 'data'))),
          h('span', null, `${fotos.length} ${fotos.length === 1 ? 'fotografia' : 'fotografies'}`)),
        fotos.length === 0
          ? nota('Un àlbum surt a la Galeria quan té almenys una foto.')
          : h('ul', { className: 'photo-grid' },
            fotos.map((f, i) => h('li', { key: i }, h('img', { className: 'photo', src: f, alt: '' }))))));
  };

  /* ---------- Pàgines noves: src/components/Blocs.astro ---------- */

  // drawn with the site's own blocs.css; the parts the page looks up elsewhere
  // (an album's photos, the documents) get a note instead
  const PaginaNova = ({ entry, widgetsFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    const llistaBlocs = widgetsFor('blocs');
    const blocs = [];
    if (llistaBlocs && llistaBlocs.forEach) {
      llistaBlocs.forEach((b, i) => {
        const d = b && b.get && b.get('data');
        const w = b && b.get && b.get('widgets');
        if (!d || !d.get) return;
        const camp = (nom) => d.get(nom);
        const text = () => w && w.get && w.get('text');
        switch (camp('type')) {
          case 'text':
            blocs.push(h('div', { className: 'bloc-text', key: i }, text()));
            break;
          case 'foto': {
            const src = imatge(getAsset, camp('imatge'));
            if (src) blocs.push(h('figure', { className: `bloc-foto${camp('ample') ? ' ample' : ''}`, key: i },
              h('img', { src, alt: '' }), camp('peu') && h('figcaption', null, camp('peu'))));
            break;
          }
          case 'fotoText': {
            const src = imatge(getAsset, camp('imatge'));
            blocs.push(h('div', { className: `bloc-foto-text ${camp('costat') === 'dreta' ? 'dreta' : 'esquerra'}`, key: i },
              src ? h('img', { src, alt: '' }) : nota('Falta la foto.'), h('div', { className: 'bloc-text' }, text())));
            break;
          }
          case 'boto':
            if (camp('text')) blocs.push(h('p', { className: 'bloc-boto', key: i }, h('span', { className: 'btn btn-accent' }, camp('text'))));
            break;
          case 'mapa':
            if (camp('ubicacio')) blocs.push(h('section', { className: 'bloc-mapa', key: i },
              camp('titol') && h('h2', null, camp('titol')),
              h('iframe', { src: `https://www.google.com/maps?q=${encodeURIComponent(camp('ubicacio'))}&output=embed`, title: 'Mapa', style: { width: '100%', aspectRatio: '16 / 9', border: 0 } })));
            break;
          case 'album':
            blocs.push(h('div', { key: i }, nota(camp('album') ? `Aquí surten les primeres fotos de l’àlbum triat.` : 'Tria un àlbum.')));
            break;
          case 'documents':
            blocs.push(h('section', { className: 'bloc-documents', key: i },
              camp('titol') && h('h2', null, camp('titol')),
              nota(camp('categoria') ? `Aquí surten els documents de la categoria «${camp('categoria')}».` : 'Aquí surten tots els documents.')));
            break;
        }
      });
    }
    return h('div', { className: 'previa' },
      h(Banner, { titol: dada(entry, 'titol') || 'Pàgina nova', foto }),
      dada(entry, 'estat') === 'esborrany' && nota('Esborrany: encara no surt a la web.'),
      h('div', { className: 'pagina' },
        blocs.length ? h('div', { className: 'blocs' }, blocs) : nota('Afegeix-hi blocs a «Blocs».')));
  };

  const plantilles = {
    // folder collections
    pagines_noves: PaginaNova,
    agenda: Agenda,
    noticies: Noticia,
    galeria: Album,
    // Pàgines
    inici: Inici,
    la_colla: LaColla,
    uneix_te: UneixTe,
    xorimusics: Xorimusics,
    mallarengues: pagina('Mallarengues'),
    merchandising: pagina('Botiga'),
    col_laboradors: pagina('Contacta’ns'),
    col_laboradors_intro: IntroColaboradors,
    // Capçaleres de les llistes
    capcalera_agenda: capcalera('Agenda', 'la llista de les pròximes actuacions'),
    capcalera_castells: capcalera('Historial de castells', 'l’historial, temporada per temporada'),
    capcalera_galeria: capcalera('Galeria', 'la llista d’àlbums'),
    capcalera_noticies: capcalera('Notícies', 'la llista de notícies'),
    capcalera_documents: capcalera('Documents', 'la llista de documents'),
    junta_directiva_capcalera: capcalera('Junta directiva', 'la junta de la temporada'),
    junta_tecnica_capcalera: capcalera('Junta tècnica', 'la junta de la temporada'),
  };
  for (const [nom, plantilla] of Object.entries(plantilles)) CMS.registerPreviewTemplate(nom, plantilla);

  CMS.registerPreviewStyle(`${BASE}/admin/preview.css`);
  CMS.registerPreviewStyle('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Figtree:wght@400;500;600;700&display=swap');
})();
