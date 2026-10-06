// A árvore do Instituto: marca no topo e metáfora de crescimento na trilha.

export function MarcaArvore(props) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M30 58h4V40l8-7-2.5-2.5L34 35V27h-4v10l-6.5-5.5L21 34l9 8z" fill="#0D3F20" />
      <circle cx="32" cy="18" r="11" fill="#78A824" />
      <circle cx="19" cy="27" r="8" fill="#78A824" />
      <circle cx="45" cy="27" r="8" fill="#78A824" />
      <circle cx="26" cy="13" r="3" fill="#A8C06C" />
    </svg>
  )
}

// Árvore grande da capa pública: copa feita de folhas, uma por programa.
export function ArvoreCapa(props) {
  const folhas = [[60, 40, 22], [34, 62, 18], [86, 62, 18], [48, 84, 15], [74, 84, 15], [60, 22, 12], [22, 88, 10], [98, 88, 10]]
  return (
    <svg viewBox="0 0 120 150" role="img" aria-label="Árvore do Instituto Ebenézer" {...props}>
      <path d="M56 148h8v-44l18-14-4-5-14 10V76h-8v22L41 87l-4 5 19 15z" fill="#0D3F20" />
      {folhas.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 3 === 2 ? '#A8C06C' : '#78A824'} />)}
      <circle cx="102" cy="22" r="9" fill="#F2B632" />
    </svg>
  )
}

// Trilha de leitura do estudante: um galho por nível, uma folha por bloco.
// Desbravador ocupa 8 blocos (1º e 2º ano); os outros níveis, 4 blocos cada.
const NIVEIS = [
  { nome: 'Desbravador', inicio: 0, fim: 8 },
  { nome: 'Mochileiro', inicio: 8, fim: 12 },
  { nome: 'Navegador', inicio: 12, fim: 16 },
  { nome: 'Mergulhador', inicio: 16, fim: 20 },
]
export const nivelDaPosicao = (blocos) => NIVEIS.find((n) => blocos < n.fim) || NIVEIS[3]

export function ArvoreTrilha({ blocos }) {
  const atual = nivelDaPosicao(blocos)
  const L = 340, meio = L / 2, comp = 140
  const galhos = NIVEIS.map((n, i) => ({ ...n, y: 360 - i * 84, lado: i % 2 === 0 ? -1 : 1 }))
  return (
    <svg viewBox={`0 0 ${L} 400`} role="img"
      aria-label={`Árvore da leitura: nível ${atual.nome}, ${Math.max(0, Math.floor(blocos - atual.inicio))} de ${atual.fim - atual.inicio} folhas`}>
      <circle cx={L - 34} cy="34" r="18" fill="#F2B632" />
      <path d={`M${meio - 8} 400 L${meio - 5} 70 Q${meio} 50 ${meio + 5} 70 L${meio + 8} 400 Z`} fill="#0D3F20" />
      {galhos.map((g) => {
        const total = g.fim - g.inicio
        const cheias = Math.max(0, Math.min(total, Math.floor(blocos - g.inicio)))
        const ativo = g.nome === atual.nome
        const futuro = blocos < g.inicio
        const xp = meio + g.lado * comp, yp = g.y - 34
        // folhas pousadas sobre o galho, distribuídas do meio até a ponta
        return (
          <g key={g.nome} opacity={futuro ? 0.4 : 1}>
            <line x1={meio} y1={g.y} x2={xp} y2={yp} stroke="#0D3F20" strokeWidth="6" strokeLinecap="round" />
            {Array.from({ length: total }).map((_, k) => {
              const t = 0.18 + 0.8 * (k / Math.max(1, total - 1))
              const bx = meio + (xp - meio) * t, by = g.y + (yp - g.y) * t
              const fx = bx, fy = by - 11
              const cheia = k < cheias
              return <ellipse key={k} cx={fx} cy={fy} rx="6.5" ry="11" transform={`rotate(${g.lado * 28} ${fx} ${fy})`}
                fill={cheia ? '#78A824' : '#fff'} stroke={cheia ? '#4F7A12' : '#9BA59F'} strokeWidth="2" />
            })}
            <text x={meio + g.lado * 16} y={g.y + 24} textAnchor={g.lado < 0 ? 'end' : 'start'} fontFamily="Cooper Hewitt, Arial"
              fontWeight="800" fontSize="15" fill={ativo ? '#256B29' : '#5B6660'}>{ativo ? `${g.nome} (você)` : g.nome}</text>
          </g>
        )
      })}
    </svg>
  )
}
