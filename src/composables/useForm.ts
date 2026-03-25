import { ref } from 'vue'

export function useForm<T extends Record<string, any>>(initialValues: T) {
  const values = ref<T>({ ...initialValues })
  const errors = ref<Record<keyof T, string>>({} as Record<keyof T, string>)
  const touched = ref<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)

  const setFieldValue = (field: keyof T, value: any): void => {
    values.value[field] = value
  }

  const setFieldError = (field: keyof T, error: string): void => {
    errors.value[field] = error
  }

  const setFieldTouched = (field: keyof T): void => {
    touched.value[field] = true
  }

  const resetForm = (): void => {
    values.value = { ...initialValues }
    errors.value = {} as Record<keyof T, string>
    touched.value = {} as Record<keyof T, boolean>
  }

  const getFieldProps = (field: keyof T) => ({
    modelValue: values.value[field],
    'onUpdate:modelValue': (value: any) => setFieldValue(field, value),
    onBlur: () => setFieldTouched(field),
  })

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    getFieldProps,
  }
}
