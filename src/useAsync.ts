import { useEffect, useState } from "react"

export interface Resource<T> {
    value: T | null
    setValue: React.Dispatch<React.SetStateAction<T | null>>
    error: Error | null
    setError: React.Dispatch<React.SetStateAction<Error | null>>
    loading: boolean
}

export const useAsync = <T>(fcn: (...params: any[]) => Promise<T>, params: any[]): Resource<T> => {
    const [value, setValue] = useState<T | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        const getResource = async () => {
            try {
                setLoading(true)
                const result = await fcn(...params)
                if (isMounted) {
                    setValue(result)
                }
            } catch (e) {
                if (isMounted) {
                    setError(e as Error)
                }
            }
            if (isMounted) {
                setLoading(false)
            }
        }
        getResource()
        return () => { isMounted = false }
    }, params)

    return { value, setValue, error, setError, loading }
}

export default useAsync