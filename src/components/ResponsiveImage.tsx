interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
}

export function ResponsiveImage({ src, alt, className, sizes = '(max-width: 640px) 50vw, 300px', priority = false }: ResponsiveImageProps) {
  const baseName = src.replace(/_300\.(webp|png|jpg|jpeg)$/i, '')
  
  return (
    <picture>
      <source 
        srcSet={`${baseName}_300.avif 300w, ${baseName}_600.avif 600w`} 
        type="image/avif" 
        sizes={sizes} 
      />
      <source 
        srcSet={`${baseName}_300.webp 300w, ${baseName}_600.webp 600w`} 
        type="image/webp" 
        sizes={sizes} 
      />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        width={300}
        height={300}
        decoding={priority ? 'sync' : 'async'}
      />
    </picture>
  )
}
