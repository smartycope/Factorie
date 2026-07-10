import { createContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toastText, toast] = useState(null)
  const [toastDuration, setToastDuration] = useState(5000)

  return <ToastContext.Provider value={{toast, toastText, toastDuration, setToastDuration}}>{children}</ToastContext.Provider>
}

export default ToastContext
