import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';

export default function TermsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation('translation');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h2" style={styles.headerTitle}>
          {t('legal.termsTitle')}
        </GSText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <GSText variant="caption" color="textSecondary" style={styles.lastUpdated}>
            {t('legal.lastUpdated')}: Enero 2026
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            1. Introduccion y Aceptacion
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            1.1 Acerca de GSHOP
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            GSHOP es una plataforma de comercio electronico que conecta compradores con vendedores independientes. GSHOP actua unicamente como intermediario tecnologico y no es el vendedor directo de los productos ofrecidos en la plataforma.
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            1.2 Aceptacion de los Terminos
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Al descargar, instalar o utilizar la aplicacion movil de GSHOP, usted acepta estos Terminos y Condiciones en su totalidad. Si no esta de acuerdo con alguna parte de estos terminos, no debe utilizar la plataforma.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            2. Registro y Cuenta de Usuario
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            2.1 Requisitos de Elegibilidad
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Para utilizar GSHOP, usted debe ser mayor de 18 anos de edad, tener capacidad legal para celebrar contratos vinculantes, proporcionar informacion veraz y actualizada, y no haber sido suspendido o eliminado previamente de la plataforma.
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            2.2 Compras como Invitado
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            GSHOP permite realizar compras sin crear una cuenta (checkout como invitado). En este caso, debera proporcionar informacion de contacto valida y un documento de identificacion para completar la transaccion.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            3. Productos y Vendedores
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            GSHOP es una plataforma de intermediacion. Los productos son ofrecidos y vendidos por vendedores independientes (sellers) registrados en la plataforma. GSHOP no fabrica, almacena ni envia los productos, no garantiza la disponibilidad de los productos, no es responsable de la calidad o autenticidad de los productos, y no establece los precios de los productos.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            4. Pagos
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            GSHOP procesa pagos a traves de Stripe, un proveedor de servicios de pago seguro. Los metodos de pago disponibles incluyen tarjetas de credito y debito, y otros metodos habilitados por Stripe en Colombia. GSHOP no almacena informacion completa de tarjetas. Toda la informacion de pago es procesada de forma segura por Stripe bajo estandares PCI-DSS.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            5. Envios
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Los envios son gestionados directamente por los vendedores. Cada vendedor establece sus tarifas de envio (local y nacional), los tiempos estimados de entrega, y las zonas de cobertura. Una vez despachado su pedido, el vendedor proporcionara informacion de seguimiento cuando este disponible.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            6. Derecho de Retracto (Ley 1480 de 2011)
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            De acuerdo con el Estatuto del Consumidor de Colombia, usted tiene derecho a retractarse de su compra dentro de los cinco (5) dias habiles siguientes a la entrega del producto, sin necesidad de justificar su decision y sin penalidad alguna.
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Para ejercer el derecho de retracto: el producto debe estar en su empaque original, el producto no debe haber sido usado, debe conservar todas las etiquetas y accesorios, y debe presentar la factura o comprobante de compra.
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            No aplica el derecho de retracto para: productos perecederos, productos personalizados o hechos a medida, productos de higiene personal que hayan sido abiertos, contenido digital descargado, y servicios que ya hayan sido prestados.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            7. Productos Prohibidos
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Esta prohibida la compra o intento de compra de: armas de fuego, municiones y explosivos; drogas ilegales o sustancias controladas no reguladas; servicios sexuales o contenido de explotacion; productos falsificados o que infrinjan propiedad intelectual; productos robados; y cualquier producto cuya venta sea ilegal en Colombia.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            8. Privacidad
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            GSHOP recopila y procesa datos personales de acuerdo con la Ley 1581 de 2012 (Ley de Proteccion de Datos Personales de Colombia). Para mas informacion, consulte nuestra Politica de Privacidad.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            9. Limitacion de Responsabilidad
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            GSHOP no sera responsable por danos indirectos, incidentales o consecuentes; perdidas de datos o interrupciones del servicio; acciones u omisiones de los vendedores; productos defectuosos vendidos por terceros; y eventos de fuerza mayor.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            10. Contacto
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Para consultas, reclamos o sugerencias: Email: legal@gshop.business o a traves de la seccion "Ayuda" o "Soporte" en la aplicacion.
          </GSText>

          <View style={styles.footer}>
            <GSText variant="caption" color="textSecondary" style={styles.footerText}>
              Al utilizar GSHOP, usted confirma que ha leido, entendido y aceptado estos Terminos y Condiciones.
            </GSText>
            <GSText variant="caption" style={styles.footerBrand}>
              GSHOP - Conectando compradores y vendedores
            </GSText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footerBrand: {
    fontWeight: '600',
  },
});
