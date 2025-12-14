import { Suspense } from 'react'
import { TodayScreen } from '@/components/custom'

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
      <TodayScreen />
    </Suspense>
  )
}
