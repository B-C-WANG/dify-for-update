'use client'
import { useContextSelector } from 'use-context-selector'
import { useTranslation } from 'react-i18next'
import { RiDiscordFill, RiGithubFill } from '@remixicon/react'
import Link from 'next/link'
import style from '../list.module.css'
import Apps from './Apps'
import AppContext from '@/context/app-context'
import { LicenseStatus } from '@/types/feature'
import DeveloperGuard from '@/app/components/common/DeveloperGuard'

const AppList = () => {
  const { t } = useTranslation()
  const systemFeatures = useContextSelector(AppContext, v => v.systemFeatures)

  return (
    <DeveloperGuard>
    <div className='relative flex flex-col overflow-y-auto bg-background-body shrink-0 h-0 grow'>
      <Apps />
      {systemFeatures.license.status === LicenseStatus.NONE && <footer className='shrink-0 grow-0 px-12 py-6'>
        <h3 className='text-gradient text-xl font-semibold leading-tight'>{t('app.join')}</h3>
        <p className='system-sm-regular mt-1 text-text-tertiary'>{t('app.communityIntro')}</p>
        <div className='mt-3 flex items-center gap-2'>
          <Link className={style.socialMediaLink} target='_blank' rel='noopener noreferrer' href='https://github.com/langgenius/dify'>
            <RiGithubFill className='h-5 w-5 text-text-tertiary' />
          </Link>
          <Link className={style.socialMediaLink} target='_blank' rel='noopener noreferrer' href='https://discord.gg/FngNHpbcY7'>
            <RiDiscordFill className='h-5 w-5 text-text-tertiary' />
          </Link>
        </div>
      </footer>}
    </div >
    </DeveloperGuard>
  )
}

export default AppList
