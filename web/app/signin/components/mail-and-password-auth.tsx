import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useSearchParams } from 'next/navigation'
import { useContext } from 'use-context-selector'
import Button from '@/app/components/base/button'
import Toast from '@/app/components/base/toast'
import { emailRegex } from '@/config'
import { login } from '@/service/common'
import Input from '@/app/components/base/input'
import I18NContext from '@/context/i18n'

type MailAndPasswordAuthProps = {
  isInvite: boolean
  isEmailSetup: boolean
  allowRegistration: boolean
}

const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/

export default function MailAndPasswordAuth({ isInvite, isEmailSetup, allowRegistration }: MailAndPasswordAuthProps) {
  const { t } = useTranslation()
  const { locale } = useContext(I18NContext)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const emailFromLink = decodeURIComponent(searchParams.get('email') || '')
  const [email, setEmail] = useState(emailFromLink)
  const [password, setPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const handleEmailPasswordLogin = async () => {
    if (!email) {
      Toast.notify({ type: 'error', message: t('login.error.emailEmpty') })
      return
    }
    if (!emailRegex.test(email)) {
      Toast.notify({
        type: 'error',
        message: t('login.error.emailInValid'),
      })
      return
    }
    if (!password?.trim()) {
      Toast.notify({ type: 'error', message: t('login.error.passwordEmpty') })
      return
    }
    if (!passwordRegex.test(password)) {
      Toast.notify({
        type: 'error',
        message: t('login.error.passwordInvalid'),
      })
      return
    }
    try {
      setIsLoading(true)
      const loginData: Record<string, any> = {
        email,
        password,
        language: locale,
        remember_me: true,
      }
      if (isInvite)
        loginData.invite_token = decodeURIComponent(searchParams.get('invite_token') as string)
      const res = await login({
        url: '/login',
        body: loginData,
      })
      if (res.result === 'success') {
        if (isInvite) {
          router.replace(`/signin/invite-settings?${searchParams.toString()}`)
        }
        else {
          localStorage.setItem('console_token', res.data.access_token)
          localStorage.setItem('refresh_token', res.data.refresh_token)
          router.replace('/explore/apps')
        }
      }
      else if (res.code === 'account_not_found') {
        if (allowRegistration) {
          const params = new URLSearchParams()
          params.append('email', encodeURIComponent(email))
          params.append('token', encodeURIComponent(res.data))
          router.replace(`/reset-password/check-code?${params.toString()}`)
        }
        else {
          Toast.notify({
            type: 'error',
            message: t('login.error.registrationNotAllowed'),
          })
        }
      }
      else {
        Toast.notify({
          type: 'error',
          message: res.data,
        })
      }
    }

    finally {
      setIsLoading(false)
    }
  }

  return <form className="w-full max-w-md mx-auto p-6 space-y-6" onSubmit={() => { }}>
    <div className='space-y-2'>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
        {t('login.email')}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <Input
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isInvite}
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('login.emailPlaceholder') || ''}
          tabIndex={1}
          className="block w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary-100 transition-all duration-200"
        />
      </div>
    </div>

    <div className='space-y-2'>
      <div className="flex items-center justify-between">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {t('login.password')}
        </label>
        <Link
          href={`/reset-password?${searchParams.toString()}`}
          className={`text-sm ${isEmailSetup 
            ? 'text-primary-600 hover:text-primary-700 transition-colors duration-200' 
            : 'text-gray-400 pointer-events-none'}`}
          tabIndex={isEmailSetup ? 0 : -1}
          aria-disabled={!isEmailSetup}
        >
          {t('login.forget')}
        </Link>
      </div>
      <div className="mt-1 relative rounded-md shadow-sm">
        <Input
          id="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter')
              handleEmailPasswordLogin()
          }}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder') || ''}
          tabIndex={2}
          className="block w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary-100 transition-all duration-200"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Button
            type="button"
            variant='ghost'
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>

    <div className='pt-4'>
      <Button
        tabIndex={2}
        variant='primary'
        onClick={handleEmailPasswordLogin}
        disabled={isLoading || !email || !password}
        className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {t('login.signBtn')}
      </Button>
    </div>
  </form>
}
