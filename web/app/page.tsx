import Link from 'next/link'
import Loading from '@/app/components/base/loading'
import { Metadata } from 'next'
import config from '@/app/custom-content/config'

export const metadata: Metadata = {
  icons: {
    icon: config.brand.customFavicon,
    shortcut: config.brand.customFavicon,
    apple: config.brand.customFavicon,
  }
}

const Home = async () => {
  return (
    <div className="flex flex-col justify-center min-h-screen py-12 sm:px-6 lg:px-8">

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Loading type='area' />
        <div className="mt-10 text-center">
          <Link href='/explore/apps'>🚀</Link>
        </div>
      </div>
    </div>
  )
}
export default Home

