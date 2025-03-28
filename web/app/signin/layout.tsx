import Header from './_header'
import style from './page.module.css'

import cn from '@/utils/classnames'
import config from '@/app/custom-content/config'

export default async function SignInLayout({ children }: any) {
  return <>
    <div className={cn(
      style.background,
      'flex min-h-screen w-full',
      'sm:p-4 lg:p-8',
      'gap-x-20',
      'justify-center lg:justify-start',
    )}>
      <div className={
        cn(
          'flex w-full shrink-0 flex-col rounded-2xl bg-white shadow',
          'space-between',
        )
      }>
        <Header />
        <div className={
          cn(
            'flex w-full grow flex-col items-center justify-center',
            'px-6',
            'md:px-[108px]',
          )
        }>
          <div className='flex flex-col md:w-[400px]'>
            {children}
          </div>
        </div>
        <div className='px-8 py-6 system-xs-regular text-text-tertiary'>
        {config.copyright.text}        </div>
      </div>
    </div>
  </>
}
