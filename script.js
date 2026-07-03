const formulario = document.querySelector('#inscricao')
const campoCep = document.querySelector('#cep')
const statusCep = document.querySelector('#cep-status')
const caixaEndereco = document.querySelector('#address-box')
const textoEndereco = document.querySelector('#address-text')
const botaoEnviar = document.querySelector('#submit-button')

let cepConfirmado = false
let ultimoCepConsultado = ''

function somenteNumeros(valor) {
  return valor.replace(/\D/g, '')
}

function aplicarMascaraCep(valor) {
  const numeros = somenteNumeros(valor).slice(0, 8)

  if (numeros.length <= 5) {
    return numeros
  }

  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`
}

function mostrarErro(campo, mensagem = '') {
  const grupo = campo.closest('.field')
  const mensagemErro = grupo.querySelector('.error-message')

  grupo.classList.toggle('invalid', Boolean(mensagem))
  mensagemErro.textContent = mensagem
}

function limparEndereco() {
  cepConfirmado = false
  caixaEndereco.hidden = true
  textoEndereco.textContent = ''
  statusCep.className = 'cep-status'
}

function montarEndereco(dados) {
  return [
    dados.logradouro,
    dados.bairro,
    dados.localidade && dados.uf
      ? `${dados.localidade} - ${dados.uf}`
      : dados.localidade
  ]
    .filter(Boolean)
    .join(', ')
}

async function consultarCep() {
  const cep = somenteNumeros(campoCep.value)

  if (cep.length !== 8) {
    limparEndereco()

    if (cep.length > 0) {
      mostrarErro(campoCep, 'Informe um CEP com 8 números.')
    }

    return false
  }

  if (cep === ultimoCepConsultado && cepConfirmado) {
    return true
  }

  ultimoCepConsultado = cep
  cepConfirmado = false
  mostrarErro(campoCep)
  caixaEndereco.hidden = true
  statusCep.className = 'cep-status loading'

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`)

    if (!resposta.ok) {
      throw new Error('A consulta ao ViaCEP falhou.')
    }

    const dados = await resposta.json()

    if (dados.erro) {
      mostrarErro(campoCep, 'CEP não encontrado.')
      statusCep.className = 'cep-status error'
      return false
    }

    textoEndereco.textContent = montarEndereco(dados)
    caixaEndereco.hidden = false
    statusCep.className = 'cep-status success'
    cepConfirmado = true

    return true
  } catch (erro) {
    mostrarErro(campoCep, 'Não foi possível consultar o CEP. Tente novamente.')
    statusCep.className = 'cep-status error'
    return false
  }
}

function validarCampo(campo) {
  const valor = campo.value.trim()

  if (!valor) {
    mostrarErro(campo, 'Este campo é obrigatório.')
    return false
  }

  if (campo.id === 'nome' && valor.length < 3) {
    mostrarErro(campo, 'Digite seu nome completo.')
    return false
  }

  if (campo.type === 'email' && !campo.validity.valid) {
    mostrarErro(campo, 'Digite um e-mail válido.')
    return false
  }

  mostrarErro(campo)
  return true
}

campoCep.addEventListener('input', () => {
  campoCep.value = aplicarMascaraCep(campoCep.value)
  ultimoCepConsultado = ''
  limparEndereco()
  mostrarErro(campoCep)

  if (somenteNumeros(campoCep.value).length === 8) {
    consultarCep()
  }
})

campoCep.addEventListener('blur', consultarCep)

formulario.querySelectorAll('input:not(#cep), select').forEach(campo => {
  campo.addEventListener('blur', () => validarCampo(campo))

  campo.addEventListener('input', () => {
    if (campo.closest('.field').classList.contains('invalid')) {
      validarCampo(campo)
    }
  })

  campo.addEventListener('change', () => {
    if (campo.tagName === 'SELECT') {
      validarCampo(campo)
    }
  })
})

formulario.addEventListener('submit', async evento => {
  evento.preventDefault()

  const camposComuns = [
    ...formulario.querySelectorAll('input:not(#cep), select')
  ]

  const camposValidos = camposComuns.map(validarCampo).every(Boolean)

  botaoEnviar.disabled = true
  const cepValido = await consultarCep()
  botaoEnviar.disabled = false

  if (!camposValidos || !cepValido) {
    const primeiroCampoComErro = formulario.querySelector(
      '.field.invalid input, .field.invalid select'
    )

    primeiroCampoComErro?.focus()
    return
  }

  alert('Enviado')
  window.location.reload()
})
