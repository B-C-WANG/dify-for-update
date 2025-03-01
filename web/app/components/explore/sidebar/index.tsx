'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useContext } from 'use-context-selector'
import { useSelectedLayoutSegments } from 'next/navigation'
import Link from 'next/link'
import Toast from '../../base/toast'
import Item from './app-nav-item'
import cn from '@/utils/classnames'
import { fetchInstalledAppList as doFetchInstalledAppList, uninstallApp, updatePinStatus } from '@/service/explore'
import ExploreContext from '@/context/explore-context'
import Confirm from '@/app/components/base/confirm'
import Divider from '@/app/components/base/divider'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import { useAppContext } from '@/context/app-context'
import { isDeveloper } from '@/app/components/common/DeveloperGuard'
// 下面这两个引用来自于header
import { WorkspaceProvider } from '@/context/workspace-context'
import AccountDropdown from '../../header/account-dropdown'
import { AppIconType } from '@/types/app' // 请根据实际路径调整

const AIToolsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#tools-gradient-1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="url(#tools-gradient-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="url(#tools-gradient-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="tools-gradient-1" x1="2" y1="7" x2="22" y2="7" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
      <linearGradient id="tools-gradient-2" x1="2" y1="19.5" x2="22" y2="19.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
      <linearGradient id="tools-gradient-3" x1="2" y1="14.5" x2="22" y2="14.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
    </defs>
  </svg>
)

const SelectedDiscoveryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M13.4135 1.11725C13.5091 1.09983 13.6483 1.08355 13.8078 1.11745C14.0143 1.16136 14.2017 1.26953 14.343 1.42647C14.4521 1.54766 14.5076 1.67634 14.5403 1.76781C14.5685 1.84673 14.593 1.93833 14.6136 2.01504L15.5533 5.5222C15.5739 5.5989 15.5985 5.69049 15.6135 5.77296C15.6309 5.86852 15.6472 6.00771 15.6133 6.16722C15.5694 6.37378 15.4612 6.56114 15.3043 6.70245C15.1831 6.81157 15.0544 6.86706 14.9629 6.89975C14.884 6.92796 14.7924 6.95247 14.7157 6.97299L14.676 6.98364C14.3365 7.07461 14.0437 7.15309 13.7972 7.19802C13.537 7.24543 13.2715 7.26736 12.9946 7.20849C12.7513 7.15677 12.5213 7.06047 12.3156 6.92591L9.63273 7.64477C9.86399 7.97104 9.99992 8.36965 9.99992 8.80001C9.99992 9.2424 9.85628 9.65124 9.6131 9.98245L12.5508 14.291C12.7582 14.5952 12.6797 15.01 12.3755 15.2174C12.0713 15.4248 11.6566 15.3464 11.4492 15.0422L8.51171 10.7339C8.34835 10.777 8.17682 10.8 7.99992 10.8C7.82305 10.8 7.65155 10.777 7.48823 10.734L4.5508 15.0422C4.34338 15.3464 3.92863 15.4248 3.62442 15.2174C3.32021 15.01 3.24175 14.5952 3.44916 14.291L6.3868 9.98254C6.14358 9.65132 5.99992 9.24244 5.99992 8.80001C5.99992 8.73795 6.00274 8.67655 6.00827 8.61594L4.59643 8.99424C4.51973 9.01483 4.42813 9.03941 4.34567 9.05444C4.25011 9.07185 4.11092 9.08814 3.95141 9.05423C3.74485 9.01033 3.55748 8.90215 3.41618 8.74522C3.38535 8.71097 3.3588 8.67614 3.33583 8.64171L2.49206 8.8678C2.41536 8.88838 2.32376 8.91296 2.2413 8.92799C2.14574 8.94541 2.00655 8.96169 1.84704 8.92779C1.64048 8.88388 1.45311 8.77571 1.31181 8.61877C1.20269 8.49759 1.1472 8.3689 1.1145 8.27744C1.08629 8.1985 1.06177 8.10689 1.04125 8.03018L0.791701 7.09885C0.771119 7.02215 0.746538 6.93055 0.731508 6.84809C0.714092 6.75253 0.697808 6.61334 0.731712 6.45383C0.775619 6.24726 0.883793 6.0599 1.04073 5.9186C1.16191 5.80948 1.2906 5.75399 1.38206 5.72129C1.461 5.69307 1.55261 5.66856 1.62932 5.64804L2.47318 5.42193C2.47586 5.38071 2.48143 5.33735 2.49099 5.29237C2.5349 5.08581 2.64307 4.89844 2.80001 4.75714C2.92119 4.64802 3.04988 4.59253 3.14134 4.55983C3.22027 4.53162 3.31189 4.50711 3.3886 4.48658L11.1078 2.41824C11.2186 2.19888 11.3697 2.00049 11.5545 1.83406C11.7649 1.64462 12.0058 1.53085 12.2548 1.44183C12.4907 1.35749 12.7836 1.27904 13.123 1.18809L13.1628 1.17744C13.2395 1.15686 13.3311 1.13228 13.4135 1.11725ZM13.3642 2.5039C13.0648 2.58443 12.8606 2.64126 12.7036 2.69735C12.5325 2.75852 12.4742 2.80016 12.4467 2.82492C12.3421 2.91912 12.2699 3.04403 12.2407 3.18174C12.233 3.21793 12.2261 3.28928 12.2587 3.46805C12.2927 3.6545 12.3564 3.89436 12.4559 4.26563L12.5594 4.652C12.6589 5.02328 12.7236 5.26287 12.7874 5.44133C12.8486 5.61244 12.8902 5.67079 12.915 5.69829C13.0092 5.80291 13.1341 5.87503 13.2718 5.9043C13.308 5.91199 13.3793 5.91887 13.5581 5.88629C13.7221 5.85641 13.9273 5.80352 14.2269 5.72356L13.3642 2.5039Z" fill="#155EEF" />
  </svg>
)

const DiscoveryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.74786 9.89676L12.0003 14.6669M7.25269 9.89676L4.00027 14.6669M9.3336 8.80031C9.3336 9.53669 8.73665 10.1336 8.00027 10.1336C7.26389 10.1336 6.66694 9.53669 6.66694 8.80031C6.66694 8.06393 7.26389 7.46698 8.00027 7.46698C8.73665 7.46698 9.3336 8.06393 9.3336 8.80031ZM11.4326 3.02182L3.57641 5.12689C3.39609 5.1752 3.30593 5.19936 3.24646 5.25291C3.19415 5.30001 3.15809 5.36247 3.14345 5.43132C3.12681 5.5096 3.15097 5.59976 3.19929 5.78008L3.78595 7.96951C3.83426 8.14984 3.85842 8.24 3.91197 8.29947C3.95907 8.35178 4.02153 8.38784 4.09038 8.40248C4.16866 8.41911 4.25882 8.39496 4.43914 8.34664L12.2953 6.24158L11.4326 3.02182ZM14.5285 6.33338C13.8072 6.52665 13.4466 6.62328 13.1335 6.55673C12.8581 6.49819 12.6082 6.35396 12.4198 6.14471C12.2056 5.90682 12.109 5.54618 11.9157 4.82489L11.8122 4.43852C11.6189 3.71722 11.5223 3.35658 11.5889 3.04347C11.6474 2.76805 11.7916 2.51823 12.0009 2.32982C12.2388 2.11563 12.5994 2.019 13.3207 1.82573C13.501 1.77741 13.5912 1.75325 13.6695 1.76989C13.7383 1.78452 13.8008 1.82058 13.8479 1.87289C13.9014 1.93237 13.9256 2.02253 13.9739 2.20285L14.9057 5.68018C14.954 5.86051 14.9781 5.95067 14.9615 6.02894C14.9469 6.0978 14.9108 6.16025 14.8585 6.20736C14.799 6.2609 14.7088 6.28506 14.5285 6.33338ZM2.33475 8.22033L3.23628 7.97876C3.4166 7.93044 3.50676 7.90628 3.56623 7.85274C3.61854 7.80563 3.6546 7.74318 3.66924 7.67433C3.68588 7.59605 3.66172 7.50589 3.6134 7.32556L3.37184 6.42403C3.32352 6.24371 3.29936 6.15355 3.24581 6.09408C3.19871 6.04176 3.13626 6.00571 3.0674 5.99107C2.98912 5.97443 2.89896 5.99859 2.71864 6.04691L1.81711 6.28847C1.63678 6.33679 1.54662 6.36095 1.48715 6.4145C1.43484 6.4616 1.39878 6.52405 1.38415 6.59291C1.36751 6.67119 1.39167 6.76135 1.43998 6.94167L1.68155 7.8432C1.72987 8.02352 1.75402 8.11369 1.80757 8.17316C1.85467 8.22547 1.91713 8.26153 1.98598 8.27616C2.06426 8.2928 2.15442 8.26864 2.33475 8.22033Z" stroke="#344054" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SelectedChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M8.00016 1.3335C4.31826 1.3335 1.3335 4.31826 1.3335 8.00016C1.3335 8.88571 1.50651 9.7325 1.8212 10.5074C1.84962 10.5773 1.86597 10.6178 1.87718 10.6476L1.88058 10.6568L1.88016 10.66C1.87683 10.6846 1.87131 10.7181 1.86064 10.7821L1.46212 13.1732C1.44424 13.2803 1.42423 13.4001 1.41638 13.5041C1.40782 13.6176 1.40484 13.7981 1.48665 13.9888C1.58779 14.2246 1.77569 14.4125 2.0115 14.5137C2.20224 14.5955 2.38274 14.5925 2.49619 14.5839C2.60025 14.5761 2.72006 14.5561 2.82715 14.5382L5.2182 14.1397C5.28222 14.129 5.31576 14.1235 5.34036 14.1202L5.34353 14.1197L5.35274 14.1231C5.38258 14.1344 5.42298 14.1507 5.49297 14.1791C6.26783 14.4938 7.11462 14.6668 8.00016 14.6668C11.6821 14.6668 14.6668 11.6821 14.6668 8.00016C14.6668 4.31826 11.6821 1.3335 8.00016 1.3335ZM4.00016 8.00016C4.00016 7.44788 4.44788 7.00016 5.00016 7.00016C5.55245 7.00016 6.00016 7.44788 6.00016 8.00016C6.00016 8.55245 5.55245 9.00016 5.00016 9.00016C4.44788 9.00016 4.00016 8.55245 4.00016 8.00016ZM7.00016 8.00016C7.00016 7.44788 7.44788 7.00016 8.00016 7.00016C8.55245 7.00016 9.00016 7.44788 9.00016 8.00016C9.00016 8.55245 8.55245 9.00016 8.00016 9.00016C7.44788 9.00016 7.00016 8.55245 7.00016 8.00016ZM11.0002 7.00016C10.4479 7.00016 10.0002 7.44788 10.0002 8.00016C10.0002 8.55245 10.4479 9.00016 11.0002 9.00016C11.5524 9.00016 12.0002 8.55245 12.0002 8.00016C12.0002 7.44788 11.5524 7.00016 11.0002 7.00016Z" fill="#155EEF" />
  </svg>
)

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 8H5.00667M8 8H8.00667M11 8H11.0067M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 8.7981 2.15582 9.5598 2.43871 10.2563C2.49285 10.3897 2.51992 10.4563 2.532 10.5102C2.54381 10.5629 2.54813 10.6019 2.54814 10.6559C2.54814 10.7111 2.53812 10.7713 2.51807 10.8916L2.12275 13.2635C2.08135 13.5119 2.06065 13.6361 2.09917 13.7259C2.13289 13.8045 2.19552 13.8671 2.27412 13.9008C2.36393 13.9393 2.48812 13.9186 2.73651 13.8772L5.10843 13.4819C5.22872 13.4619 5.28887 13.4519 5.34409 13.4519C5.3981 13.4519 5.43711 13.4562 5.48981 13.468C5.54369 13.4801 5.61035 13.5072 5.74366 13.5613C6.4402 13.8442 7.2019 14 8 14ZM5.33333 8C5.33333 8.1841 5.1841 8.33333 5 8.33333C4.81591 8.33333 4.66667 8.1841 4.66667 8C4.66667 7.81591 4.81591 7.66667 5 7.66667C5.1841 7.66667 5.33333 7.81591 5.33333 8ZM8.33333 8C8.33333 8.1841 8.1841 8.33333 8 8.33333C7.81591 8.33333 7.66667 8.1841 7.66667 8C7.66667 7.81591 7.81591 7.66667 8 7.66667C8.1841 7.66667 8.33333 7.81591 8.33333 8ZM11.3333 8C11.3333 8.1841 11.1841 8.33333 11 8.33333C10.8159 8.33333 10.6667 8.1841 10.6667 8C10.6667 7.81591 10.8159 7.66667 11 7.66667C11.1841 7.66667 11.3333 7.81591 11.3333 8Z" stroke="#344054" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
)

// 添加新的折叠图标组件
const FoldIcon = ({ fold }: { fold: boolean }) => (
  <svg 
    className={`transition-transform duration-200 ${fold ? 'rotate-0' : 'rotate-90'}`}
    width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 3L10 8L6 13" 
      stroke="url(#fold-gradient)" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="fold-gradient" x1="6" y1="8" x2="10" y2="8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
    </defs>
  </svg>
)

// 添加一个新的折叠按钮图标组件
const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg 
    className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : 'rotate-0'}`}
    width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="20" height="20" rx="10" fill="url(#collapse-bg-gradient)"/>
    <path d="M12.5 6L7.5 10L12.5 14" 
      stroke="white" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="collapse-bg-gradient" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
    </defs>
  </svg>
)

// 添加搜索图标组件
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" 
      stroke="url(#search-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="search-gradient" x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
    </defs>
  </svg>
)

// 修改 PinIcon 为渐变色版本
const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.43 2.81333C7.67034 2.31789 8.32966 2.31789 8.57 2.81333L9.9875 5.65333C10.0821 5.84878 10.2692 5.98279 10.4858 6.01211L13.6283 6.4456C14.1766 6.51728 14.3944 7.14747 13.9892 7.53533L11.7133 9.71878C11.5522 9.87263 11.4797 10.0974 11.5225 10.3162L12.0342 13.3624C12.1245 13.9082 11.5814 14.3221 11.0867 14.0617L8.2775 12.5529C8.1046 12.4602 7.8954 12.4602 7.7225 12.5529L4.91333 14.0617C4.41859 14.3221 3.87554 13.9082 3.96583 13.3624L4.4775 10.3162C4.52028 10.0974 4.44781 9.87263 4.28667 9.71878L2.01083 7.53533C1.60563 7.14747 1.82339 6.51728 2.37167 6.4456L5.51417 6.01211C5.73077 5.98279 5.91792 5.84878 6.0125 5.65333L7.43 2.81333Z" 
      fill="url(#pin-gradient)" />
    <defs>
      <linearGradient id="pin-gradient" x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
    </defs>
  </svg>
)

const RecentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4.66667V8L10 10M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" 
      stroke="url(#recent-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="recent-gradient" x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
    </defs>
  </svg>
)

const LibraryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.66667 12.6667H13.3333M2.66667 8H13.3333M2.66667 3.33334H13.3333" 
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// 添加分组类型定义
interface AppType {
  id: string;
  is_pinned: boolean;
  uninstallable: boolean;
  last_used_at: number;
  app_owner_tenant_name?: string;
  publish_path?: string;
  app: {
    name: string;
    icon_type: AppIconType;
    icon: string;
    icon_url: string;
    icon_background: string;
  };
}

interface PathType {
  path: string;
  apps: AppType[];
}

interface GroupedApp {
  tenant: string;
  paths: PathType[];
}

export type IExploreSideBarProps = {
  controlUpdateInstalledApps: number
}

const SideBar: FC<IExploreSideBarProps> = ({
  controlUpdateInstalledApps,
}) => {
  const { t } = useTranslation()
  const segments = useSelectedLayoutSegments()
  const lastSegment = segments.slice(-1)[0]
  const isDiscoverySelected = lastSegment === 'apps'
  const isChatSelected = lastSegment === 'chat'
  const { installedApps, setInstalledApps } = useContext(ExploreContext)

  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile

  const fetchInstalledAppList = async () => {
    const { installed_apps }: any = await doFetchInstalledAppList()
    setInstalledApps(installed_apps)
  }

  const [showConfirm, setShowConfirm] = useState(false)
  const [currId, setCurrId] = useState('')
  const handleDelete = async () => {
    const id = currId
    await uninstallApp(id)
    setShowConfirm(false)
    Toast.notify({
      type: 'success',
      message: t('common.api.remove'),
    })
    fetchInstalledAppList()
  }

  const handleUpdatePinStatus = async (id: string, isPinned: boolean) => {
    await updatePinStatus(id, isPinned)
    Toast.notify({
      type: 'success',
      message: t('common.api.success'),
    })
    fetchInstalledAppList()
  }

  useEffect(() => {
    fetchInstalledAppList()
  }, [])

  useEffect(() => {
    fetchInstalledAppList()
  }, [controlUpdateInstalledApps])

  const pinnedAppsCount = installedApps.filter(({ is_pinned }) => is_pinned).length
  const { userProfile } = useAppContext();
  const isUserDeveloper = isDeveloper(userProfile);

  // 添加折叠状态
  const [foldedTenants, setFoldedTenants] = useState<Record<string, boolean>>({})
  const [foldedPaths, setFoldedPaths] = useState<Record<string, boolean>>({})
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // 监听 URL 变化，当进入具体工具页面时自动折叠
  useEffect(() => {
    if (lastSegment && !isDiscoverySelected && !isChatSelected) {
      setIsCollapsed(true)
    }
  }, [lastSegment])

  // 分组处理函数
  const groupApps = (apps: any[]): GroupedApp[] => {
    // 初始化分组对象
    const groups: Record<string, Record<string, AppType[]>> = {}
    
    // 复制数组并确保 last_used_at 是数字类型
    const sortedApps = apps.map(app => ({
      ...app,
      // 如果 last_used_at 不存在，使用很早的时间戳
      last_used_at: app.last_used_at ? Number(app.last_used_at) : 788918400
    })) as AppType[]

    // 分离应用
    const pinnedApps = sortedApps.filter(app => app.is_pinned)
    const recentApps = sortedApps.filter(app => 
      !app.is_pinned && 
      app.last_used_at && 
      new Date(app.last_used_at * 1000).getFullYear() >= 2000
    ).sort((a, b) => Number(b.last_used_at) - Number(a.last_used_at)) // 确保数字比较
    const otherApps = sortedApps.filter(app => 
      !app.is_pinned && 
      (!app.last_used_at || new Date(app.last_used_at * 1000).getFullYear() < 2000)
    )

    const PINNED_GROUP = '置顶'
    const RECENT_GROUP = '最近使用'
    const LIBRARY_GROUP = 'AI人力资源库'

    // 初始化特殊分组
    groups[PINNED_GROUP] = {}
    groups[RECENT_GROUP] = {}
    groups[LIBRARY_GROUP] = {}

    // 处理置顶
    if (pinnedApps.length > 0) {
      pinnedApps.forEach(app => {
        const path = app.publish_path || '/'
        if (!groups[PINNED_GROUP][path]) {
          groups[PINNED_GROUP][path] = []
        }
        groups[PINNED_GROUP][path].push(app)
      })
    }

    // 处理最近使用的应用
    if (recentApps.length > 0) {
      recentApps.forEach(app => {
        const path = app.publish_path || '/'
        if (!groups[RECENT_GROUP][path]) {
          groups[RECENT_GROUP][path] = []
        }
        groups[RECENT_GROUP][path].push(app)
      })
    }

    // 处理其他应用
    otherApps.forEach(app => {
      const path = app.publish_path || '/'
      if (!groups[LIBRARY_GROUP][path]) {
        groups[LIBRARY_GROUP][path] = []
      }
      groups[LIBRARY_GROUP][path].push(app)
    })

    // 修改路径内的排序逻辑
    return Object.entries(groups)
      .map(([tenant, pathGroups]): GroupedApp => {
        // 计算每个路径下最新的使用时间
        const pathsWithLastUsed = Object.entries(pathGroups).map(([path, apps]) => {
          const latestUsedTime = Math.max(...apps.map(app => app.last_used_at))
          return {
            path,
            apps,
            latestUsedTime
          }
        })

        // 按照最新使用时间排序路径
        const paths = pathsWithLastUsed
          .sort((a, b) => {
            // 首先按照最新使用时间排序
            if (a.latestUsedTime !== b.latestUsedTime) {
              return b.latestUsedTime - a.latestUsedTime
            }
            // 如果最新使用时间相同，将根路径放在前面
            if (a.path === '/') return -1
            if (b.path === '/') return 1
            // 最后按照路径名称排序
            return a.path.localeCompare(b.path)
          })
          .map(({ path, apps }) => ({
            path,
            // 路径内的应用也按时间排序
            apps: apps.sort((a, b) => Number(b.last_used_at) - Number(a.last_used_at))
          }))

        return {
          tenant,
          paths: paths.filter(p => p.apps.length > 0)
        }
      })
      .filter(group => group.paths.length > 0)
      // 确保分组顺序：置顶 > 最近使用 > AI人力资源库
      .sort((a, b) => {
        if (a.tenant === PINNED_GROUP) return -1
        if (b.tenant === PINNED_GROUP) return 1
        if (a.tenant === RECENT_GROUP) return -1
        if (b.tenant === RECENT_GROUP) return 1
        return 0
      })
  }

  // 在 SideBar 组件内添加搜索状态
  const [searchQuery, setSearchQuery] = useState('')

  // 添加搜索过滤函数
  const filterGroupedApps = (apps: GroupedApp[], query: string): GroupedApp[] => {
    if (!query) return apps
    
    return apps.map(group => {
      // 过滤路径
      const filteredPaths = group.paths.map(pathGroup => {
        // 过滤应用
        const filteredApps = pathGroup.apps.filter(app => 
          app.app.name.toLowerCase().includes(query.toLowerCase())
        )
        return {
          ...pathGroup,
          apps: filteredApps
        }
      }).filter(pathGroup => pathGroup.apps.length > 0)

      return {
        ...group,
        paths: filteredPaths
      }
    }).filter(group => group.paths.length > 0)
  }

  // 修改时间戳处理函数
  const formatTimeAgo = (timestamp: number) => {
    const now = new Date()
    const past = new Date(timestamp * 1000) // 将秒转换为毫秒
    const msPerMinute = 60 * 1000
    const msPerHour = msPerMinute * 60
    const msPerDay = msPerHour * 24
    const msPerMonth = msPerDay * 30
    const msPerYear = msPerDay * 365

    const elapsed = now.getTime() - past.getTime()

    if (elapsed < msPerMinute) {
      const seconds = Math.round(elapsed/1000)
      return `${seconds}秒前`
    }
    else if (elapsed < msPerHour) {
      const minutes = Math.round(elapsed/msPerMinute)
      return `${minutes}分钟前`
    }
    else if (elapsed < msPerDay ) {
      const hours = Math.round(elapsed/msPerHour)
      return `${hours}小时前`
    }
    else if (elapsed < msPerMonth) {
      const days = Math.round(elapsed/msPerDay)
      return `${days}天前`
    }
    else if (elapsed < msPerYear) {
      const months = Math.round(elapsed/msPerMonth)
      return `${months}个月前`
    }
    else {
      const years = Math.round(elapsed/msPerYear)
      return `${years}年前`
    }
  }

  // 修改折叠按钮组件
  const CollapseButton = ({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) => (
    <div 
      className="flex items-center gap-1 py-0.5 pl-2 pr-1
                 rounded-lg cursor-pointer justify-end
                 transition-all duration-200 hover:border hover:border-gray-200/50
                 hover:bg-white/80 hover:backdrop-blur-sm hover:shadow-sm"
      onClick={onClick}
    >
      <span className="text-xs text-transparent bg-clip-text
                    bg-gradient-to-r from-violet-600 to-blue-600 font-medium">
        {collapsed ? '更多AI人力' : '收起'}
      </span>
      <CollapseIcon collapsed={collapsed} />
    </div>
  )

  // 普通用户的sidebar，会把头像昵称放上去,会展示已安装的app列表，是应用市场
  if (!isUserDeveloper) {
    const groupedApps = groupApps(installedApps)
    
    return (
      <div className="relative">
        {/* 固定在顶部的头像和折叠按钮容器 */}
        <div className="fixed top-6 left-6 z-[60]">
          <div className={cn(
            "inline-flex items-center bg-white/80 backdrop-blur-sm", 
            "border border-gray-200/50 rounded-xl shadow-sm",
            "py-2 pl-3 pr-16",
            isCollapsed && "animate-highlight-pulse"
          )}>
            <div className="shrink-0">
              <WorkspaceProvider>
                <AccountDropdown isMobile={isMobile} />
              </WorkspaceProvider>
            </div>
            <div className="mx-3 w-[1px] h-5 bg-gray-200/50" />
            <div className="">
              <CollapseButton 
                collapsed={isCollapsed} 
                onClick={() => setIsCollapsed(!isCollapsed)} 
              />
            </div>
          </div>
        </div>

        {/* Sidebar 主体部分 */}
        <div 
          className={cn(
            'fixed top-0 left-0 h-screen transition-all duration-500 ease-in-out z-50',
            'bg-gradient-to-b from-gray-50/80 to-white/80 backdrop-blur-md',
            'shadow-[1px_0_5px_rgba(0,0,0,0.05)]',
            isCollapsed 
              ? 'w-0 opacity-0 scale-95 origin-top-left' 
              : 'w-[40%] opacity-100 scale-100',
            'pt-24', // 为固定的头部留出空间
            'flex flex-col' // 添加 flex 布局
          )}
          style={{
            transform: isCollapsed 
              ? 'translate(-20px, -20px) scale(0.95)' 
              : 'translate(0, 0) scale(1)',
            transformOrigin: '24px 24px',
            visibility: isCollapsed ? 'hidden' : 'visible',
            transitionProperty: 'transform, opacity, width, visibility',
          }}
        >
          {/* 搜索框固定在顶部 */}
          <div className="px-6 mb-4 mt-2 flex-shrink-0">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm
                         border border-gray-100/50 transition-all duration-200
                         hover:shadow-md hover:border-violet-100/50">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="搜索 AI 人力资源..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-10 pr-4 bg-transparent
                           outline-none placeholder:text-gray-400 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 工具列表区域 - 可滚动 */}
          <div className="flex-1 px-6 overflow-y-auto min-h-0">
            {filterGroupedApps(groupedApps, searchQuery).map(({ tenant, paths }) => (
              <div key={tenant} className="mb-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm
                               border border-gray-100/50 transition-all duration-200
                               hover:shadow-md hover:border-violet-100/50
                               relative overflow-hidden">
                  {/* 标题区域 - 带渐变背景 */}
                  <div className="relative">
                    <div className="absolute inset-0" 
                         style={{
                           backgroundColor: tenant === '置顶' ? 'rgba(59, 130, 246, 0.03)' : 
                                          tenant === '最近使用' ? 'rgba(124, 58, 237, 0.03)' : 
                                          'rgba(99, 102, 241, 0.03)'
                         }}
                    />
                    <div className="relative p-2">
                      <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg
                                   hover:bg-white/50 cursor-pointer group"
                        onClick={() => setFoldedTenants(prev => ({ ...prev, [tenant]: !prev[tenant] }))}
                      >
                        {!isCollapsed && (
                          <>
                            {tenant === '置顶' && <PinIcon />}
                            {tenant === '最近使用' && <RecentIcon />}
                            {tenant === 'AI人力资源库' && <AIToolsIcon />}
                          </>
                        )}
                        {!isCollapsed && (
                          <div className="flex-1">
                            <p className='text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600 font-semibold text-sm'>
                              {tenant}
                            </p>
                            {tenant === 'AI人力资源库' && (
                              <p className='text-xs text-gray-500 mt-0.5'>
                                探索 AI 的无限可能
                              </p>
                            )}
                          </div>
                        )}
                        {!isCollapsed && (
                          <div className="shrink-0">
                            <FoldIcon fold={!!foldedTenants[tenant]} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 应用列表区域 - 纯白背景 */}
                  {!foldedTenants[tenant] && (
                    <div className="bg-white">
                      {paths.map(({ path, apps }) => (
                        <div key={path} className="mt-1">
                          {!isCollapsed && path !== '/' && (
                            <div className="flex items-center gap-2 px-2 py-1.5
                                         hover:bg-white/50 rounded-lg cursor-pointer group
                                        transition-colors duration-200"
                                  onClick={() => setFoldedPaths(prev => ({ ...prev, [path]: !prev[path] }))}
                            >
                              <FoldIcon fold={!!foldedPaths[path]} />
                              <span className="text-sm text-transparent bg-clip-text bg-gradient-to-r 
                                             from-violet-600 to-blue-600 transition-colors duration-200
                                             font-semibold">
                                {path}
                              </span>
                            </div>
                          )}
                          
                          {/* 应用列表对齐到最左边 */}
                          {!foldedPaths[path] && apps.map(({ id, is_pinned, uninstallable, app, last_used_at }) => (
                            <div key={id} className={cn(
                              "truncate px-2",
                              isCollapsed && "px-0"
                            )}>
                              {!isCollapsed && (
                                <div className="group/item">
                                  <Item
                                    isMobile={isMobile}
                                    name={app.name}
                                    icon_type={app.icon_type}
                                    icon={app.icon}
                                    icon_background={app.icon_background}
                                    icon_url={app.icon_url}
                                    id={id}
                                    isSelected={lastSegment?.toLowerCase() === id}
                                    isPinned={is_pinned}
                                    togglePin={() => handleUpdatePinStatus(id, !is_pinned)}
                                    uninstallable={uninstallable}
                                    onDelete={(id) => {
                                      setCurrId(id)
                                      setShowConfirm(true)
                                    }}
                                    lastUsedTime={tenant === '最近使用' && last_used_at ? formatTimeAgo(last_used_at) : undefined}
                                    className={cn(
                                      'transition-all duration-200',
                                      'hover:bg-transparent',
                                      'relative'
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 无搜索结果提示 */}
            {searchQuery && filterGroupedApps(groupedApps, searchQuery).length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm">未找到相关工具</p>
              </div>
            )}
          </div>
        </div>

        {showConfirm && (
          <Confirm
            title={t('explore.sidebar.delete.title')}
            content={t('explore.sidebar.delete.content')}
            isShow={showConfirm}
            onConfirm={handleDelete}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    )
  }
  
  // 开发者用户的sidebar，还是原来的样式,会展示所有app列表，是工作区
  if (isUserDeveloper) {
    return (
      <div className='w-fit sm:w-1/4 shrink-0 pt-6 px-4 border-gray-200 cursor-pointer'>
        <div>
          <Link
            href='/explore/apps'
            className={cn(isDiscoverySelected ? 'text-primary-600  bg-white font-semibold' : 'text-gray-700 font-medium hover:bg-gray-200', 'flex items-center pc:justify-start pc:w-full mobile:justify-center mobile:w-fit h-9 px-3 mobile:px-2 gap-2 rounded-lg')}
            style={isDiscoverySelected ? { boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' } : {}}
          >
            {isDiscoverySelected ? <SelectedDiscoveryIcon /> : <DiscoveryIcon />}
            {!isMobile && <div className='text-sm'>{t('explore.sidebar.discovery')}</div>}
          </Link>
        </div>

        <div className='mt-10'>
          <p className='pl-2 mobile:px-0 text-xs text-gray-500 break-all font-medium uppercase'>{t('explore.sidebar.workspace')}</p>
          <div className='mt-3 space-y-1 overflow-y-auto'
            style={{
              height: 'calc(100vh - 250px)',
            }}
          >
            {installedApps.map(({ id, is_pinned, uninstallable, app: { name, icon_type, icon, icon_url, icon_background } }, index) => (
              <React.Fragment key={id}>
                <Item
                  isMobile={isMobile}
                  name={name}
                  icon_type={icon_type}
                  icon={icon}
                  icon_background={icon_background}
                  icon_url={icon_url}
                  id={id}
                  isSelected={lastSegment?.toLowerCase() === id}
                  isPinned={is_pinned}
                  togglePin={() => handleUpdatePinStatus(id, !is_pinned)}
                  uninstallable={uninstallable}
                  onDelete={(id) => {
                    setCurrId(id)
                    setShowConfirm(true)
                  }}
                />
                {index === pinnedAppsCount - 1 && index !== installedApps.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {showConfirm && (
          <Confirm
            title={t('explore.sidebar.delete.title')}
            content={t('explore.sidebar.delete.content')}
            isShow={showConfirm}
            onConfirm={handleDelete}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    )
  }

}

export default React.memo(SideBar)
