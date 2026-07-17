'use client'

import { useState } from 'react'
import Image from 'next/image'

interface VehicleImageProps {
  src?: string
  alt: string
  priority?: boolean
}

export function VehicleImage({ src, alt, priority }: VehicleImageProps) {
  const [error, setError] = useState(false)

  return (
    <Image
      src={error || !src ? '/empty.jpeg' : src}
      alt={alt}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-500"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={priority}
      onError={() => setError(true)}
    />
  )
}
