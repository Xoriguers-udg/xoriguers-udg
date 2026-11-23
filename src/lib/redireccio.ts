/**
 * The page left at the address of an agenda entry that has no page of its own
 * (src/lib/fitxa.ts): it sends the visitor straight on to the entry's row.
 * Astro.redirect would do the same, but waits two seconds on a page in English,
 * and an .astro page here would carry the entry page's whole stylesheet along.
 */
const escapa = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function paginaRedireccio(desti: string, canonica: string): string {
  const a = escapa(desti);
  return `<!doctype html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Xoriguers de la UdG</title>
<meta http-equiv="refresh" content="0;url=${a}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${escapa(canonica)}">
</head>
<body><p><a href="${a}">Continua a la web dels Xoriguers</a></p></body>
</html>
`;
}
