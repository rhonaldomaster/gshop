'use client'

import { useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { X, Upload, ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { apiClient } from '@/lib/api-client'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  maxSizeMB?: number
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  maxSizeMB = 20,
}: ImageUploadProps) {
  const t = useTranslations('products.imageUpload')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      // Check total images count
      if (images.length + files.length > maxImages) {
        alert(t('errorMaxImages', { max: maxImages }))
        return
      }

      // Validate file sizes and types
      const maxSize = maxSizeMB * 1024 * 1024
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!allowedTypes.includes(file.type)) {
          alert(t('errorInvalidType', { name: file.name }))
          return
        }
        if (file.size > maxSize) {
          alert(t('errorFileSize', { name: file.name, size: maxSizeMB }))
          return
        }
      }

      setUploading(true)

      try {
        const formData = new FormData()
        for (let i = 0; i < files.length; i++) {
          formData.append('images', files[i])
        }

        const response = await apiClient.uploadFiles('/products/upload', formData) as { urls: string[] }
        onChange([...images, ...response.urls])
      } catch (error) {
        console.error('Error uploading images:', error)
        alert(error instanceof Error ? error.message : t('errorUploadFailed'))
      } finally {
        setUploading(false)
      }
    },
    [images, maxImages, maxSizeMB, onChange]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault()
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles]
  )

  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index)
      onChange(newImages)
    },
    [images, onChange]
  )

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={onButtonClick}
              disabled={uploading || images.length >= maxImages}
              className="text-sm font-medium text-primary hover:text-primary/90 disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {t('clickToUpload')}
            </button>
            <span className="text-sm text-muted-foreground"> {t('orDragAndDrop')}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('maxFilesInfo', { maxSize: maxSizeMB, maxImages: maxImages })}
          </p>
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-border">
                <Image
                  src={url}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                title={t('removeImage')}
              >
                <X className="h-4 w-4" />
              </button>

              {index === 0 && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                  {t('mainImage')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('noImagesYet')}</p>
        </div>
      )}
    </div>
  )
}
