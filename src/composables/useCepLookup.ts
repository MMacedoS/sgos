import { ref, type Ref } from 'vue'
import { formatCEP } from '@/utils'

interface AddressFormShape {
  zip_code?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
}

interface ViaCepResponse {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

const onlyDigits = (value: string): string => value.replace(/\D/g, '')

export const useCepLookup = <T extends AddressFormShape>(form: Ref<T>) => {
  const isLoadingCep = ref(false)
  const cepMessage = ref('')

  const handleCepInput = (event: Event): void => {
    const target = event.target as HTMLInputElement | null
    if (!target) {
      return
    }

    form.value.zip_code = formatCEP(target.value) as T['zip_code']
    cepMessage.value = ''
  }

  const fillAddressFromCep = (data: ViaCepResponse): void => {
    form.value.street = (data.logradouro ?? '') as T['street']
    form.value.neighborhood = (data.bairro ?? '') as T['neighborhood']
    form.value.city = (data.localidade ?? '') as T['city']
    form.value.state = (data.uf ?? '') as T['state']
  }

  const loadAddressByCep = async (): Promise<void> => {
    const cep = onlyDigits(form.value.zip_code ?? '')

    if (!cep) {
      cepMessage.value = ''
      return
    }

    if (cep.length !== 8) {
      cepMessage.value = 'Informe um CEP com 8 digitos.'
      return
    }

    isLoadingCep.value = true
    cepMessage.value = ''

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)

      if (!response.ok) {
        throw new Error('Nao foi possivel consultar o CEP.')
      }

      const data = (await response.json()) as ViaCepResponse

      if (data.erro) {
        throw new Error('CEP nao encontrado.')
      }

      fillAddressFromCep(data)
      cepMessage.value = 'Endereco preenchido automaticamente.'
    } catch (error) {
      cepMessage.value = error instanceof Error ? error.message : 'Erro ao buscar CEP.'
    } finally {
      isLoadingCep.value = false
    }
  }

  const resetCepState = (): void => {
    cepMessage.value = ''
  }

  return {
    cepMessage,
    handleCepInput,
    isLoadingCep,
    loadAddressByCep,
    resetCepState,
  }
}