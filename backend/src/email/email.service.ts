import { Injectable, Logger } from '@nestjs/common';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Send email to recipient
   * For now, logs to console. Can be extended to use nodemailer, SendGrid, etc.
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      this.logger.log(`
======================================
📧 EMAIL NOTIFICATION
======================================
To: ${options.to}
Subject: ${options.subject}
--------------------------------------
${options.text || options.html}
======================================
      `);

      // TODO: Implement actual email sending with nodemailer or SendGrid
      // For production, uncomment and configure:
      /*
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      */

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send seller approval notification
   */
  async sendSellerApprovalEmail(email: string, businessName: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: '¡Tu cuenta de vendedor ha sido aprobada! 🎉',
      text: `Hola ${businessName},

¡Excelentes noticias! Tu cuenta de vendedor en GSHOP ha sido aprobada.

Ahora puedes:
- Publicar y administrar tus productos
- Gestionar tus pedidos
- Ver tus estadísticas de ventas

Inicia sesión en tu panel de vendedor para comenzar:
${process.env.SELLER_PANEL_URL || 'http://localhost:3002'}

¡Bienvenido a GSHOP!

Equipo GSHOP`,
      html: `
        <h2>¡Hola ${businessName}!</h2>
        <p><strong>¡Excelentes noticias!</strong> Tu cuenta de vendedor en GSHOP ha sido aprobada.</p>
        <h3>Ahora puedes:</h3>
        <ul>
          <li>Publicar y administrar tus productos</li>
          <li>Gestionar tus pedidos</li>
          <li>Ver tus estadísticas de ventas</li>
        </ul>
        <p>
          <a href="${process.env.SELLER_PANEL_URL || 'http://localhost:3002'}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Ir a mi Panel de Vendedor
          </a>
        </p>
        <p>¡Bienvenido a GSHOP!</p>
        <p style="color: #666; font-size: 12px;">Equipo GSHOP</p>
      `,
    });
  }

  /**
   * Send seller rejection notification
   */
  async sendSellerRejectionEmail(
    email: string,
    businessName: string,
    reason: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Actualización sobre tu solicitud de vendedor',
      text: `Hola ${businessName},

Gracias por tu interés en vender en GSHOP.

Lamentablemente, no hemos podido aprobar tu cuenta de vendedor en este momento.

Motivo:
${reason}

Si tienes preguntas o deseas volver a aplicar en el futuro, no dudes en contactarnos.

Equipo GSHOP`,
      html: `
        <h2>Hola ${businessName}</h2>
        <p>Gracias por tu interés en vender en GSHOP.</p>
        <p>Lamentablemente, no hemos podido aprobar tu cuenta de vendedor en este momento.</p>
        <div style="background-color: #f8f9fa; padding: 16px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <strong>Motivo:</strong><br>
          ${reason}
        </div>
        <p>Si tienes preguntas o deseas volver a aplicar en el futuro, no dudes en contactarnos.</p>
        <p style="color: #666; font-size: 12px;">Equipo GSHOP</p>
      `,
    });
  }

  /**
   * Send seller update request notification
   */
  async sendSellerUpdateRequestEmail(
    email: string,
    businessName: string,
    message: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Se requiere actualización en tu solicitud de vendedor',
      text: `Hola ${businessName},

Hemos revisado tu solicitud de vendedor y necesitamos que actualices algunos datos.

Detalles:
${message}

Por favor, inicia sesión en tu panel de vendedor para actualizar la información solicitada:
${process.env.SELLER_PANEL_URL || 'http://localhost:3002'}

Una vez actualizados los datos, revisaremos tu solicitud nuevamente.

Equipo GSHOP`,
      html: `
        <h2>Hola ${businessName}</h2>
        <p>Hemos revisado tu solicitud de vendedor y necesitamos que actualices algunos datos.</p>
        <div style="background-color: #fff3cd; padding: 16px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <strong>Detalles:</strong><br>
          ${message}
        </div>
        <p>
          <a href="${process.env.SELLER_PANEL_URL || 'http://localhost:3002'}" style="background-color: #ffc107; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Actualizar mis Datos
          </a>
        </p>
        <p>Una vez actualizados los datos, revisaremos tu solicitud nuevamente.</p>
        <p style="color: #666; font-size: 12px;">Equipo GSHOP</p>
      `,
    });
  }
}
