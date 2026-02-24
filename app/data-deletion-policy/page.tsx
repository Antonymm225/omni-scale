"use client";

import { useLocale } from "../providers/LocaleProvider";

export default function DataDeletionPolicyPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  if (isEn) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Data Deletion Policy</h1>
          <p className="mt-3 text-sm text-slate-500">Last update: 2026</p>

          <section className="mt-8 space-y-5 text-slate-700">
            <h2 className="font-semibold text-[#0f172a]">1. Purpose</h2>
            <p>
              This policy describes the conditions, methods, and timelines for deletion of personal data and
              operational data associated with the OMNI SCALE platform.
            </p>

            <h2 className="font-semibold text-[#0f172a]">2. Scope</h2>
            <p>
              It applies to account profile data, authentication data, integrations, synchronized assets,
              operational metrics, AI analysis records, and associated technical logs.
            </p>

            <h2 className="font-semibold text-[#0f172a]">3. Request Channels</h2>
            <p>
              Deletion requests can be submitted through account settings inside the platform or by email to
              soporte@omniscale.pe from the account owner identity.
            </p>

            <h2 className="font-semibold text-[#0f172a]">4. Identity Verification</h2>
            <p>
              Before processing deletion, OMNI SCALE may verify identity to prevent unauthorized requests and
              protect account ownership.
            </p>

            <h2 className="font-semibold text-[#0f172a]">5. Immediate Effects</h2>
            <p>
              Once deletion is confirmed, access is revoked, active sessions are closed, and account operations
              are disabled.
            </p>

            <h2 className="font-semibold text-[#0f172a]">6. Data Removed</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Profile and onboarding data</li>
              <li>OAuth tokens and external integrations</li>
              <li>Synchronized advertising assets</li>
              <li>Stored metrics and snapshots</li>
              <li>AI recommendation and analysis records</li>
              <li>Operational and activity logs linked to the account</li>
            </ul>

            <h2 className="font-semibold text-[#0f172a]">7. Integrations and Permissions</h2>
            <p>
              Stored access tokens are removed and automated synchronization jobs for the user are stopped.
              Reconnection requires a new explicit authorization flow.
            </p>

            <h2 className="font-semibold text-[#0f172a]">8. Processing Time</h2>
            <p>
              Logical disablement is immediate. Permanent deletion from active systems is completed within up to
              7 calendar days, except legal retention obligations.
            </p>

            <h2 className="font-semibold text-[#0f172a]">9. Backup Retention</h2>
            <p>
              Encrypted backups may temporarily retain residual data until the backup rotation cycle expires.
              Those backups are not used for regular account restoration after deletion.
            </p>

            <h2 className="font-semibold text-[#0f172a]">10. Legal and Security Exceptions</h2>
            <p>
              Minimum records may be retained when required by law, judicial orders, fraud prevention, tax
              obligations, or dispute resolution.
            </p>

            <h2 className="font-semibold text-[#0f172a]">11. Irreversibility</h2>
            <p>
              Once deletion is completed, account and associated data cannot be restored. A new account requires
              a new registration process.
            </p>

            <h2 className="font-semibold text-[#0f172a]">12. Third-Party Systems</h2>
            <p>
              Data previously exported to third-party platforms (for example Meta or Google) remains subject to
              those platforms' own deletion and retention policies.
            </p>

            <h2 className="font-semibold text-[#0f172a]">13. Data Subject Rights</h2>
            <p>
              In addition to deletion, users may exercise rights of access, rectification, portability,
              objection, and withdrawal of consent where applicable.
            </p>

            <h2 className="font-semibold text-[#0f172a]">14. Traceability</h2>
            <p>
              OMNI SCALE may keep a minimal technical trace proving that a deletion request was processed,
              without preserving deleted business data.
            </p>

            <h2 className="font-semibold text-[#0f172a]">15. Policy Updates</h2>
            <p>
              This policy may be updated due to legal changes, security standards, or platform evolution.
              Updated versions are published on official OMNI SCALE channels.
            </p>

            <h2 className="font-semibold text-[#0f172a]">16. Contact</h2>
            <p>
              OMNI AGENCIA S.A.C.<br />
              RUC: 20612101648<br />
              Email: soporte@omniscale.pe
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Política de Eliminación de Datos</h1>
        <p className="mt-3 text-sm text-slate-500">Última actualización: 2026</p>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="font-semibold text-[#0f172a]">1. Finalidad</h2>
          <p>
            Esta política describe las condiciones, métodos y plazos para la eliminación de datos personales y
            datos operativos asociados a la plataforma OMNI SCALE.
          </p>

          <h2 className="font-semibold text-[#0f172a]">2. Alcance</h2>
          <p>
            Aplica a datos de perfil de cuenta, datos de autenticación, integraciones, activos sincronizados,
            métricas operativas, registros de análisis de IA y logs técnicos asociados.
          </p>

          <h2 className="font-semibold text-[#0f172a]">3. Canales de Solicitud</h2>
          <p>
            Las solicitudes de eliminación pueden realizarse desde la configuración de cuenta dentro de la
            plataforma o por correo a soporte@omniscale.pe desde la identidad titular de la cuenta.
          </p>

          <h2 className="font-semibold text-[#0f172a]">4. Verificación de Identidad</h2>
          <p>
            Antes de procesar la eliminación, OMNI SCALE puede verificar la identidad para prevenir solicitudes
            no autorizadas y proteger la titularidad de la cuenta.
          </p>

          <h2 className="font-semibold text-[#0f172a]">5. Efectos Inmediatos</h2>
          <p>
            Una vez confirmada la eliminación, se revoca el acceso, se cierran sesiones activas y se deshabilita
            la operación de la cuenta.
          </p>

          <h2 className="font-semibold text-[#0f172a]">6. Datos Eliminados</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Datos de perfil y onboarding</li>
            <li>Tokens OAuth e integraciones externas</li>
            <li>Activos publicitarios sincronizados</li>
            <li>Métricas y snapshots almacenados</li>
            <li>Registros de recomendaciones y análisis de IA</li>
            <li>Logs operativos y de actividad vinculados a la cuenta</li>
          </ul>

          <h2 className="font-semibold text-[#0f172a]">7. Integraciones y Permisos</h2>
          <p>
            Se eliminan los tokens de acceso almacenados y se detienen las tareas automáticas de sincronización
            del usuario. Una nueva conexión requerirá una autorización explícita.
          </p>

          <h2 className="font-semibold text-[#0f172a]">8. Plazo de Procesamiento</h2>
          <p>
            La desactivación lógica es inmediata. La eliminación permanente de sistemas activos se completa en
            un máximo de 7 días calendario, salvo obligaciones legales de conservación.
          </p>

          <h2 className="font-semibold text-[#0f172a]">9. Conservación en Backups</h2>
          <p>
            Los backups cifrados pueden retener datos residuales de forma temporal hasta que finalice su ciclo
            de rotación. Esos backups no se usan para restauración normal de cuentas eliminadas.
          </p>

          <h2 className="font-semibold text-[#0f172a]">10. Excepciones Legales y de Seguridad</h2>
          <p>
            Puede conservarse un registro mínimo cuando lo exija la ley, una orden judicial, prevención de
            fraude, obligaciones tributarias o resolución de disputas.
          </p>

          <h2 className="font-semibold text-[#0f172a]">11. Irreversibilidad</h2>
          <p>
            Una vez completada la eliminación, la cuenta y sus datos asociados no pueden recuperarse.
            Crear una cuenta nueva requiere un nuevo proceso de registro.
          </p>

          <h2 className="font-semibold text-[#0f172a]">12. Sistemas de Terceros</h2>
          <p>
            La información exportada previamente a plataformas de terceros (por ejemplo Meta o Google) queda
            sujeta a las políticas de eliminación y conservación propias de esos proveedores.
          </p>

          <h2 className="font-semibold text-[#0f172a]">13. Derechos del Titular</h2>
          <p>
            Además de la eliminación, el usuario puede ejercer derechos de acceso, rectificación, portabilidad,
            oposición y revocación del consentimiento cuando corresponda.
          </p>

          <h2 className="font-semibold text-[#0f172a]">14. Trazabilidad</h2>
          <p>
            OMNI SCALE puede conservar una traza técnica mínima que acredite que la solicitud fue atendida,
            sin preservar datos de negocio eliminados.
          </p>

          <h2 className="font-semibold text-[#0f172a]">15. Actualizaciones de la Política</h2>
          <p>
            Esta política puede actualizarse por cambios legales, estándares de seguridad o evolución de la
            plataforma. Las nuevas versiones se publicarán en los canales oficiales de OMNI SCALE.
          </p>

          <h2 className="font-semibold text-[#0f172a]">16. Contacto</h2>
          <p>
            OMNI AGENCIA S.A.C.<br />
            RUC: 20612101648<br />
            Correo: soporte@omniscale.pe
          </p>
        </section>
      </div>
    </main>
  );
}
