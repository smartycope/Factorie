import React, { createContext, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toastText, toast] = useState(null)
  const [toastDuration, setToastDuration] = useState(5000)

  return <ToastContext.Provider value={{toast, toastText, toastDuration, setToastDuration}}>{children}</ToastContext.Provider>
}
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx)
    throw new Error("useToast must be used within ToastProvider")
  return ctx
}

export default ToastContext
