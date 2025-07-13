"use client"
import React from 'react'
import { ThemeProvider } from './theme-provider'
import QueryClientProvider from './query-client-provider'

type Props = {
    children: React.ReactNode
}

const GlobalProvider = ({ children }: Props) => {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <QueryClientProvider>
                {children}
            </QueryClientProvider>
        </ThemeProvider>
    )
}

export default GlobalProvider