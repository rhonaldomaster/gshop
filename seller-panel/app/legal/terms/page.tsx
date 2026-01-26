'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
            {t('termsTitle')}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {t('lastUpdated')}: Enero 2026
          </p>

          <div className="prose prose-gray max-w-none">
            <h2>1. Introduccion y Aceptacion</h2>

            <h3>1.1 Acerca de GSHOP</h3>
            <p>
              GSHOP es una plataforma de comercio electronico que conecta vendedores independientes
              con compradores. GSHOP actua como intermediario tecnologico, facilitando las transacciones
              pero sin ser el vendedor directo de los productos.
            </p>

            <h3>1.2 Aceptacion de los Terminos</h3>
            <p>
              Al registrarse como vendedor en GSHOP, usted acepta estos Terminos y Condiciones en su
              totalidad. Si no esta de acuerdo con alguna parte, no debe utilizar la plataforma.
            </p>

            <h3>1.3 Modificaciones</h3>
            <p>
              GSHOP se reserva el derecho de modificar estos terminos. Las modificaciones entraran
              en vigor a partir de su publicacion. El uso continuado de la plataforma constituye
              su aceptacion de los nuevos terminos.
            </p>

            <h2>2. Registro y Verificacion de Vendedor</h2>

            <h3>2.1 Requisitos de Elegibilidad</h3>
            <p>Para ser vendedor en GSHOP, usted debe:</p>
            <ul>
              <li>Ser mayor de 18 anos de edad</li>
              <li>Tener capacidad legal para celebrar contratos</li>
              <li>Estar legalmente habilitado para vender en Colombia</li>
              <li>Proporcionar informacion veraz y documentacion valida</li>
              <li>Completar el proceso de verificacion KYC (Know Your Customer)</li>
            </ul>

            <h3>2.2 Proceso KYC</h3>
            <p>El proceso de verificacion incluye:</p>
            <ul>
              <li>Documento de identidad vigente (Cedula de Ciudadania, Cedula de Extranjeria)</li>
              <li>Registro Unico Tributario (RUT) actualizado</li>
              <li>Certificado de Camara de Comercio (para empresas)</li>
              <li>Informacion bancaria para recibir pagos</li>
            </ul>

            <h3>2.3 Aprobacion de Cuenta</h3>
            <p>
              GSHOP se reserva el derecho de aprobar, rechazar o suspender cualquier solicitud
              de registro sin necesidad de justificacion.
            </p>

            <h2>3. Comisiones y Pagos</h2>

            <h3>3.1 Estructura de Comisiones</h3>
            <p>
              GSHOP cobra una comision por cada venta realizada a traves de la plataforma.
              La tasa de comision sera comunicada durante el proceso de registro y puede
              variar segun la categoria del producto.
            </p>

            <h3>3.2 Procesamiento de Pagos</h3>
            <p>
              Los pagos se procesan a traves de Stripe. Los fondos de las ventas, menos la
              comision de GSHOP, seran transferidos a su cuenta bancaria registrada segun
              el calendario de pagos establecido.
            </p>

            <h3>3.3 Retenciones</h3>
            <p>
              GSHOP puede retener fondos temporalmente en casos de disputas, devoluciones
              pendientes o investigaciones de fraude.
            </p>

            <h2>4. Obligaciones del Vendedor</h2>

            <h3>4.1 Productos</h3>
            <p>El vendedor se compromete a:</p>
            <ul>
              <li>Ofrecer solo productos legales y que cumplan con la normativa colombiana</li>
              <li>Proporcionar descripciones precisas y fotografias reales</li>
              <li>Mantener actualizado el inventario y precios</li>
              <li>Cumplir con las normas de calidad aplicables</li>
              <li>Respetar los derechos de propiedad intelectual</li>
            </ul>

            <h3>4.2 Impuestos (IVA)</h3>
            <p>
              Los precios deben incluir el IVA segun la legislacion colombiana. El vendedor
              es responsable de la correcta clasificacion del IVA de sus productos (Excluido,
              Exento, Reducido 5%, General 19%).
            </p>

            <h3>4.3 Envios</h3>
            <p>El vendedor es responsable de:</p>
            <ul>
              <li>Configurar tarifas de envio justas y transparentes</li>
              <li>Despachar los productos en los tiempos acordados</li>
              <li>Proporcionar informacion de seguimiento cuando este disponible</li>
              <li>Asegurar que los productos lleguen en buen estado</li>
            </ul>

            <h3>4.4 Servicio al Cliente</h3>
            <p>El vendedor debe:</p>
            <ul>
              <li>Responder a las consultas de los compradores de manera oportuna</li>
              <li>Gestionar devoluciones conforme al derecho de retracto (5 dias habiles)</li>
              <li>Honrar las garantias de los productos</li>
              <li>Mantener un nivel de servicio que no afecte la reputacion de GSHOP</li>
            </ul>

            <h2>5. Productos Prohibidos</h2>
            <p>Esta estrictamente prohibido vender:</p>
            <ul>
              <li>Armas de fuego, municiones y explosivos</li>
              <li>Drogas ilegales o sustancias controladas no reguladas</li>
              <li>Servicios sexuales o contenido de explotacion</li>
              <li>Productos falsificados o que infrinjan propiedad intelectual</li>
              <li>Productos robados</li>
              <li>Medicamentos sin autorizacion INVIMA</li>
              <li>Cualquier producto cuya venta sea ilegal en Colombia</li>
            </ul>

            <h2>6. Suspension y Terminacion</h2>

            <h3>6.1 Causales de Suspension</h3>
            <p>GSHOP puede suspender una cuenta por:</p>
            <ul>
              <li>Incumplimiento de estos terminos</li>
              <li>Alto indice de quejas o devoluciones</li>
              <li>Sospecha de fraude o actividad ilegal</li>
              <li>Venta de productos prohibidos</li>
              <li>Informacion falsa o enganhosa</li>
            </ul>

            <h3>6.2 Terminacion Voluntaria</h3>
            <p>
              El vendedor puede cerrar su cuenta en cualquier momento, siempre que no tenga
              pedidos pendientes ni disputas abiertas.
            </p>

            <h2>7. Limitacion de Responsabilidad</h2>
            <p>
              GSHOP no es responsable de disputas entre vendedores y compradores, productos
              defectuosos, perdidas de envio, o cualquier danho indirecto derivado del uso
              de la plataforma.
            </p>

            <h2>8. Resolucion de Disputas</h2>
            <p>
              Ante cualquier disputa, se recomienda primero la comunicacion directa con el
              comprador. Si no se resuelve, GSHOP puede mediar. Las disputas no resueltas
              se someteran a los tribunales competentes de Colombia.
            </p>

            <h2>9. Contacto</h2>
            <p>Para consultas legales o comerciales:</p>
            <ul>
              <li><strong>Email:</strong> legal@gshop.business</li>
              <li><strong>Soporte:</strong> A traves del Seller Panel</li>
            </ul>

            <hr className="my-8" />
            <p className="text-sm text-gray-500 italic">
              Al registrarse como vendedor en GSHOP, usted confirma que ha leido, entendido
              y aceptado estos Terminos y Condiciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
