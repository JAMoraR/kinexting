import ServicePage from '@/components/services/service-page'
import { services, serviceMetadata } from '@/lib/services'

const service = services[2]
export const metadata = serviceMetadata(service)

export default function Page() {
  return <ServicePage service={service} />
}
