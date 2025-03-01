'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/app/components/base/modal'
import Input from '@/app/components/base/input'
import Select from '@/app/components/base/select'
import cn from 'classnames'
import type { Item } from '@/app/components/base/select'

export type PublishStatus = 'normal' | 'enable' | 'disable'

const statusOptions = [
  { 
    value: 'normal',
    name: '未发布',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600'
  },
  { 
    value: 'enable',
    name: '已发布',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  { 
    value: 'disable',
    name: '停用',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600'
  }
]

export type PublishModalProps = {
  show: boolean
  onClose: () => void
  publishPath: string
  publishStatus: string
  onConfirm: (publishPath: string, publishStatus: string) => void
}

const PublishModal: React.FC<PublishModalProps> = ({
  show,
  onClose,
  publishPath,
  publishStatus,
  onConfirm,
}) => {
  console.log('PublishModal render - props:', { publishPath, publishStatus })

  const [path, setPath] = useState(publishPath || '')
  const [status, setStatus] = useState(publishStatus || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    console.log('PublishModal useEffect - updating state:', { publishPath, publishStatus })
    setPath(publishPath || '')
    setStatus(publishStatus || '')
  }, [publishPath, publishStatus])

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true)
      await onConfirm(path, status)
      onClose()
    } catch (error) {
      console.error('Failed to update publish info:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelect = (value: Item) => {
    console.log('PublishModal handleSelect:', value)
    setStatus(value.value as string)
  }

  return (
    <Modal
      isShow={show}
      onClose={onClose}
      title="编辑发布信息"
      overflowVisible={true}
    >
      <div className='space-y-4 p-4'>
        <div>
          <div className='mb-2 text-sm font-medium text-gray-900'>发布路径</div>
          <Input
            className='w-full'
            value={path}
            onChange={e => setPath(e.target.value)}
            placeholder="请输入发布路径"
          />
        </div>
        <div className="relative z-[999]" style={{ position: 'static' }}>
          <div className='mb-2 text-sm font-medium text-gray-900'>发布状态</div>
          <Select
            className='w-full'
            items={statusOptions}
            defaultValue={status}
            placeholder="请选择发布状态"
            onSelect={handleSelect}
            allowSearch={false}
            renderOption={({ item }) => (
              <div className={cn(
                'px-2 py-1 rounded-md inline-flex items-center cursor-pointer',
                item.bgColor,
                item.textColor,
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}>
                {item.name}
              </div>
            )}
          />
        </div>
      </div>
      <div className="flex flex-row justify-end gap-2 px-4 pb-4 relative z-0">
        <button
          className="px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100"
          onClick={onClose}
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? '提交中...' : '确认'}
        </button>
      </div>
    </Modal>
  )
}

export default PublishModal 