// "PIX copia e cola" (BR Code do Banco Central, padrão EMV) gerado no próprio aparelho.
// O portal não processa pagamento: só monta o texto que o app do banco entende.

const campo = (id, valor) => `${id}${String(valor.length).padStart(2, '0')}${valor}`
const semAcento = (t, max) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().slice(0, max)

// CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no campo 63.
function crc16(texto) {
  let crc = 0xffff
  for (const ch of texto) {
    crc ^= ch.charCodeAt(0) << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Telefone vira +55…, CNPJ só dígitos; e-mail e chave aleatória vão como estão.
export function normalizarChave(chave, tipo) {
  const c = chave.trim()
  if (tipo === 'cnpj') return c.replace(/\D/g, '')
  if (tipo === 'telefone') { const d = c.replace(/\D/g, ''); return d.startsWith('55') ? `+${d}` : `+55${d}` }
  if (tipo === 'email') return c.toLowerCase()
  return c
}

export function pixCopiaECola({ chave, tipo_chave, titular, cidade }, valor) {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', normalizarChave(chave, tipo_chave))
  let p = campo('00', '01') + campo('26', conta) + campo('52', '0000') + campo('53', '986')
  if (valor > 0) p += campo('54', Number(valor).toFixed(2))
  p += campo('58', 'BR') + campo('59', semAcento(titular, 25) || 'INSTITUTO') + campo('60', semAcento(cidade || 'SAO PAULO', 15))
  p += campo('62', campo('05', '***')) + '6304'
  return p + crc16(p)
}
