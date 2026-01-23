'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('legal');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/auth/register"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToRegister')}
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('privacyTitle')}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {t('lastUpdated')}: Enero 2026
          </p>

          <div className="prose prose-gray max-w-none">
            <h2>1. Introduccion</h2>

            <h3>1.1 Compromiso con la Privacidad</h3>
            <p>
              En GSHOP nos comprometemos a proteger la privacidad y seguridad de sus datos
              personales. Esta Politica de Privacidad explica como recopilamos, usamos,
              compartimos y protegemos su informacion cuando utiliza nuestra plataforma.
            </p>

            <h3>1.2 Marco Legal</h3>
            <p>Esta politica cumple con:</p>
            <ul>
              <li><strong>Ley 1581 de 2012</strong> - Ley de Proteccion de Datos Personales de Colombia</li>
              <li><strong>Decreto 1377 de 2013</strong> - Reglamentario de la Ley 1581</li>
              <li><strong>Ley 1266 de 2008</strong> - Habeas Data (datos financieros)</li>
              <li>Regulaciones de la Superintendencia de Industria y Comercio (SIC)</li>
            </ul>

            <h3>1.3 Responsable del Tratamiento</h3>
            <p>
              <strong>GSHOP</strong><br />
              Email: legal@gshop.business<br />
              Pais de operacion: Colombia (ventas) / Estados Unidos (sede corporativa)
            </p>

            <h2>2. Datos que Recopilamos</h2>

            <h3>2.1 Informacion que Usted Proporciona (Vendedores)</h3>
            <table>
              <thead>
                <tr>
                  <th>Tipo de Dato</th>
                  <th>Ejemplos</th>
                  <th>Finalidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Identificacion personal</td>
                  <td>Nombre, cedula, foto</td>
                  <td>Verificacion KYC</td>
                </tr>
                <tr>
                  <td>Informacion comercial</td>
                  <td>Razon social, NIT, RUT</td>
                  <td>Cumplimiento tributario</td>
                </tr>
                <tr>
                  <td>Documentos legales</td>
                  <td>Camara de Comercio</td>
                  <td>Verificacion de negocio</td>
                </tr>
                <tr>
                  <td>Informacion bancaria</td>
                  <td>Cuenta bancaria, titular</td>
                  <td>Desembolsos de pagos</td>
                </tr>
                <tr>
                  <td>Contacto comercial</td>
                  <td>Email, telefono, direccion</td>
                  <td>Comunicacion operativa</td>
                </tr>
              </tbody>
            </table>

            <h3>2.2 Informacion Recopilada Automaticamente</h3>
            <ul>
              <li>Datos del dispositivo (modelo, sistema operativo)</li>
              <li>Datos de uso (paginas visitadas, funciones utilizadas)</li>
              <li>Direccion IP y datos de conexion</li>
              <li>Cookies y tecnologias similares</li>
            </ul>

            <h2>3. Uso de la Informacion</h2>

            <h3>3.1 Finalidades Principales</h3>
            <ul>
              <li>Procesar su registro y verificacion KYC</li>
              <li>Facilitar las ventas y transacciones</li>
              <li>Procesar pagos y desembolsos</li>
              <li>Comunicarnos sobre su cuenta y pedidos</li>
              <li>Emitir facturas y reportes tributarios</li>
            </ul>

            <h3>3.2 Finalidades Secundarias</h3>
            <p>Con su autorizacion, podemos usar sus datos para:</p>
            <ul>
              <li>Enviar comunicaciones de marketing</li>
              <li>Mejorar nuestros servicios</li>
              <li>Generar estadisticas anonimas</li>
            </ul>

            <h2>4. Comparticion de Datos</h2>

            <h3>4.1 Con Quien Compartimos</h3>
            <table>
              <thead>
                <tr>
                  <th>Receptor</th>
                  <th>Datos Compartidos</th>
                  <th>Finalidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Compradores</td>
                  <td>Nombre de tienda, contacto comercial</td>
                  <td>Comunicacion sobre pedidos</td>
                </tr>
                <tr>
                  <td>Stripe</td>
                  <td>Datos bancarios</td>
                  <td>Procesamiento de pagos</td>
                </tr>
                <tr>
                  <td>DIAN</td>
                  <td>Informacion tributaria</td>
                  <td>Cumplimiento fiscal</td>
                </tr>
              </tbody>
            </table>

            <h3>4.2 Transferencias Internacionales</h3>
            <p>
              Algunos proveedores (como Stripe y servicios de nube) pueden estar ubicados
              fuera de Colombia. Estas transferencias se realizan bajo clausulas contractuales
              que garantizan proteccion equivalente.
            </p>

            <h3>4.3 No Vendemos sus Datos</h3>
            <p>
              GSHOP <strong>nunca vende</strong> su informacion personal a terceros con fines
              de marketing o publicidad externa.
            </p>

            <h2>5. Proteccion de Datos</h2>

            <h3>5.1 Medidas de Seguridad</h3>
            <ul>
              <li>Cifrado de datos en transito (TLS/SSL)</li>
              <li>Cifrado de datos sensibles en reposo</li>
              <li>Autenticacion de dos factores (opcional)</li>
              <li>Acceso restringido por roles</li>
              <li>Monitoreo de seguridad continuo</li>
            </ul>

            <h3>5.2 Seguridad de Documentos KYC</h3>
            <p>
              Los documentos de verificacion son almacenados de forma segura y solo accesibles
              por personal autorizado para fines de verificacion.
            </p>

            <h2>6. Retencion de Datos</h2>
            <table>
              <thead>
                <tr>
                  <th>Tipo de Dato</th>
                  <th>Periodo de Retencion</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Datos de cuenta activa</td>
                  <td>Mientras la cuenta este activa</td>
                </tr>
                <tr>
                  <td>Historial de transacciones</td>
                  <td>10 anhos (obligacion tributaria)</td>
                </tr>
                <tr>
                  <td>Documentos KYC</td>
                  <td>5 anhos despues del cierre de cuenta</td>
                </tr>
                <tr>
                  <td>Comunicaciones de soporte</td>
                  <td>3 anhos</td>
                </tr>
              </tbody>
            </table>

            <h2>7. Sus Derechos</h2>

            <h3>7.1 Derechos ARCO</h3>
            <p>Segun la Ley 1581 de 2012, usted tiene derecho a:</p>
            <ul>
              <li><strong>Acceso:</strong> Conocer que datos tenemos sobre usted</li>
              <li><strong>Rectificacion:</strong> Corregir datos inexactos</li>
              <li><strong>Cancelacion:</strong> Solicitar la eliminacion de sus datos</li>
              <li><strong>Oposicion:</strong> Oponerse al tratamiento para ciertas finalidades</li>
            </ul>

            <h3>7.2 Como Ejercer sus Derechos</h3>
            <p>
              Envie su solicitud a <strong>legal@gshop.business</strong> incluyendo:
            </p>
            <ul>
              <li>Nombre completo</li>
              <li>Documento de identidad</li>
              <li>Descripcion de lo solicitado</li>
            </ul>
            <p>
              <strong>Tiempos de respuesta:</strong> Consultas 10 dias habiles, Reclamos 15 dias habiles.
            </p>

            <h2>8. Cookies</h2>
            <p>Utilizamos cookies para:</p>
            <ul>
              <li><strong>Esenciales:</strong> Funcionamiento basico (sesion)</li>
              <li><strong>Funcionales:</strong> Preferencias (idioma)</li>
              <li><strong>Analiticas:</strong> Estadisticas de uso anonimas</li>
            </ul>
            <p>
              Puede controlar las cookies en la configuracion del Seller Panel o de su navegador.
            </p>

            <h2>9. Cambios a esta Politica</h2>
            <p>
              Podemos actualizar esta politica periodicamente. Le notificaremos cambios
              significativos por email o a traves del Seller Panel.
            </p>

            <h2>10. Contacto</h2>
            <p>Para consultas sobre privacidad:</p>
            <ul>
              <li><strong>Email:</strong> legal@gshop.business</li>
              <li><strong>Asunto:</strong> &quot;Privacidad - [tipo de solicitud]&quot;</li>
            </ul>

            <h3>Autoridad de Control</h3>
            <p>
              Si no esta satisfecho con nuestra respuesta, puede presentar una queja ante
              la <strong>Superintendencia de Industria y Comercio (SIC)</strong>:
            </p>
            <ul>
              <li>Web: www.sic.gov.co</li>
              <li>Linea gratuita: 01 8000 910 165</li>
            </ul>

            <hr className="my-8" />
            <p className="text-sm text-gray-500 italic">
              Al utilizar GSHOP, usted confirma que ha leido y comprendido esta Politica de Privacidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
