'use client'
import { useTranslation } from 'react-i18next'
import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useContext } from 'use-context-selector'
import { RiArrowDownSLine, RiLogoutBoxRLine, RiInformationLine, RiEditLine } from '@remixicon/react'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import Indicator from '../indicator'
import AccountAbout from '../account-about'
import { mailToSupport } from '../utils/util'
import classNames from '@/utils/classnames'
import I18n from '@/context/i18n'
import Avatar from '@/app/components/base/avatar'
import { logout } from '@/service/common'
import { useAppContext } from '@/context/app-context'
import { ArrowUpRight } from '@/app/components/base/icons/src/vender/line/arrows'
import { useModalContext } from '@/context/modal-context'
import { LanguagesSupported } from '@/i18n/language'
import { useProviderContext } from '@/context/provider-context'
import { Plan } from '@/app/components/billing/type'
import Tooltip from '@/app/components/base/tooltip'
import { updateWorkspaceName } from '@/service/common'

export type IAppSelector = {
  isMobile: boolean
}

export default function AppSelector({ isMobile }: IAppSelector) {
  const itemClassName = `
    flex items-center w-full h-9 px-3 text-text-secondary system-md-regular
    rounded-lg hover:bg-state-base-hover cursor-pointer
  `
  const router = useRouter()
  const [aboutVisible, setAboutVisible] = useState(false)
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { locale } = useContext(I18n)
  const { t } = useTranslation()
  const { userProfile, langeniusVersionInfo, setUserProfile } = useAppContext()
  const { setShowAccountSettingModal } = useModalContext()
  const { plan } = useProviderContext()
  const canEmailSupport = plan.type === Plan.professional || plan.type === Plan.team || plan.type === Plan.enterprise

  const handleLogout = async () => {
    await logout({
      url: '/logout',
      params: {},
    })

    localStorage.removeItem('setup_status')
    localStorage.removeItem('console_token')
    localStorage.removeItem('refresh_token')

    router.push('/signin')
  }

  const handleUpdateWorkspaceName = async () => {
    if (!newWorkspaceName.trim()) return
    setIsSubmitting(true)
    
    try {
      const res = await updateWorkspaceName(newWorkspaceName)
      if (res.result === 'success') {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to update workspace name:', error)
      setIsSubmitting(false)
    }
  }

  const roleDisplay = {
    normal: {
      text: t('common.role.normal'),
      bgColor: 'bg-gray-100'
    },
    developer: {
      text: t('common.role.developer'),
      bgColor: 'bg-blue-100'
    }
  } as const

  const getMenuPosition = () => {
    if (typeof window === 'undefined') return {}
    
    const button = document.querySelector('[data-headlessui-state="open"]') as HTMLElement
    if (!button) return {}
    
    const buttonRect = button.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const isRightSide = buttonRect.left > viewportWidth / 2

    return {
      style: {
        position: 'absolute',
        [isRightSide ? 'right' : 'left']: 0,
      } as const
    }
  }

  return (
    <div className="">
      <Menu as="div" className="relative inline-block text-left">
        {
          ({ open }) => (
            <>
              <Menu.Button
                className={`
                    inline-flex items-center
                    rounded-[20px] py-1.5 pr-3 pl-1.5 text-sm
                    text-gray-700 
                    mobile:px-1
                    ${userProfile.role === 'developer' ? 'hover:bg-gray-200' : ''}
                    ${open && userProfile.role === 'developer' ? 'bg-gray-200' : ''}
                  `}
              >
                <div className="flex items-center">
                  <Avatar 
                    avatar={userProfile.avatar_url} 
                    name={userProfile.name} 
                    className='sm:mr-2 mr-0' 
                    size={userProfile.role === 'developer' ? 32 : 40} 
                  />
                  {!isMobile && userProfile.role === 'developer' && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        {userProfile.name}
                        <RiArrowDownSLine className="w-3 h-3 ml-1 text-gray-700" />
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`text-xs rounded-sm ${roleDisplay[userProfile.role]?.bgColor || 'bg-gray-100'} px-1.5 py-[2px] mt-0.5 leading-none`}>
                          {roleDisplay[userProfile.role]?.text || t('common.role.normal')}
                        </div>
                        <Tooltip popupContent={t('common.role.upgradeTip')} position="top">
                          <div className="cursor-help mt-0.5">
                            <RiInformationLine className="w-3 h-3 text-gray-400" />
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items
                  className={`
                    absolute mt-1.5 w-60 max-w-80
                    divide-y divide-divider-subtle origin-top-right rounded-lg bg-components-panel-bg-blur
                    shadow-lg focus:outline-none z-50
                  `}
                  {...getMenuPosition()}
                >
                  <Menu.Item disabled>
                    <div className='flex flex-nowrap items-center px-4 py-[13px]'>
                      <Avatar avatar={userProfile.avatar_url} name={userProfile.name} size={36} className='mr-3' />
                      <div className='grow'>
                        <div className='system-md-medium text-text-primary break-all'>{userProfile.name}</div>
                        <div className='system-xs-regular text-text-tertiary break-all'>{userProfile.email}</div>
                      </div>
                    </div>
                  </Menu.Item>
                  {userProfile.role === 'developer' && (
                    <div className='px-1 py-1'>
                      <div className='mt-2 px-3 text-xs font-medium text-text-tertiary flex justify-between items-center'>
                        {t('common.userProfile.workspace')}
                        <RiEditLine 
                          className='w-3.5 h-3.5 cursor-pointer hover:text-primary-600' 
                          onClick={() => setIsEditingWorkspace(true)}
                        />
                      </div>
                      {isEditingWorkspace ? (
                        <div className='px-3 py-2'>
                          <input
                            type="text"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:border-primary-600"
                            placeholder={t('common.userProfile.enterWorkspaceName','输入新的工作空间名称')}
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                e.stopPropagation()
                                return false
                              }
                              if (e.key === ' ') {
                                e.stopPropagation()
                              }
                              if (e.key === 'Escape') {
                                setIsEditingWorkspace(false)
                                setNewWorkspaceName('')
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            autoFocus
                          />
                          <div className='flex justify-end gap-2 mt-2'>
                            <button
                              className='text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded'
                              onClick={() => {
                                setIsEditingWorkspace(false)
                                setNewWorkspaceName('')
                              }}
                            >
                              {t('common.operation.cancel')}
                            </button>
                            <button
                              className='text-xs px-2 py-1 text-white bg-primary-600 hover:bg-primary-700 rounded disabled:opacity-50'
                              onClick={handleUpdateWorkspaceName}
                              disabled={!newWorkspaceName.trim() || isSubmitting}
                            >
                              {isSubmitting ? t('common.operation.submitting', "正在提交...") : t('common.operation.confirm', "确认")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <WorkplaceSelector />
                      )}
                    </div>
                  )}
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => <Link
                        className={classNames(itemClassName, 'group justify-between',
                          active && 'bg-state-base-hover',
                        )}
                        href='/account'
                        target='_self' rel='noopener noreferrer'>
                        <div>{t('common.account.account')}</div>
                        <ArrowUpRight className='hidden w-[14px] h-[14px] text-text-tertiary group-hover:flex' />
                      </Link>}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => <div className={classNames(itemClassName,
                        active && 'bg-state-base-hover',
                      )} onClick={() => setShowAccountSettingModal({ 
                        payload: userProfile.role === 'developer' ? 'members' : 'members'  // 这个只是进入后的默认tab，实际的tab列表要AccountSettings里面来看
                      })}>
                        <div>{t('common.userProfile.settings')}</div>
                      </div>}
                    </Menu.Item>
                    {canEmailSupport && <Menu.Item>
                      {({ active }) => <a
                        className={classNames(itemClassName, 'group justify-between',
                          active && 'bg-state-base-hover',
                        )}
                        href={mailToSupport(userProfile.email, plan.type, langeniusVersionInfo.current_version)}
                        target='_blank' rel='noopener noreferrer'>
                        <div>{t('common.userProfile.emailSupport')}</div>
                        <ArrowUpRight className='hidden w-[14px] h-[14px] text-text-tertiary group-hover:flex' />
                      </a>}
                    </Menu.Item>}
                    {userProfile.role === 'developer' && (
                      <>
                        <Menu.Item>
                          {({ active }) => <Link
                            className={classNames(itemClassName, 'group justify-between',
                              active && 'bg-state-base-hover',
                            )}
                            href='https://github.com/langgenius/dify/discussions/categories/feedbacks'
                            target='_blank' rel='noopener noreferrer'>
                            <div>{t('common.userProfile.communityFeedback')}</div>
                            <ArrowUpRight className='hidden w-[14px] h-[14px] text-text-tertiary group-hover:flex' />
                          </Link>}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => <Link
                            className={classNames(itemClassName, 'group justify-between',
                              active && 'bg-state-base-hover',
                            )}
                            href='https://discord.gg/5AEfbxcd9k'
                            target='_blank' rel='noopener noreferrer'>
                            <div>{t('common.userProfile.community')}</div>
                            <ArrowUpRight className='hidden w-[14px] h-[14px] text-text-tertiary group-hover:flex' />
                          </Link>}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => <Link
                            className={classNames(itemClassName, 'group justify-between',
                              active && 'bg-state-base-hover',
                            )}
                            href={
                              locale !== LanguagesSupported[1] ? 'https://docs.dify.ai/' : `https://docs.dify.ai/v/${locale.toLowerCase()}/`
                            }
                            target='_blank' rel='noopener noreferrer'>
                            <div>{t('common.userProfile.helpCenter')}</div>
                            <ArrowUpRight className='hidden w-[14px] h-[14px] text-text-tertiary group-hover:flex' />
                          </Link>}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => <Link
                            className={classNames(itemClassName, 'group justify-between',
                              active && 'bg-state-base-hover',
                            )}
                            href='https://roadmap.dify.ai'
                            target='_blank' rel='noopener noreferrer'>
                            <div>{t('common.userProfile.roadmap')}</div>
                            <ArrowUpRight className='hidden w-[14px] h-[14px] text-text-tertiary group-hover:flex' />
                          </Link>}
                        </Menu.Item>
                        {document?.body?.getAttribute('data-public-site-about') !== 'hide' && (
                          <Menu.Item>
                            {({ active }) => <div className={classNames(itemClassName, 'justify-between',
                              active && 'bg-state-base-hover',
                            )} onClick={() => setAboutVisible(true)}>
                              <div>{t('common.userProfile.about')}</div>
                              <div className='flex items-center'>
                                <div className='mr-2 system-xs-regular text-text-tertiary'>{langeniusVersionInfo.current_version}</div>
                                <Indicator color={langeniusVersionInfo.current_version === langeniusVersionInfo.latest_version ? 'green' : 'orange'} />
                              </div>
                            </div>}
                          </Menu.Item>
                        )}
                      </>
                    )}
                  </div>
                  <Menu.Item>
                    {({ active }) => <div className='p-1' onClick={() => handleLogout()}>
                      <div
                        className={
                          classNames('flex items-center justify-between h-9 px-3 rounded-lg cursor-pointer group hover:bg-state-base-hover',
                            active && 'bg-state-base-hover')}
                      >
                        <div className='system-md-regular text-text-secondary'>{t('common.userProfile.logout')}</div>
                        <RiLogoutBoxRLine className='hidden w-4 h-4 text-text-tertiary group-hover:flex' />
                      </div>
                    </div>}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </>
          )
        }
      </Menu>
      {
        aboutVisible && <AccountAbout onCancel={() => setAboutVisible(false)} langeniusVersionInfo={langeniusVersionInfo} />
      }
    </div >
  )
}

