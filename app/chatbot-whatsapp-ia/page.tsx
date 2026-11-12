import ServicePage from '@/components/services/service-page'
import { services, serviceMetadata } from '@/lib/services'

const service = services[0]
export const metadata = serviceMetadata(service)

export default function Page() {
  return <ServicePage service={service} />
}
