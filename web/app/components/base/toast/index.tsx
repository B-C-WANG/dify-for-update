'use client'
import type { ReactNode } from 'react'
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiErrorWarningFill,
  RiInformation2Fill,
} from '@remixicon/react'
import { createContext, useContext } from 'use-context-selector'
import ActionButton from '@/app/components/base/action-button'
import classNames from '@/utils/classnames'

export type IToastProps = {
  type?: 'success' | 'error' | 'warning' | 'info'
  size?: 'md' | 'sm'
  duration?: number
  message: string
  children?: ReactNode
  onClose?: () => void
  className?: string
  customComponent?: ReactNode
}
type IToastContext = {
  notify: (props: IToastProps) => void
  close: () => void
}

export const ToastContext = createContext<IToastContext>({} as IToastContext)
export const useToastContext = () => useContext(ToastContext)
const Toast = ({
  type = 'info',
  size = 'md',
  message,
  children,
  className,
  customComponent,
}: IToastProps) => {
  const { close } = useToastContext()
  if (typeof message !== 'string')
    return null

  return <div className={classNames(
    className,
    'fixed w-[420px] rounded-2xl my-4 mx-8 flex-grow z-[9999]',
    size === 'md' ? 'p-4' : 'p-3',
    'border-[0.5px] border-black/5 bg-white/98 backdrop-blur-xl',
    'top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    'shadow-2xl transition-all duration-300 ease-out',
    'animate-[toast-in_0.3s_cubic-bezier(0.21, 1.02, 0.73, 1)]',
  )}>
    <div className={`absolute inset-0 rounded-2xl opacity-35 -z-10 ${
      (type === 'success' && 'bg-[radial-gradient(circle_at_center,rgba(23,178,106,0.4)_0%,rgba(255,255,255,0.00)_70%)]')
      || (type === 'warning' && 'bg-[radial-gradient(circle_at_center,rgba(247,144,9,0.4)_0%,rgba(255,255,255,0.00)_70%)]')
      || (type === 'error' && 'bg-[radial-gradient(circle_at_center,rgba(240,68,56,0.4)_0%,rgba(255,255,255,0.00)_70%)]')
      || (type === 'info' && 'bg-[radial-gradient(circle_at_center,rgba(11,165,236,0.4)_0%,rgba(255,255,255,0.00)_70%)]')
    }`}
    />
    <div className={`flex ${size === 'md' ? 'gap-1' : 'gap-0.5'}`}>
      <div className={`flex justify-center items-center ${size === 'md' ? 'p-0.5' : 'p-1'}`}>
        {type === 'success' && <RiCheckboxCircleFill className={`${size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} text-text-success`} aria-hidden="true" />}
        {type === 'error' && <RiErrorWarningFill className={`${size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} text-text-destructive`} aria-hidden="true" />}
        {type === 'warning' && <RiAlertFill className={`${size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} text-text-warning-secondary`} aria-hidden="true" />}
        {type === 'info' && <RiInformation2Fill className={`${size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} text-text-accent`} aria-hidden="true" />}
      </div>
      <div className={`flex py-1 ${size === 'md' ? 'px-1' : 'px-0.5'} flex-col items-start gap-1 flex-grow z-10`}>
        <div className='flex items-center gap-1'>
          <div className='text-text-primary system-sm-semibold'>{message}</div>
          {customComponent}
        </div>
        {children && <div className='text-text-secondary system-xs-regular'>
          {children}
        </div>
        }
      </div>
      <ActionButton onClick={close}>
        <RiCloseLine className='w-4 h-4 flex-shrink-0 text-text-tertiary' />
      </ActionButton>
    </div>
  </div>
}

export const ToastProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const placeholder: IToastProps = {
    type: 'info',
    message: 'Toast message',
    duration: 6000,
  }
  const [params, setParams] = React.useState<IToastProps>(placeholder)
  const defaultDuring = (params.type === 'success' || params.type === 'info') ? 3000 : 6000
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (mounted) {
      setTimeout(() => {
        setMounted(false)
      }, params.duration || defaultDuring)
    }
  }, [defaultDuring, mounted, params.duration])

  return <ToastContext.Provider value={{
    notify: (props) => {
      setMounted(true)
      setParams(props)
    },
    close: () => setMounted(false),
  }}>
    {mounted && <Toast {...params} />}
    {children}
  </ToastContext.Provider>
}

Toast.notify = ({
  type,
  size = 'md',
  message,
  duration,
  className,
  customComponent,
  onClose,
}: Pick<IToastProps, 'type' | 'size' | 'message' | 'duration' | 'className' | 'customComponent' | 'onClose'>) => {
  const defaultDuring = (type === 'success' || type === 'info') ? 3000 : 6000
  if (typeof window === 'object') {
    const holder = document.createElement('div')
    const root = createRoot(holder)

    root.render(
      <ToastContext.Provider value={{
        notify: () => { },
        close: () => {
          if (holder) {
            root.unmount()
            holder.remove()
          }
          onClose?.()
        },
      }}>
        <Toast type={type} size={size} message={message} duration={duration} className={className} customComponent={customComponent} />
      </ToastContext.Provider>,
    )
    document.body.appendChild(holder)
    setTimeout(() => {
      if (holder) {
        root.unmount()
        holder.remove()
      }
      onClose?.()
    }, duration || defaultDuring)
  }
}

export default Toast
