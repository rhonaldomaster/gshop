import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';

export default function PrivacyScreen() {
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
          {t('legal.privacyTitle')}
        </GSText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <GSText variant="caption" color="textSecondary" style={styles.lastUpdated}>
            {t('legal.lastUpdated')}: Enero 2026
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            1. Introduccion
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            En GSHOP nos comprometemos a proteger la privacidad y seguridad de sus datos personales. Esta Politica de Privacidad explica como recopilamos, usamos, compartimos y protegemos su informacion cuando utiliza nuestra plataforma.
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            Marco Legal
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Esta politica cumple con la Ley 1581 de 2012 (Ley de Proteccion de Datos Personales de Colombia), Decreto 1377 de 2013, Ley 1266 de 2008 (Habeas Data), y regulaciones de la Superintendencia de Industria y Comercio (SIC).
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            Responsable del Tratamiento
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            GSHOP{'\n'}
            Email: legal@gshop.business{'\n'}
            Pais de operacion: Colombia (ventas) / Estados Unidos (sede corporativa)
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            2. Datos que Recopilamos
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            Informacion que Usted Proporciona
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            - Identificacion: Nombre, documento de identidad (CC, CE, PA){'\n'}
            - Contacto: Email, telefono{'\n'}
            - Direccion: Direccion de envio, ciudad, departamento, codigo postal{'\n'}
            - Pago: Informacion de tarjeta (procesada por Stripe){'\n'}
            - Preferencias: Idioma, notificaciones
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            Informacion Recopilada Automaticamente
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            - Datos del dispositivo (modelo, sistema operativo){'\n'}
            - Datos de uso (paginas visitadas, productos vistos){'\n'}
            - Datos de ubicacion (ciudad, region - si lo autoriza){'\n'}
            - Direccion IP y datos de conexion{'\n'}
            - Cookies y tecnologias similares
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            3. Uso de la Informacion
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            Finalidades Principales
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            - Procesar y entregar pedidos{'\n'}
            - Facilitar la comunicacion entre compradores y vendedores{'\n'}
            - Procesar pagos y desembolsos{'\n'}
            - Gestionar devoluciones y reembolsos{'\n'}
            - Crear y mantener su cuenta{'\n'}
            - Emitir facturas electronicas{'\n'}
            - Cumplir con obligaciones legales
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            Finalidades Secundarias (con su autorizacion)
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            - Enviar ofertas y promociones personalizadas{'\n'}
            - Informar sobre nuevos productos y funcionalidades{'\n'}
            - Realizar encuestas de satisfaccion{'\n'}
            - Sugerir productos basados en su historial
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            4. Comparticion de Datos
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Compartimos datos con:{'\n'}
            - Vendedores: Nombre, direccion de envio, telefono (para cumplimiento de pedidos){'\n'}
            - Stripe: Datos de pago (procesamiento de transacciones){'\n'}
            - Transportadoras: Nombre, direccion, telefono (entrega de productos){'\n'}
            - DIAN: Informacion de facturacion (cumplimiento fiscal)
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            No Vendemos sus Datos
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            GSHOP nunca vende su informacion personal a terceros con fines de marketing o publicidad externa.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            5. Proteccion de Datos
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Implementamos medidas de seguridad incluyendo:{'\n'}
            - Cifrado de datos en transito (TLS/SSL){'\n'}
            - Cifrado de datos sensibles en reposo{'\n'}
            - Autenticacion de dos factores (opcional){'\n'}
            - Monitoreo de accesos y anomalias{'\n'}
            - Copias de seguridad regulares{'\n'}
            - Acceso restringido por roles
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            6. Sus Derechos (ARCO)
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Segun la Ley 1581 de 2012, usted tiene derecho a:{'\n'}
            - Acceso: Conocer que datos tenemos sobre usted{'\n'}
            - Rectificacion: Corregir datos inexactos o incompletos{'\n'}
            - Cancelacion: Solicitar la eliminacion de sus datos{'\n'}
            - Oposicion: Oponerse al tratamiento para ciertas finalidades
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            Como Ejercer sus Derechos
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Envie solicitud a legal@gshop.business incluyendo nombre completo, documento de identidad, y descripcion de lo solicitado.{'\n\n'}
            Tiempos de respuesta: Consultas 10 dias habiles, Reclamos 15 dias habiles.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            7. Retencion de Datos
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            - Datos de cuenta activa: Mientras la cuenta este activa{'\n'}
            - Historial de transacciones: 10 anos (obligaciones tributarias){'\n'}
            - Datos de facturacion: 10 anos (requisitos DIAN){'\n'}
            - Comunicaciones de soporte: 3 anos{'\n'}
            - Datos de marketing: Hasta revocacion del consentimiento
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            8. Menores de Edad
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            GSHOP esta disenado para usuarios mayores de 18 anos. No recopilamos intencionalmente datos de menores de edad. Si descubrimos que hemos recopilado datos de un menor sin autorizacion parental, eliminaremos la informacion inmediatamente.
          </GSText>

          <GSText variant="h3" style={styles.sectionTitle}>
            9. Contacto
          </GSText>

          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Para consultas sobre privacidad:{'\n'}
            Email: legal@gshop.business{'\n'}
            Asunto: "Privacidad - [tipo de solicitud]"
          </GSText>

          <GSText variant="body" style={styles.subtitle}>
            Autoridad de Control
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.paragraph}>
            Si no esta satisfecho con nuestra respuesta, puede presentar una queja ante la Superintendencia de Industria y Comercio (SIC):{'\n'}
            Web: www.sic.gov.co{'\n'}
            Linea gratuita: 01 8000 910 165
          </GSText>

          <View style={styles.footer}>
            <GSText variant="caption" color="textSecondary" style={styles.footerText}>
              Al utilizar GSHOP, usted confirma que ha leido y comprendido esta Politica de Privacidad.
            </GSText>
            <GSText variant="caption" style={styles.footerBrand}>
              GSHOP - Protegiendo su informacion
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
