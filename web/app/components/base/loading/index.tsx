import React from 'react'

import './style.css'

type ILoadingProps = {
  type?: 'area' | 'app'
}

const Loading = (
  { type = 'area' }: ILoadingProps = { type: 'area' },
) => {
  return (
    <div className={`flex w-full justify-center items-center flex-col gap-2 ${type === 'app' ? 'h-full' : ''}`}>
      <div className="loading-spinner">
        <div className="loading-spinner-inner"></div>
      </div>
      <div className="loading-text">
        Loading<span className="loading-dots">...</span>
      </div>
    </div>
  )
}

export default Loading
