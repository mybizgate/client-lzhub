import type { ProductArt } from '../types/product'

/**
 * Generates an illustrative SVG packshot (data URI) for products without a photo.
 * Ported from the original static site so the catalogue keeps its look.
 */
const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

function motif(kind: string): string {
  const motifs: Record<string, string> = {
    chili:
      '<path d="M89 137q8 5 5 12-4 30-39 37 25-19 24-36-2-8 10-13" fill="#be3627"/><path d="M86 139q-4-14 8-14" fill="none" stroke="#316b43" stroke-width="4"/><path d="M107 157q-5-7-10-2-21 16-20 35 8-17 23-21 10-2 7-12" fill="#e45433"/>',
    spice:
      '<ellipse cx="91" cy="174" rx="40" ry="12" fill="#b67b28"/><path d="M53 173q37-52 78 0z" fill="#edb13e"/><path d="M66 164q19-20 37-14" fill="none" stroke="#f5c96b" stroke-width="3"/><path d="M111 144q19-27 28-18-1 20-28 18" fill="#477e3b"/>',
    rice: Array.from({ length: 17 }, (_, i) => `<ellipse cx="${60 + ((i * 17) % 65)}" cy="${141 + Math.floor(i / 5) * 11}" rx="3" ry="8" fill="#f4e7c1" stroke="#d6bf8a" stroke-width=".5" transform="rotate(${i % 2 ? 30 : -25} ${60 + ((i * 17) % 65)} ${141 + Math.floor(i / 5) * 11})"/>`).join(''),
    coconut:
      '<ellipse cx="83" cy="165" rx="29" ry="24" fill="#795239" transform="rotate(-17 83 165)"/><ellipse cx="83" cy="158" rx="27" ry="20" fill="#fffdf0" transform="rotate(-17 83 158)"/><ellipse cx="83" cy="158" rx="17" ry="12" fill="#dddcc7"/><path d="M104 148q14-23 32-14-12 13-29 18" fill="#2f774c"/>',
    wheat:
      '<path d="M83 188l9-53M103 187l12-49" stroke="#a67a35" stroke-width="2"/>' +
      Array.from({ length: 5 }, (_, i) => `<ellipse cx="${88 - i * 2}" cy="${143 + i * 8}" rx="4" ry="7" fill="#d6b864" transform="rotate(-45 ${88 - i * 2} ${143 + i * 8})"/><ellipse cx="${97 - i * 2}" cy="${139 + i * 8}" rx="4" ry="7" fill="#e8c97b" transform="rotate(30 ${97 - i * 2} ${139 + i * 8})"/>`).join(''),
    leaf: '<path d="M90 178q-34-43-7-47 22 17 7 47" fill="#366b36"/><path d="M91 172q2-48 31-33-3 25-31 33" fill="#638c45"/><path d="M88 184q8-32 26-41" fill="none" stroke="#d7cf8c" stroke-width="2"/>',
    sugar:
      '<path d="m58 168 18-8 15 7-17 10z" fill="#fff"/><path d="m58 168 16 9v15l-16-8z" fill="#deded5"/><path d="m74 177 17-10v17l-17 8z" fill="#eeeede"/><path d="m91 151 16-8 17 7-17 10z" fill="#fff"/><path d="m91 151 16 9v16l-16-8z" fill="#dadbd3"/><path d="m107 160 17-10v17l-17 9z" fill="#eeeeea"/>',
    soy: '<ellipse cx="88" cy="174" rx="33" ry="12" fill="#45281c"/><ellipse cx="88" cy="169" rx="32" ry="10" fill="#a57a45"/><ellipse cx="88" cy="168" rx="26" ry="7" fill="#291c12"/><ellipse cx="111" cy="145" rx="10" ry="7" fill="#d4bf80"/><ellipse cx="126" cy="151" rx="9" ry="6" fill="#e1cf98"/>',
    pepper: Array.from({ length: 16 }, (_, i) => `<circle cx="${60 + ((i * 17) % 65)}" cy="${147 + Math.floor(i / 5) * 11}" r="5" fill="${i % 2 ? '#3d3c2c' : '#575641'}"/><circle cx="${58 + ((i * 17) % 65)}" cy="${145 + Math.floor(i / 5) * 11}" r="1.3" fill="#9b9471"/>`).join(''),
    noodle: Array.from({ length: 12 }, (_, i) => `<path d="M${62 + i * 5} 137q-5 22 4 47" stroke="${i % 2 ? '#efd793' : '#d9b65d'}" fill="none" stroke-width="3"/>`).join(''),
    beans: Array.from({ length: 13 }, (_, i) => `<ellipse cx="${61 + ((i * 19) % 65)}" cy="${146 + Math.floor(i / 5) * 14}" rx="7" ry="5" fill="${i % 2 ? '#b88645' : '#d6a95b'}" transform="rotate(${i * 15} ${61 + ((i * 19) % 65)} ${146 + Math.floor(i / 5) * 14})"/>`).join(''),
    fish: '<path d="M57 161q27-25 53 0-26 28-53 0l-13-15v29z" fill="#69959a"/><circle cx="101" cy="158" r="2" fill="#233f41"/><path d="M90 149q-7 12 0 23" fill="none" stroke="#466e76" stroke-width="2"/>',
    onion: '<path d="M62 176q-16-38 8-34 18 19 3 38M79 176q-5-50 15-33 10 13 0 35M102 177q-10-35 13-34 14 21 0 35" fill="none" stroke="#c19443" stroke-width="7"/>',
  }
  return motifs[kind] ?? motifs.spice!
}

const cache = new Map<string, string>()

export function packshotDataUri(art: ProductArt | undefined, name: string, size: string, brand: string): string {
  const a: ProductArt = art ?? { shape: 'pouch', color: '#27775d', motif: 'spice', label: name }
  const c = /^#[0-9a-f]{6}$/i.test(a.color) ? a.color : '#27775d'
  const key = [a.label, a.shape, c, size, a.motif, brand].join('|')
  const hit = cache.get(key)
  if (hit) return hit

  const shape = a.shape || 'pouch'
  let outer = ''
  let labelY = 75
  let labelH = 133
  if (shape === 'bottle') {
    outer = `<rect x="75" y="22" width="36" height="23" rx="4" fill="${c}"/><rect x="78" y="42" width="30" height="24" rx="4" fill="#dacb9c"/><path d="M77 62Q46 76 49 106v116q0 15 15 15h61q15 0 15-15V106q2-30-31-44z" fill="url(#body)" stroke="#0002"/><path d="M58 100v114" stroke="#fff" stroke-opacity=".2" stroke-width="7"/>`
    labelY = 99
    labelH = 105
  } else if (shape === 'jug') {
    outer = `<rect x="64" y="21" width="43" height="21" rx="5" fill="#d09621"/><path d="M65 42h48q9 0 14 16l23 43v117q0 18-19 18H54q-17 0-17-18V83q0-28 28-41z" fill="url(#body)" stroke="#b8802633"/><path d="M112 63q25 16 28 51h-19q-3-22-16-28z" fill="#fff" fill-opacity=".65"/><path d="M48 103v109" stroke="#fff" stroke-opacity=".28" stroke-width="7"/>`
    labelY = 113
    labelH = 98
  } else if (shape === 'carton') {
    outer = `<path d="M49 53l18-29h62l13 29v181H49z" fill="#f8f4e4" stroke="#0002"/><path d="M49 53h93v181H49z" fill="url(#body)"/><path d="M128 52l14 1v181l-14-10z" fill="#0002"/><path d="M49 53l18-29v29z" fill="#d9d9c9"/><path d="M67 24h62v29H67z" fill="${c}"/><rect x="109" y="32" width="13" height="8" rx="4" fill="#fff"/>`
  } else if (shape === 'can') {
    outer = `<rect x="44" y="68" width="105" height="153" rx="9" fill="url(#body)"/><ellipse cx="96" cy="68" rx="53" ry="10" fill="#c6c9c5" stroke="#777a7033"/><ellipse cx="96" cy="67" rx="47" ry="7" fill="#e2e3dd"/><ellipse cx="96" cy="66" rx="10" ry="3" fill="none" stroke="#8b8e85" stroke-width="2"/><path d="M44 216q52 14 105 0" stroke="#bbc0b6" stroke-width="6" fill="none"/>`
    labelY = 83
    labelH = 122
  } else if (shape === 'jar') {
    outer = `<rect x="47" y="38" width="101" height="25" rx="7" fill="${c}"/><rect x="48" y="60" width="99" height="172" rx="19" fill="url(#body)" stroke="#0002"/><path d="M59 72v128" stroke="#fff" stroke-width="7" stroke-opacity=".18"/>`
    labelY = 86
    labelH = 122
  } else {
    const wide = shape === 'rice' ? 12 : shape === 'packet' ? 6 : 0
    outer = `<path d="M${49 - wide} 33h${98 + wide * 2}l-5 23 9 155-8 23H${42 - wide}l-7-23L${45 - wide} 56z" fill="url(#body)" stroke="#0002"/><path d="M${49 - wide} 33h${98 + wide * 2}v13H${49 - wide}zM${43 - wide} 222h${99 + wide * 2}v11H${43 - wide}z" fill="${c}"/><path d="M${48 - wide} 55l-7 152 12 15M139 54l7 152-8 14" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>`
  }
  const text = esc(a.label || name || 'PRODUK')
  const words = text.split(' ')
  const split = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]!] : [text]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="264" viewBox="0 0 190 260"><defs><linearGradient id="body"><stop stop-color="${c}"/><stop offset=".23" stop-color="${c}"/><stop offset=".55" stop-color="#fff2c5" stop-opacity="${shape === 'jug' ? '.8' : '.95'}"/><stop offset="1" stop-color="${c}"/></linearGradient><filter id="shadow" x="-40%" y="-20%" width="190%" height="170%"><feDropShadow dx="5" dy="9" stdDeviation="5" flood-color="#283b28" flood-opacity=".18"/></filter></defs><ellipse cx="99" cy="243" rx="64" ry="8" fill="#173622" opacity=".08"/><g filter="url(#shadow)">${outer}<rect x="53" y="${labelY}" width="85" height="${labelH}" rx="3" fill="#fffbea"/><path d="M53 ${labelY + 24}h85v-24H53z" fill="${c}"/><text x="95" y="${labelY + 15}" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="${brand.length > 10 ? 6.5 : 8}" font-weight="bold" letter-spacing="1">${esc(brand)}</text>${split.map((w, i) => `<text x="95" y="${labelY + 40 + i * 13}" text-anchor="middle" fill="${c}" font-family="Arial,sans-serif" font-size="${w.length > 12 ? 9 : 11}" font-weight="900">${w}</text>`).join('')}<g transform="translate(0 ${labelY - 72}) scale(1 .95)">${motif(a.motif)}</g><text x="95" y="${labelY + labelH - 8}" text-anchor="middle" fill="#635d47" font-family="Arial,sans-serif" font-size="8" letter-spacing="1">${esc(size || 'BORONG')}</text></g></svg>`
  const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  cache.set(key, uri)
  return uri
}
