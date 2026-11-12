import ServicePage from '@/components/services/service-page'
import { services, serviceMetadata } from '@/lib/services'

const service = services[1]
export const metadata = serviceMetadata(service)

export default function Page() {
  return <ServicePage service={service} />
}
