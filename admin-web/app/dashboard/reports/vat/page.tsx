'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface VatCategory {
  base: number;
  vat: number;
  total: number;
  orders: number;
}

interface VatBreakdown {
  excluido: VatCategory;
  exento: VatCategory;
  reducido: VatCategory;
  general: VatCategory;
}

interface VatReport {
  startDate: string;
  endDate: string;
  breakdown: VatBreakdown;
  totalBase: number;
  totalVat: number;
  totalWithVat: number;
  totalOrders: number;
}

export default function VatReportPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<VatReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor selecciona las fechas de inicio y fin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const token = localStorage.getItem('authToken'); // Adjust based on your auth implementation

      const response = await fetch(
        `${apiUrl}/analytics/vat-report?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }

      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      console.error('Error fetching VAT report:', err);
      setError(err.message || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getVatCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      excluido: 'Excluido (0%)',
      exento: 'Exento (0%)',
      reducido: 'Reducido (5%)',
      general: 'General (19%)',
    };
    return labels[category] || category;
  };

  const getVatCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      excluido: 'bg-gray-100 text-gray-800',
      exento: 'bg-green-100 text-green-800',
      reducido: 'bg-yellow-100 text-yellow-800',
      general: 'bg-blue-100 text-blue-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte de IVA</h1>
          <p className="text-muted-foreground">
            Desglose de IVA por categoría según la legislación colombiana
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchReport}
                disabled={loading || !startDate || !endDate}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </Card>

        {/* Report */}
        {report && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <p className="text-sm text-gray-600 mb-1">Total Base (sin IVA)</p>
                <p className="text-2xl font-bold">{formatCurrency(report.totalBase)}</p>
              </Card>
              <Card className="p-6 bg-blue-50">
                <p className="text-sm text-gray-600 mb-1">Total IVA Recaudado</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(report.totalVat)}</p>
              </Card>
              <Card className="p-6 bg-green-50">
                <p className="text-sm text-gray-600 mb-1">Total con IVA</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(report.totalWithVat)}</p>
              </Card>
            </div>

            {/* VAT Breakdown */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Desglose por Categoría de IVA</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(report.breakdown).map(([category, data]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getVatCategoryColor(category)}`}>
                        {getVatCategoryLabel(category)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base:</span>
                        <span className="font-medium">{formatCurrency(data.base)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IVA:</span>
                        <span className="font-medium">{formatCurrency(data.vat)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold">{formatCurrency(data.total)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Órdenes:</span>
                        <span>{data.orders}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Period Info */}
            <Card className="p-6 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Período del Reporte</p>
                  <p className="text-lg font-medium">
                    {new Date(report.startDate).toLocaleDateString('es-CO')} - {new Date(report.endDate).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total de Órdenes</p>
                  <p className="text-2xl font-bold">{report.totalOrders}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
