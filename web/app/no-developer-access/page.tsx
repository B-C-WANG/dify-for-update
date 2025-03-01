'use client'

export default function NoDeveloperAccessPage() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-xl px-4">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          无开发者权限
        </h2>
        <p className="text-gray-600 mb-8">
          很抱歉，您目前没有开发者权限。如需访问此功能，请联系我们开通相关权限。
        </p>
        <div className="flex justify-center gap-4">
          {/* <a
            href="mailto:support@example.com"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            联系我们
          </a> */}
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
} 