'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Colombian VAT rates
const VAT_RATES = {
  excluido: 0,
  exento: 0,
  reducido: 0.05,
  general: 0.19,
}

type VatType = keyof typeof VAT_RATES

// Helper functions
function getVatRate(vatType: VatType): number {
  return VAT_RATES[vatType] || 0
}

function calculateBasePrice(priceWithVat: number, vatType: VatType): number {
  const rate = getVatRate(vatType)
  return priceWithVat / (1 + rate)
}

function calculateVatAmount(priceWithVat: number, vatType: VatType): number {
  const basePrice = calculateBasePrice(priceWithVat, vatType)
  return priceWithVat - basePrice
}

export default function NewProductPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    vatType: 'general' as VatType,
    category: '',
    sku: '',
    stock: '',
    images: [] as string[],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          vatType: formData.vatType,
          category: formData.category,
          sku: formData.sku,
          quantity: parseInt(formData.stock),
          images: formData.images.length > 0 ? formData.images : [],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create product')
      }

      alert('Product created successfully!')
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const price = parseFloat(formData.price) || 0
  const basePrice = price > 0 ? calculateBasePrice(price, formData.vatType) : 0
  const vatAmount = price > 0 ? calculateVatAmount(price, formData.vatType) : 0
  const vatRate = getVatRate(formData.vatType)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
          <p className="text-gray-600">Add a new product to your catalog</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g., Premium Wireless Headphones"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="Describe your product..."
            />
          </div>

          {/* VAT Type Selector */}
          <div>
            <label htmlFor="vatType" className="block text-sm font-medium text-gray-700">
              Tipo de IVA (Colombian Tax Category) *
            </label>
            <select
              id="vatType"
              name="vatType"
              value={formData.vatType}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="excluido">Excluido (0% - Sin derecho a descuentos)</option>
              <option value="exento">Exento (0% - Con derecho a descuentos)</option>
              <option value="reducido">Reducido (5%)</option>
              <option value="general">General (19%)</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Selecciona la categoría de IVA según la ley colombiana
            </p>
          </div>

          {/* Price with VAT */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Precio CON IVA incluido (COP) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="100"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g., 119000"
            />
            <p className="mt-1 text-sm text-gray-500">
              Este es el precio que verán los clientes (IVA incluido)
            </p>

            {/* Price Breakdown */}
            {price > 0 && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Desglose de Precio:
                </p>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Base sin IVA:</span>
                    <span className="font-medium">${basePrice.toFixed(2)} COP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({(vatRate * 100).toFixed(0)}%):</span>
                    <span className="font-medium">${vatAmount.toFixed(2)} COP</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                    <span className="font-semibold">Precio final:</span>
                    <span className="font-bold">${price.toFixed(2)} COP</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g., Electronics"
            />
          </div>

          {/* SKU */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g., WH-001"
            />
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
              Stock Quantity *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g., 100"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/products"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
