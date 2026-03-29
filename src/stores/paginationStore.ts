import { defineStore } from "pinia"
import { ref } from "vue"

export const usePaginationStore = defineStore('pagination', () => {
    const currentPage = ref(1)
    const totalPages = ref(1)
    
    const setCurrentPage = (page: number) => {
        currentPage.value = page
    }

    const setTotalPages = (pages: number) => {
        totalPages.value = pages
    }

    return {
        currentPage,
        totalPages,
        setCurrentPage,
        setTotalPages,
    }
})