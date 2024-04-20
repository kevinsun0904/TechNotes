import { useState, useEffect } from "react"

const usePersist = () => {
    const [persist, setPersist] = useState(JSON.parse(localStorage.getItem("persistLogin")) || false);

    useEffect(() => {
        localStorage.setItem("persistLogin", JSON.stringify(persist))
    }, [persist])

    return [persist, setPersist]
}
export default usePersist