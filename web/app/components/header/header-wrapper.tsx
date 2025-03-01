'use client'
import { usePathname } from 'next/navigation'
import s from './index.module.css'
import classNames from '@/utils/classnames'
import { isDeveloper } from '@/app/components/common/DeveloperGuard'
import AppContext, { useAppContext } from '@/context/app-context'

type HeaderWrapperProps = {
  children: React.ReactNode
}

const HeaderWrapper = ({
  children,
}: HeaderWrapperProps) => {
  const pathname = usePathname()
  const isBordered = ['/apps', '/datasets', '/datasets/create', '/tools'].includes(pathname)
  const { userProfile } = useAppContext()
  const isUserDeveloper = isDeveloper(userProfile);
  if (!isUserDeveloper) {
    return null; // 普通用户不需要header
  }
  return (
    <div className={classNames(
      'sticky top-0 left-0 right-0 z-30 flex flex-col grow-0 shrink-0 basis-auto min-h-[56px]',
      s.header,
      isBordered ? 'border-b border-divider-regular' : '',
    )}
    >
      {children}
    </div>
  )
}
export default HeaderWrapper
