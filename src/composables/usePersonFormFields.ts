import type { Ref } from 'vue'
import { formatCPF, formatPhoneBR } from '@/utils'

interface PersonFormShape {
  cpf_cnpj: string
  telefone?: string
}

const onlyDigits = (value: string): string => value.replace(/\D/g, '')

export const usePersonFormFields = <T extends PersonFormShape>(form: Ref<T>) => {
  const formatDocument = (value: string): string => {
    const digits = onlyDigits(value)

    if (!digits) {
      return ''
    }

    if (digits.length <= 11) {
      return formatCPF(digits)
    }

    return digits.slice(0, 14)
  }

  const formatDocumentDisplay = (value: string | null | undefined): string => {
    if (!value) {
      return '--'
    }

    return formatDocument(value)
  }

  const formatPhoneDisplay = (value: string | null | undefined): string => {
    if (!value) {
      return 'Sem telefone cadastrado'
    }

    return formatPhoneBR(value)
  }

  const handleDocumentInput = (event: Event): void => {
    const target = event.target as HTMLInputElement | null
    if (!target) {
      return
    }

    form.value.cpf_cnpj = formatDocument(target.value)
  }

  const handlePhoneInput = (event: Event): void => {
    const target = event.target as HTMLInputElement | null
    if (!target) {
      return
    }

    form.value.telefone = formatPhoneBR(target.value) as T['telefone']
  }

  return {
    formatDocument,
    formatDocumentDisplay,
    formatPhoneDisplay,
    handleDocumentInput,
    handlePhoneInput,
    onlyDigits,
  }
}