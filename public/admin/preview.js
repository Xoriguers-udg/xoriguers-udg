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
  const llista = (entry, camp) => {
    const v = dada(entry, camp);
    return v && v.toJS ? v.toJS() : Array.isArray(v) ? v : [];
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

  const Inici = ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    return h('div', { className: 'previa' },
      h('section', { className: 'inici-hero' },
        h('div', { className: 'inici-hero-text' },
          h('h1', { className: 'display' }, dada(entry, 'titol')),
          h('span', { className: 'btn btn-accent' }, dada(entry, 'ctaText') || 'Vine a assajar')),
        foto && h('div', { className: 'inici-hero-foto' }, h('img', { src: foto, alt: '' }))),
      h('div', { className: 'pagina' },
        h('section', null,
          h('h2', { className: 'seccio' }, dada(entry, 'presentacioTitol') || 'Qui som'),
          h('div', { className: 'cos' }, widgetFor('body'))),
        h('section', null,
          h('h2', { className: 'seccio' }, dada(entry, 'properesTitol') || 'Pròximes actuacions'),
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

  const UneixTe = ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    const curs = dada(entry, 'curs');
    const cursJs = curs && curs.toJS ? curs.toJS() : null;
    const assajos = llista(entry, 'assajos');
    return h('div', { className: 'previa' },
      h(Banner, { titol: dada(entry, 'titol') || 'Uneix-te', foto }),
      !foto && nota(senseFoto),
      h('div', { className: 'pagina' },
        h('div', { className: 'cos' }, widgetFor('body')),
        cursJs && (cursJs.titol || cursJs.text) && h('section', { className: 'curs' },
          cursJs.titol && h('h2', { className: 'display' }, cursJs.titol),
          cursJs.text && h('p', null, cursJs.text),
          (cursJs.dades || []).length > 0 && h('dl', { className: 'dades' },
            cursJs.dades.map((d, i) => h('div', { className: 'dada', key: i },
              h('dt', { className: 'dada-etiqueta' }, d.etiqueta),
              h('dd', { className: 'dada-valor' }, d.valor))))),
        assajos.length > 0 && h('section', null,
          h('h2', { className: 'seccio' }, 'Assajos'),
          h('dl', { className: 'dades' },
            assajos.map((a, i) => h('div', { className: 'dada', key: i },
              h('dt', { className: 'dada-etiqueta' }, a.titol),
              h('dd', { className: 'dada-valor' }, a.text || '')))),
          nota('A la web, cada assaig porta el seu mapa a sota.'))));
  };

  const Xorimusics = ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    const partitures = llista(entry, 'partitures');
    return h('div', { className: 'previa' },
      h(Banner, { titol: dada(entry, 'titol') || 'Xorimúsics', foto }),
      !foto && nota(senseFoto),
      h('div', { className: 'pagina' },
        h('div', { className: 'cos' }, widgetFor('body')),
        h('section', null,
          h('h2', { className: 'seccio' }, 'Partitures'),
          partitures.length === 0
            ? nota('Encara no n’hi ha cap. Quan n’afegeixis una, la pàgina en mostrarà la llista.')
            : h('ul', { className: 'files' },
              partitures.map((p, i) => h('li', { className: 'partitura', key: i },
                h('span', { className: 'fila-titol' }, p.titol),
                p.instrument && h('span', { className: 'pill pill-blue' }, p.instrument),
                h('span', { className: 'fila-meta' }, p.fitxer ? 'Obre el PDF' : 'Falta el PDF')))))));
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
    return h('div', { className: 'previa' },
      h('div', { className: 'pagina' },
        h('div', { className: `fitxa${cartell ? ' amb-cartell' : ''}` },
          h('div', null,
            h('h1', { className: 'fitxa-titol display' }, dada(entry, 'nom')),
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
            h('div', { className: 'cos' }, widgetFor('body')),
            dada(entry, 'observacio') && h('p', { className: 'observacio' }, dada(entry, 'observacio'))),
          cartell && h('img', { className: 'cartell', src: cartell, alt: '' })),
        castells.length > 0 && h('section', { className: 'castells' },
          h('h2', null, 'Castells fets'),
          h('ul', { className: 'castells-row' },
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

  const Noticia = ({ entry, widgetFor, getAsset }) => {
    const foto = imatge(getAsset, dada(entry, 'imatge'));
    return h('div', { className: 'previa' },
      h('article', { className: 'pagina estreta' },
        h('h1', { className: 'fitxa-titol display' }, dada(entry, 'titol')),
        h('p', { className: 'fitxa-meta' },
          h('span', null, dataLlarga(dada(entry, 'data'))),
          dada(entry, 'estat') === 'esborrany' && h('span', { className: 'pill pill-neutral' }, 'Esborrany: no surt a la web')),
        dada(entry, 'resum') && h('p', { className: 'noticia-resum' }, dada(entry, 'resum')),
        foto && h('img', { className: 'noticia-img', src: foto, alt: '' }),
        h('div', { className: 'cos' }, widgetFor('body'))));
  };

  /* ---------- Galeria: src/pages/galeria/[id].astro ---------- */

  const Album = ({ entry, getAsset }) => {
    const fotos = llista(entry, 'fotos').map((f) => imatge(getAsset, f)).filter(Boolean);
    return h('div', { className: 'previa' },
      h('div', { className: 'pagina' },
        h('h1', { className: 'fitxa-titol display' }, dada(entry, 'nom')),
        h('p', { className: 'fitxa-meta' },
          h('span', null, dataLlarga(dada(entry, 'data'))),
          h('span', null, `${fotos.length} ${fotos.length === 1 ? 'fotografia' : 'fotografies'}`)),
        fotos.length === 0
          ? nota('Un àlbum surt a la Galeria quan té almenys una foto.')
          : h('ul', { className: 'photo-grid' },
            fotos.map((f, i) => h('li', { key: i }, h('img', { className: 'photo', src: f, alt: '' }))))));
  };

  const plantilles = {
    // folder collections
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
