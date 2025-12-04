'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  BarChart3,
  ImageIcon
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  basePrice: number
  vatAmount: number
  vatType: string
  comparePrice?: number
  costPerItem?: number
  sku: string
  quantity: number
  trackQuantity: boolean
  barcode?: string
  weight?: number
  images: string[]
  variants?: any[]
  tags: string[]
  status: string
  isVisible: boolean
  viewsCount: number
  ordersCount: number
  rating: number
  reviewsCount: number
  category?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('products')
  const { data: session } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (params.id && session?.accessToken) {
      fetchProduct()
    }
  }, [params.id, session])

  const fetchProduct = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch product')

      const data = await response.json()
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (response.ok) {
        router.push('/dashboard/products')
      } else {
        alert(t('failedToDelete'))
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert(t('failedToDelete'))
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{t('productNotFound')}</h2>
          <p className="text-gray-600 mb-4">
            {t('productNotFoundMessage')}
          </p>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToProductsList')}
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/products"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToProducts')}
            </Link>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/products/${product.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="mr-2 h-4 w-4" />
              {t('edit')}
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('delete')}
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600">SKU: {product.sku}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('images')}
              </h2>
              {product.images?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
                    >
                      <img
                        src={image}
                        alt={`${product.name} - ${t('imageAlt')} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">{t('noImagesAvailable')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('description')}
              </h2>
              <div className="space-y-4">
                {product.shortDescription && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{t('shortDescriptionLabel')}</h4>
                    <p className="text-gray-600">{product.shortDescription}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{t('fullDescriptionLabel')}</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
                </div>
                {product.tags?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{t('tagsLabel')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                {t('priceAndVat')}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('salePrice')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(Number(product.price || 0), 'COP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('vatTypeLabel')}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">
                    {t(`vatLabels.${product.vatType}`)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('basePrice')}</p>
                  <p className="text-lg font-medium text-gray-900">
                    {formatCurrency(Number(product.basePrice || 0), 'COP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('vatAmount')}</p>
                  <p className="text-lg font-medium text-gray-900">
                    {formatCurrency(Number(product.vatAmount || 0), 'COP')}
                  </p>
                </div>
                {product.comparePrice && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('comparePriceLabel')}</p>
                    <p className="text-lg font-medium line-through text-gray-500">
                      {formatCurrency(Number(product.comparePrice), 'COP')}
                    </p>
                  </div>
                )}
                {product.costPerItem && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('costPerItemLabel')}</p>
                    <p className="text-lg font-medium text-gray-900">
                      {formatCurrency(Number(product.costPerItem), 'COP')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                {t('inventoryLabel')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('stockQuantity')}</p>
                  <p className="text-lg font-medium text-gray-900">
                    {Number(product.quantity || 0)} {t('units')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('trackQuantityLabel')}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.trackQuantity
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.trackQuantity ? t('yes') : t('no')}
                  </span>
                </div>
                {product.barcode && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('barcodeLabel')}</p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-900">
                      {product.barcode}
                    </code>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('weightLabel')}</p>
                    <p className="text-lg font-medium text-gray-900">
                      {Number(product.weight)} kg
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('statusLabel')}</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">{t('productStatusLabel')}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status === 'active' ? t('active') : t('inactive')}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-2">{t('visibilityLabel')}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.isVisible
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.isVisible ? t('visible') : t('hidden')}
                  </span>
                </div>
              </div>
            </div>

            {/* Category */}
            {product.category && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('organizationLabel')}</h2>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('category')}</p>
                  <p className="font-medium text-gray-900">{product.category.name}</p>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                {t('statisticsLabel')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('viewsLabel')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Number(product.viewsCount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('ordersLabel')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Number(product.ordersCount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('ratingLabel')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Number(product.rating || 0).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('reviewsLabel')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Number(product.reviewsCount || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('metadataLabel')}</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">{t('productIdLabel')}</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all text-gray-900">
                    {product.id}
                  </code>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">{t('slugLabel')}</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block text-gray-900">
                    {product.slug}
                  </code>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">{t('createdLabel')}</p>
                  <p className="text-gray-900">{formatDate(product.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">{t('lastUpdatedLabel')}</p>
                  <p className="text-gray-900">{formatDate(product.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
