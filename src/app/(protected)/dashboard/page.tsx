import { Separator } from '@/components/ui/separator'
import React from 'react'
import { logoFont } from '../../../../config'
import { SidebarTrigger } from '@/components/ui/sidebar'

const DashboardPage = () => {
  const cards = [
    {
      title: "Books",
      description: "Total books published",
      data: "10"
    },
    {
      title: "Pages",
      description: "Total pages read",
      data: "100"
    },
    {
      title: "Reviews",
      description: "Total reviews written",
      data: "10"
    }
  ]
  return (
    <div>
      <header className='flex sticky top-0 items-center justify-between'>
        <h1 className={`text-lg ${logoFont.className}`}>Dashboard</h1>
        <SidebarTrigger />
      </header>
      <Separator className='mt-2' />
      <main className='mt-4 w-full flex items-center justify-between md:flex-row flex-col gap-4'>
        {cards.map((card, itr) => (
          <div key={itr} className='w-full' >
            <h1>{card.title}</h1>
          </div>
        ))}
      </main>
    </div>
  )
}

export default DashboardPage