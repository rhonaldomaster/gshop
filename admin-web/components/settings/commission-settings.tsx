'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle, Info } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommissionConfig {
  key: string;
  value: {
    rate: number;
    type: string;
  };
  description: string;
  category: string;
}

export function CommissionSettings() {
  const t = useTranslations('settings');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerCommissionRate, setSellerCommissionRate] = useState(7);
  const [buyerPlatformFeeRate, setBuyerPlatformFeeRate] = useState(3);

  useEffect(() => {
    fetchCommissionSettings();
  }, []);

  const fetchCommissionSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch seller commission rate
      const sellerConfig = await apiClient.get<CommissionConfig>('/config/seller_commission_rate');
      setSellerCommissionRate(sellerConfig.value?.rate || 7);

      // Fetch buyer platform fee rate
      const buyerConfig = await apiClient.get<CommissionConfig>('/config/buyer_platform_fee_rate');
      setBuyerPlatformFeeRate(buyerConfig.value?.rate || 3);
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones de comisiones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (sellerCommissionRate < 0 || sellerCommissionRate > 50) {
      toast({
        title: 'Error de Validación',
        description: 'La comisión al vendedor debe estar entre 0% y 50%',
        variant: 'destructive',
      });
      return;
    }

    if (buyerPlatformFeeRate < 0 || buyerPlatformFeeRate > 50) {
      toast({
        title: 'Error de Validación',
        description: 'El cargo al comprador debe estar entre 0% y 50%',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update seller commission rate
      await apiClient.put('/config/seller_commission_rate', {
        value: {
          rate: sellerCommissionRate,
          type: 'percentage',
        },
      });

      // Update buyer platform fee rate
      await apiClient.put('/config/buyer_platform_fee_rate', {
        value: {
          rate: buyerPlatformFeeRate,
          type: 'percentage',
        },
      });

      toast({
        title: 'Cambios Guardados',
        description: 'Las configuraciones de comisiones se actualizaron correctamente',
      });
    } catch (error: any) {
      console.error('Error saving commission settings:', error);
      toast({
        title: 'Error',
        description: error?.message || 'No se pudieron guardar las configuraciones',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="gshop-card">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Cargando configuraciones...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sellerCommissionExample = (100000 * sellerCommissionRate / 100).toLocaleString('es-CO');
  const buyerFeeExample = (100000 * buyerPlatformFeeRate / 100).toLocaleString('es-CO');

  return (
    <div className="space-y-6">
      {/* Alert informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los cambios en las tasas se aplicarán <strong>SOLO a nuevas órdenes</strong>.
          Las órdenes existentes mantendrán las tasas con las que fueron creadas.
        </AlertDescription>
      </Alert>

      {/* Comisión al Vendedor */}
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>Comisión al Vendedor</CardTitle>
          <CardDescription>
            Porcentaje cobrado sobre las ventas completadas (entregadas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sellerCommissionRate">
              Tasa de Comisión (%)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="sellerCommissionRate"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={sellerCommissionRate}
                onChange={(e) => setSellerCommissionRate(parseFloat(e.target.value) || 0)}
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">
                (Rango: 0% - 50%)
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">Ejemplo:</p>
            <p className="text-sm text-muted-foreground">
              Con {sellerCommissionRate}%, una venta de <strong>$100.000</strong> genera una comisión de{' '}
              <strong className="text-primary">${sellerCommissionExample}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cargo por Uso de Plataforma (Comprador) */}
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>Cargo por Uso de Plataforma (Comprador)</CardTitle>
          <CardDescription>
            Porcentaje adicional cobrado al comprador en el checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyerPlatformFeeRate">
              Tasa de Cargo (%)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="buyerPlatformFeeRate"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={buyerPlatformFeeRate}
                onChange={(e) => setBuyerPlatformFeeRate(parseFloat(e.target.value) || 0)}
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">
                (Rango: 0% - 50%)
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">Ejemplo:</p>
            <p className="text-sm text-muted-foreground">
              Con {buyerPlatformFeeRate}%, una compra de <strong>$100.000</strong> tendrá un cargo de{' '}
              <strong className="text-primary">${buyerFeeExample}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gshop-button-primary"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
