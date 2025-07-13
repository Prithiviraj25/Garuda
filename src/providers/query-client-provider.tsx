"use client"
import React from 'react'
import { 
    QueryClient, 
    QueryClientProvider as ReactQueryClientProvider 
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

type Props = {
    children: React.ReactNode
}

const QueryClientProvider = ({ children }: Props) => {
    const queryClient = new QueryClient()
  return (
    <ReactQueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
    </ReactQueryClientProvider>
  )
}

export default QueryClientProvider