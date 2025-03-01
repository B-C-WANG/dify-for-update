'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAppContext } from '@/context/app-context'

// 添加 isDeveloper 工具函数
export const isDeveloper = (userProfile: any) => {
  return userProfile?.role === 'developer'
}

export default function DeveloperGuard({
  children
}: {
  children: React.ReactNode
}) {
  const { userProfile } = useAppContext()
  const router = useRouter()

  useEffect(() => {
    // 使用新的 isDeveloper 函数
    if (userProfile && !isDeveloper(userProfile)) {
      router.push('/no-developer-access')
    //   router.push('/404')

    }
  }, [userProfile, router])

  // 使用新的 isDeveloper 函数
  if (!userProfile || !isDeveloper(userProfile))
    return null

  return <>{children}</>
} 