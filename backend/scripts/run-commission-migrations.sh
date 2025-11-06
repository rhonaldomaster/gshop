#!/bin/bash

# Script para ejecutar las migraciones del sistema de comisiones y cargos
# Uso: ./scripts/run-commission-migrations.sh [environment]
# Ejemplo: ./scripts/run-commission-migrations.sh production

set -e # Exit on error

ENVIRONMENT=${1:-development}

echo "🚀 GSHOP - Sistema de Comisiones y Cargos"
echo "=========================================="
echo "Ejecutando migraciones en: $ENVIRONMENT"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm no está instalado${NC}"
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/.."

echo "📁 Directorio actual: $(pwd)"
echo ""

# Build TypeScript if needed
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔨 Compilando TypeScript..."
    npm run build
    echo -e "${GREEN}✅ Compilación exitosa${NC}"
    echo ""
fi

# Check database connection
echo "🔍 Verificando conexión a base de datos..."
if [ "$ENVIRONMENT" = "production" ]; then
    # In production, use DATABASE_URL from environment
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ Error: DATABASE_URL no está configurada${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ DATABASE_URL configurada${NC}"
else
    # In development, use local .env
    if [ ! -f "../.env" ]; then
        echo -e "${YELLOW}⚠️  Advertencia: Archivo .env no encontrado${NC}"
    fi
fi
echo ""

# Show migrations that will be executed
echo "📋 Migraciones a ejecutar:"
echo "  1. CreatePlatformConfigTable (1762200000000)"
echo "  2. AddCommissionFieldsToOrders (1762201000000)"
echo "  3. CreateInvoicesTable (1762202000000)"
echo "  4. CreateAuditLogsTable (1762203000000)"
echo ""

# Ask for confirmation in production
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}⚠️  ADVERTENCIA: Ejecutarás migraciones en PRODUCCIÓN${NC}"
    read -p "¿Continuar? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Operación cancelada"
        exit 0
    fi
    echo ""
fi

# Run migrations
echo "🔄 Ejecutando migraciones..."
npm run migration:run

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migraciones ejecutadas exitosamente${NC}"
    echo ""

    # Verify tables were created
    echo "🔍 Verificando tablas creadas..."
    echo "  - platform_config"
    echo "  - invoices"
    echo "  - audit_logs"
    echo "  - orders (campos actualizados)"
    echo ""

    # Insert initial config values (only in first run)
    echo "📝 Insertando configuración inicial..."
    echo "  - seller_commission_rate: 7%"
    echo "  - buyer_platform_fee_rate: 3%"
    echo "  - commission_calculation_trigger: delivered"
    echo "  - invoice_numbering_sequence: GSHOP-00000001"
    echo ""

    echo -e "${GREEN}🎉 Sistema de comisiones listo para usar${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Verificar datos en pgAdmin/psql"
    echo "  2. Ejecutar script de migración de datos: npm run migrate:commission-data"
    echo "  3. Probar endpoints:"
    echo "     - GET /api/v1/config/seller-commission-rate"
    echo "     - GET /api/v1/config/buyer-platform-fee-rate"
    echo "  4. Crear una orden de prueba para validar cálculos"
else
    echo ""
    echo -e "${RED}❌ Error ejecutando migraciones${NC}"
    echo "Revisa los logs arriba para más detalles"
    exit 1
fi
