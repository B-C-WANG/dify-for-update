'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useContext } from 'use-context-selector'
import useSWR from 'swr'
import { useDebounceFn } from 'ahooks'
import Toast from '../../base/toast'
import s from './style.module.css'
import cn from '@/utils/classnames'
import ExploreContext from '@/context/explore-context'
import type { App } from '@/models/explore'
import Category from '@/app/components/explore/category'
import AppCard from '@/app/components/explore/app-card'
import { fetchAppDetail, fetchAppList } from '@/service/explore'
import { importDSL } from '@/service/apps'
import { useTabSearchParams } from '@/hooks/use-tab-searchparams'
import CreateAppModal from '@/app/components/explore/create-app-modal'
import AppTypeSelector from '@/app/components/app/type-selector'
import type { CreateAppModalProps } from '@/app/components/explore/create-app-modal'
import Loading from '@/app/components/base/loading'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import { getRedirection } from '@/utils/app-redirection'
import Input from '@/app/components/base/input'
import { DSLImportMode } from '@/models/app'
import { useAppContext } from '@/context/app-context'
import { isDeveloper } from '@/app/components/common/DeveloperGuard'
import { usePluginDependencies } from '@/app/components/workflow/plugin-dependency/hooks'
type AppsProps = {
  pageType?: PageType
  onSuccess?: () => void
}

export enum PageType {
  EXPLORE = 'explore',
  CREATE = 'create',
}

const Apps = ({
  pageType = PageType.EXPLORE,
  onSuccess,
}: AppsProps) => {
  const { t } = useTranslation()
  const { isCurrentWorkspaceEditor, userProfile } = useAppContext()
  const { push } = useRouter()
  const { hasEditPermission } = useContext(ExploreContext)
  const allCategoriesEn = t('explore.apps.allCategories', { lng: 'en' })

  const [keywords, setKeywords] = useState('')
  const [searchKeywords, setSearchKeywords] = useState('')

  const { run: handleSearch } = useDebounceFn(() => {
    setSearchKeywords(keywords)
  }, { wait: 500 })

  const handleKeywordsChange = (value: string) => {
    setKeywords(value)
    handleSearch()
  }

  const [currentType, setCurrentType] = useState<string>('')
  const [currCategory, setCurrCategory] = useTabSearchParams({
    defaultTab: allCategoriesEn,
    disableSearchParams: pageType !== PageType.EXPLORE,
  })

  const {
    data: { categories, allList },
  } = useSWR(
    ['/explore/apps'],
    () =>
      fetchAppList().then(({ categories, recommended_apps }) => ({
        categories,
        allList: recommended_apps.sort((a, b) => a.position - b.position),
      })),
    {
      fallbackData: {
        categories: [],
        allList: [],
      },
    },
  )

  const filteredList = useMemo(() => {
    if (currCategory === allCategoriesEn) {
      if (!currentType)
        return allList
      else if (currentType === 'chatbot')
        return allList.filter(item => (item.app.mode === 'chat' || item.app.mode === 'advanced-chat'))
      else if (currentType === 'agent')
        return allList.filter(item => (item.app.mode === 'agent-chat'))
      else
        return allList.filter(item => (item.app.mode === 'workflow'))
    }
    else {
      if (!currentType)
        return allList.filter(item => item.category === currCategory)
      else if (currentType === 'chatbot')
        return allList.filter(item => (item.app.mode === 'chat' || item.app.mode === 'advanced-chat') && item.category === currCategory)
      else if (currentType === 'agent')
        return allList.filter(item => (item.app.mode === 'agent-chat') && item.category === currCategory)
      else
        return allList.filter(item => (item.app.mode === 'workflow') && item.category === currCategory)
    }
  }, [currentType, currCategory, allCategoriesEn, allList])

  const searchFilteredList = useMemo(() => {
    if (!searchKeywords || !filteredList || filteredList.length === 0)
      return filteredList

    const lowerCaseSearchKeywords = searchKeywords.toLowerCase()

    return filteredList.filter(item =>
      item.app && item.app.name && item.app.name.toLowerCase().includes(lowerCaseSearchKeywords),
    )
  }, [searchKeywords, filteredList])

  const [currApp, setCurrApp] = React.useState<App | null>(null)
  const [isShowCreateModal, setIsShowCreateModal] = React.useState(false)
  const { handleCheckPluginDependencies } = usePluginDependencies()
  const onCreate: CreateAppModalProps['onConfirm'] = async ({
    name,
    icon_type,
    icon,
    icon_background,
    description,
  }) => {
    const { export_data, mode } = await fetchAppDetail(
      currApp?.app.id as string,
    )
    try {
      const app = await importDSL({
        mode: DSLImportMode.YAML_CONTENT,
        yaml_content: export_data,
        name,
        icon_type,
        icon,
        icon_background,
        description,
      })
      setIsShowCreateModal(false)
      Toast.notify({
        type: 'success',
        message: t('app.newApp.appCreated'),
      })
      if (onSuccess)
        onSuccess()
      if (app.app_id)
        await handleCheckPluginDependencies(app.app_id)
      localStorage.setItem(NEED_REFRESH_APP_LIST_KEY, '1')
      getRedirection(isCurrentWorkspaceEditor, { id: app.app_id, mode }, push)
    }
    catch (e) {
      Toast.notify({ type: 'error', message: t('app.newApp.appCreateFailed') })
    }
  }

  const isUserDeveloper = isDeveloper(userProfile)

  const DeveloperGuideBox = () => {
    const { t } = useTranslation()
    return (
      <div className="mx-12 py-1 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-sm border border-blue-100/60 mt-4 mb-3">
        <div className="flex items-center justify-start text-[11px] tracking-tight">
          <span className="text-blue-800 font-medium mr-1.5 shrink-0">
            {t('explore.developer.guide.title', '建议的开发流程：')}
          </span>
          <span className="text-blue-700/90 flex items-center flex-wrap">
            <span className="inline-flex items-center">
              <span className="inline-flex items-center justify-center bg-blue-100/80 rounded-full w-3.5 h-3.5 text-blue-700 font-medium text-[10px]">1</span>
              <span className="mx-0.5">在探索页面寻找参考（可以直接添加后编辑）</span>
              <span className="mx-0.5 text-blue-200">•</span>
            </span>
            <span className="inline-flex items-center">
              <span className="inline-flex items-center justify-center bg-blue-100/80 rounded-full w-3.5 h-3.5 text-blue-700 font-medium text-[10px]">2</span>
              <span className="mx-0.5">完善知识库</span>
              <span className="mx-0.5 text-blue-200">•</span>
            </span>
            <span className="inline-flex items-center">
              <span className="inline-flex items-center justify-center bg-blue-100/80 rounded-full w-3.5 h-3.5 text-blue-700 font-medium text-[10px]">3</span>
              <span className="mx-0.5">引用工具和知识库完成agent设计</span>
              <span className="mx-0.5 text-blue-200">•</span>
            </span>
            <span className="inline-flex items-center">
              <span className="inline-flex items-center justify-center bg-blue-100/80 rounded-full w-3.5 h-3.5 text-blue-700 font-medium text-[10px]">4</span>
              <span className="mx-0.5">发布并填写路径</span>
              <span className="mx-0.5 text-blue-200">•</span>
            </span>
            <span className="inline-flex items-center">
              <span className="inline-flex items-center justify-center bg-blue-100/80 rounded-full w-3.5 h-3.5 text-blue-700 font-medium text-[10px]">5</span>
              <span className="mx-0.5">用户订阅你的tenant</span>
              <span className="mx-0.5 text-blue-200">•</span>
            </span>
            <span className="inline-flex items-center">
              <span className="inline-flex items-center justify-center bg-blue-100/80 rounded-full w-3.5 h-3.5 text-blue-700 font-medium text-[10px]">6</span>
              <span className="mx-0.5">用户使用并付费</span>
            </span>
          </span>
        </div>
      </div>
    )
  }

  // 普通用户直接提示选择开发工具
  if (!isUserDeveloper) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">
            {t('explore.nonDeveloper.title', '请打开左上角AI人力资源库选择你要使用的AI人力')}
          </div>
          <div className="text-sm text-gray-500">
            {t('explore.nonDeveloper.subtitle', '或者订阅其他开发者的工具 (即将推出)')}
          </div>
        </div>
      </div>
    )
  }
  // 开发者会等待加载，然后显示默认的探索页面
  if (!categories || categories.length === 0) {
    return (
      <div className="flex h-full items-center">
        <Loading type="area" />
      </div>
    )
  }
  return (
    <div className={cn(
      'flex flex-col',
      pageType === PageType.EXPLORE ? 'h-full border-l border-200' : 'h-[calc(100%-56px)]',
    )}>
      {pageType === PageType.EXPLORE && isUserDeveloper && <DeveloperGuideBox />}
      {pageType === PageType.EXPLORE && (
        <div className='shrink-0 pt-2 px-12'>
          <div className={`${s.textGradient} text-lg font-medium`}>{t('explore.apps.title')}</div>
        </div>
      )}
      <div className={cn(
        'flex items-center justify-between mt-3',
        pageType === PageType.EXPLORE ? 'px-12' : 'px-8',
      )}>
        <>
          {pageType !== PageType.EXPLORE && (
            <>
              <AppTypeSelector value={currentType} onChange={setCurrentType}/>
              <div className='mx-2 w-[1px] h-3.5 bg-gray-200'/>
            </>
          )}
          <Category
            list={categories}
            value={currCategory}
            onChange={setCurrCategory}
            allCategoriesEn={allCategoriesEn}
          />
        </>
        <Input
          showLeftIcon
          showClearIcon
          wrapperClassName='w-[200px]'
          value={keywords}
          onChange={e => handleKeywordsChange(e.target.value)}
          onClear={() => handleKeywordsChange('')}
        />

      </div>

      <div className={cn(
        'relative flex flex-1 pb-6 flex-col overflow-auto bg-gray-100 shrink-0 grow',
        pageType === PageType.EXPLORE ? 'mt-4' : 'mt-0 pt-2',
      )}>
        <nav
          className={cn(
            s.appList,
            'grid content-start shrink-0',
            pageType === PageType.EXPLORE ? 'gap-4 px-6 sm:px-12' : 'gap-3 px-8  sm:!grid-cols-2 md:!grid-cols-3 lg:!grid-cols-4',
          )}>
          {searchFilteredList.map(app => (
            <AppCard
              key={app.app_id}
              isExplore={pageType === PageType.EXPLORE}
              app={app}
              canCreate={hasEditPermission}
              onCreate={() => {
                setCurrApp(app)
                setIsShowCreateModal(true)
              }}
            />
          ))}
        </nav>
      </div>
      {isShowCreateModal && (
        <CreateAppModal
          appIconType={currApp?.app.icon_type || 'emoji'}
          appIcon={currApp?.app.icon || ''}
          appIconBackground={currApp?.app.icon_background || ''}
          appIconUrl={currApp?.app.icon_url}
          appName={currApp?.app.name || ''}
          appDescription={currApp?.app.description || ''}
          show={isShowCreateModal}
          onConfirm={onCreate}
          onHide={() => setIsShowCreateModal(false)}
        />
      )}
    </div>
  )
}

export default React.memo(Apps)
