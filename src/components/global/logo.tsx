import { cn } from '@/lib/utils'
import Image from 'next/image'
import React from 'react'
import { logoFont, PROJECT_NAME } from '../../../config'

type Props = {
  className?: string
  image?: boolean
  alwaysWhite?: boolean
}

const Logo = ({ className, image = true, alwaysWhite = false }: Props) => {
  return (
    <div className={cn('flex items-center gap-2 gap-x-1', className)}>
      {image && (
        <Image
          src="/garuda.png"
          alt="Garuda Logo"
          width={32}
          height={32}
          style={{ borderRadius: '50%' }}
          priority
        />
      )}
      <span className={cn('text-lg font-semibold', logoFont.className, alwaysWhite ? 'text-white dark:text-white' : 'text-black dark:text-white')}>
        GARUDA
      </span>
    </div>
  )
}

export default Logo