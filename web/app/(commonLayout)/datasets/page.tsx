import Container from './Container'
import DeveloperGuard from '@/app/components/common/DeveloperGuard'

const AppList = async () => {
  return( 
    <DeveloperGuard>
  <Container />
  </DeveloperGuard>)
}

export const metadata = {
  title: 'Datasets - Dify',
}

export default AppList