"use client";

import { useLocale } from "../providers/LocaleProvider";

export default function TermsAndConditionsPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  if (isEn) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Terms and Conditions of Service</h1>
          <p className="mt-3 text-sm text-slate-500">Last update: 2026</p>

          <section className="mt-8 space-y-5 text-slate-700">
            <h2 className="font-semibold text-[#0f172a]">1. Introduction</h2>
            <p>
              These Terms and Conditions regulate access to and use of the OMNI SCALE platform, owned by
              OMNI AGENCIA S.A.C. (RUC 20612101648), with address at Ca. Rio Chicama 5539, Peru.
            </p>
            <p>
              By accessing, registering, or using OMNI SCALE, you fully accept these Terms and Conditions.
              If you do not agree with them, you must refrain from using the platform.
            </p>

            <h2 className="font-semibold text-[#0f172a]">2. Definitions</h2>
            <p>
              Platform: OMNI SCALE web software and associated systems.<br />
              User: natural or legal person who uses the service.<br />
              Account: digital user record that enables access.<br />
              Services: analytics, automation, integration, and AI tools.
            </p>

            <h2 className="font-semibold text-[#0f172a]">3. Nature of Service</h2>
            <p>
              OMNI SCALE is a SaaS platform that enables advertising campaign analysis, process automation,
              external account integrations, and AI-powered recommendations.
            </p>
            <p>
              OMNI SCALE is a technology tool and does not provide financial, legal, tax, or investment advice.
            </p>

            <h2 className="font-semibold text-[#0f172a]">4. Account Registration</h2>
            <p>
              Users must provide truthful and updated information, safeguard credentials, and are responsible for
              all activity performed through their account.
            </p>

            <h2 className="font-semibold text-[#0f172a]">5. Age Requirement</h2>
            <p>
              The user declares that they are at least 18 years old and legally capable of entering digital service
              agreements.
            </p>

            <h2 className="font-semibold text-[#0f172a]">6. Permitted and Prohibited Use</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>No fraud or illegal activities.</li>
              <li>No violation of third-party advertising policies.</li>
              <li>No unauthorized access attempts.</li>
              <li>No malware distribution.</li>
              <li>No reverse engineering of the platform.</li>
            </ul>

            <h2 className="font-semibold text-[#0f172a]">7. Third-Party Integrations</h2>
            <p>
              OMNI SCALE may integrate with Meta, Google, TikTok, and other providers through official APIs.
              Availability and continuity of those external services are outside OMNI SCALE control.
            </p>

            <h2 className="font-semibold text-[#0f172a]">8. Artificial Intelligence</h2>
            <p>
              AI outputs are informational and strategic support only. They do not replace professional advice,
              and final decisions remain under user responsibility.
            </p>

            <h2 className="font-semibold text-[#0f172a]">9. Intellectual Property</h2>
            <p>
              Software, algorithms, interface, models, brand, and related assets are the exclusive property of
              OMNI AGENCIA S.A.C. A limited, non-transferable, revocable license is granted for service use only.
            </p>

            <h2 className="font-semibold text-[#0f172a]">10. User Content</h2>
            <p>
              The user retains ownership of uploaded or integrated content and grants OMNI SCALE a limited license
              to process it strictly for platform operation and contracted services.
            </p>

            <h2 className="font-semibold text-[#0f172a]">11. Service Availability</h2>
            <p>
              OMNI SCALE seeks continuous operation but does not guarantee uninterrupted service or absence of errors.
              Maintenance windows, upgrades, and technical changes may occur without prior notice.
            </p>

            <h2 className="font-semibold text-[#0f172a]">12. Plans and Billing</h2>
            <p>
              Plans may include recurring billing according to the selected subscription. Payments are non-refundable
              unless required by applicable law.
            </p>

            <h2 className="font-semibold text-[#0f172a]">13. Cancellation and Suspension</h2>
            <p>
              Users may cancel their account at any time. OMNI SCALE may suspend or terminate access in case of
              breach of these terms, security risks, or abuse of the service.
            </p>

            <h2 className="font-semibold text-[#0f172a]">14. Limitation of Liability</h2>
            <p>
              OMNI SCALE does not guarantee business outcomes, ROAS, sales growth, lead volume, or specific campaign
              performance. OMNI SCALE is not liable for indirect losses, opportunity costs, or external platform actions.
            </p>

            <h2 className="font-semibold text-[#0f172a]">15. Warranty Disclaimer</h2>
            <p>
              The service is provided "as is" and "as available" without express or implied warranties of uninterrupted
              operation, fitness for a particular purpose, or commercial suitability.
            </p>

            <h2 className="font-semibold text-[#0f172a]">16. Security</h2>
            <p>
              OMNI SCALE implements reasonable technical and organizational security controls. However, no internet-based
              system can guarantee absolute security.
            </p>

            <h2 className="font-semibold text-[#0f172a]">17. Privacy and Data Protection</h2>
            <p>
              Personal data processing is governed by the OMNI SCALE Privacy Policy, which is incorporated by reference
              into these Terms and Conditions.
            </p>

            <h2 className="font-semibold text-[#0f172a]">18. Service Modifications</h2>
            <p>
              OMNI SCALE may add, modify, or remove functionalities, modules, and integrations due to product evolution,
              regulatory requirements, or technical decisions.
            </p>

            <h2 className="font-semibold text-[#0f172a]">19. International Use</h2>
            <p>
              The user accepts that service operation and data processing may occur across multiple jurisdictions due to
              the global nature of internet infrastructure and cloud providers.
            </p>

            <h2 className="font-semibold text-[#0f172a]">20. Temporary Service Suspension</h2>
            <p>
              Access may be temporarily suspended for security incidents, technical maintenance, legal orders,
              infrastructure issues, or abuse prevention.
            </p>

            <h2 className="font-semibold text-[#0f172a]">21. Indemnification</h2>
            <p>
              The user agrees to indemnify and hold harmless OMNI AGENCIA S.A.C. from claims, damages, or penalties
              arising from misuse of the platform or legal violations attributable to the user.
            </p>

            <h2 className="font-semibold text-[#0f172a]">22. Relationship Between Parties</h2>
            <p>
              Use of OMNI SCALE does not create employment, agency, partnership, franchise, or legal representation
              between OMNI AGENCIA S.A.C. and the user.
            </p>

            <h2 className="font-semibold text-[#0f172a]">23. Force Majeure</h2>
            <p>
              OMNI SCALE shall not be liable for delays or interruptions caused by force majeure, provider outages,
              connectivity failures, or events beyond reasonable control.
            </p>

            <h2 className="font-semibold text-[#0f172a]">24. Governing Law and Jurisdiction</h2>
            <p>
              These Terms and Conditions are governed by the laws of the Republic of Peru. Any dispute shall be resolved
              before the competent authorities in Peru, unless mandatory law provides otherwise.
            </p>

            <h2 className="font-semibold text-[#0f172a]">25. Amendments</h2>
            <p>
              OMNI SCALE may update these Terms and Conditions at any time. Continued use of the service after updates
              implies acceptance of the new version.
            </p>

            <h2 className="font-semibold text-[#0f172a]">26. Contact</h2>
            <p>
              OMNI AGENCIA S.A.C.<br />
              RUC: 20612101648<br />
              Address: Ca. Rio Chicama 5539, Peru<br />
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
        <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Términos y Condiciones del Servicio</h1>
        <p className="mt-3 text-sm text-slate-500">Última actualización: 2026</p>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="font-semibold text-[#0f172a]">1. Introducción</h2>
          <p>
            Estos Términos y Condiciones regulan el acceso y uso de la plataforma OMNI SCALE, propiedad de
            OMNI AGENCIA S.A.C. (RUC 20612101648), con domicilio en Ca. Rio Chicama 5539, Perú.
          </p>
          <p>
            Al acceder, registrarte o utilizar OMNI SCALE, aceptas íntegramente estos Términos y Condiciones.
            Si no estás de acuerdo con ellos, debes abstenerte de usar la plataforma.
          </p>

          <h2 className="font-semibold text-[#0f172a]">2. Definiciones</h2>
          <p>
            Plataforma: software web OMNI SCALE y sistemas asociados.<br />
            Usuario: persona natural o jurídica que utiliza el servicio.<br />
            Cuenta: registro digital del usuario que permite acceso.<br />
            Servicios: herramientas de análisis, automatización, integración e IA.
          </p>

          <h2 className="font-semibold text-[#0f172a]">3. Naturaleza del Servicio</h2>
          <p>
            OMNI SCALE es una plataforma SaaS que permite analizar campañas publicitarias, automatizar procesos,
            integrar cuentas externas y generar recomendaciones con inteligencia artificial.
          </p>
          <p>
            OMNI SCALE es una herramienta tecnológica y no brinda asesoría financiera, legal, tributaria ni de inversión.
          </p>

          <h2 className="font-semibold text-[#0f172a]">4. Registro de Cuenta</h2>
          <p>
            El usuario debe proporcionar información veraz y actualizada, proteger sus credenciales y asumir la
            responsabilidad por toda actividad realizada desde su cuenta.
          </p>

          <h2 className="font-semibold text-[#0f172a]">5. Requisito de Edad</h2>
          <p>
            El usuario declara tener al menos 18 años de edad y capacidad legal para contratar servicios digitales.
          </p>

          <h2 className="font-semibold text-[#0f172a]">6. Uso Permitido y Prohibido</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>No realizar fraude ni actividades ilegales.</li>
            <li>No infringir políticas publicitarias de terceros.</li>
            <li>No intentar accesos no autorizados.</li>
            <li>No distribuir malware.</li>
            <li>No realizar ingeniería inversa de la plataforma.</li>
          </ul>

          <h2 className="font-semibold text-[#0f172a]">7. Integraciones de Terceros</h2>
          <p>
            OMNI SCALE puede integrarse con Meta, Google, TikTok y otros proveedores mediante APIs oficiales.
            La disponibilidad y continuidad de esos servicios externos están fuera del control de OMNI SCALE.
          </p>

          <h2 className="font-semibold text-[#0f172a]">8. Inteligencia Artificial</h2>
          <p>
            Las salidas de IA son informativas y de apoyo estratégico. No reemplazan asesoría profesional,
            y las decisiones finales permanecen bajo responsabilidad del usuario.
          </p>

          <h2 className="font-semibold text-[#0f172a]">9. Propiedad Intelectual</h2>
          <p>
            El software, algoritmos, interfaz, modelos, marca y activos relacionados son propiedad exclusiva de
            OMNI AGENCIA S.A.C. Se concede una licencia limitada, revocable e intransferible para uso del servicio.
          </p>

          <h2 className="font-semibold text-[#0f172a]">10. Contenido del Usuario</h2>
          <p>
            El usuario conserva la titularidad de su contenido cargado o integrado y otorga a OMNI SCALE una licencia
            limitada para tratarlo únicamente con fines de operación de la plataforma y servicios contratados.
          </p>

          <h2 className="font-semibold text-[#0f172a]">11. Disponibilidad del Servicio</h2>
          <p>
            OMNI SCALE procura operación continua, pero no garantiza disponibilidad ininterrumpida ni ausencia total de
            errores. Pueden existir mantenimientos, mejoras y cambios técnicos sin aviso previo.
          </p>

          <h2 className="font-semibold text-[#0f172a]">12. Planes y Facturación</h2>
          <p>
            Los planes pueden incluir facturación recurrente según la suscripción elegida. Los pagos no son
            reembolsables, salvo cuando la ley aplicable lo exija.
          </p>

          <h2 className="font-semibold text-[#0f172a]">13. Cancelación y Suspensión</h2>
          <p>
            El usuario puede cancelar su cuenta en cualquier momento. OMNI SCALE podrá suspender o terminar el acceso
            en caso de incumplimiento de estos términos, riesgos de seguridad o abuso del servicio.
          </p>

          <h2 className="font-semibold text-[#0f172a]">14. Limitación de Responsabilidad</h2>
          <p>
            OMNI SCALE no garantiza resultados comerciales, ROAS, crecimiento de ventas, volumen de leads ni desempeño
            específico de campañas. OMNI SCALE no responde por pérdidas indirectas, lucro cesante o acciones de
            plataformas externas.
          </p>

          <h2 className="font-semibold text-[#0f172a]">15. Exclusión de Garantías</h2>
          <p>
            El servicio se proporciona "tal cual" y "según disponibilidad", sin garantías expresas o implícitas sobre
            continuidad, idoneidad para un fin particular o aptitud comercial.
          </p>

          <h2 className="font-semibold text-[#0f172a]">16. Seguridad</h2>
          <p>
            OMNI SCALE aplica medidas de seguridad técnicas y organizativas razonables. Sin embargo, ningún sistema
            conectado a internet puede garantizar seguridad absoluta.
          </p>

          <h2 className="font-semibold text-[#0f172a]">17. Privacidad y Protección de Datos</h2>
          <p>
            El tratamiento de datos personales se rige por la Política de Privacidad de OMNI SCALE, la cual forma parte
            integrante de estos Términos y Condiciones.
          </p>

          <h2 className="font-semibold text-[#0f172a]">18. Modificaciones del Servicio</h2>
          <p>
            OMNI SCALE puede agregar, modificar o retirar funcionalidades, módulos e integraciones debido a la evolución
            del producto, exigencias regulatorias o decisiones técnicas.
          </p>

          <h2 className="font-semibold text-[#0f172a]">19. Uso Internacional</h2>
          <p>
            El usuario acepta que la operación del servicio y el tratamiento de datos pueden ejecutarse en múltiples
            jurisdicciones, por la naturaleza global de la infraestructura de internet y proveedores cloud.
          </p>

          <h2 className="font-semibold text-[#0f172a]">20. Suspensión Temporal del Servicio</h2>
          <p>
            El acceso puede suspenderse temporalmente por incidentes de seguridad, mantenimiento técnico, órdenes
            legales, problemas de infraestructura o prevención de abuso.
          </p>

          <h2 className="font-semibold text-[#0f172a]">21. Indemnidad</h2>
          <p>
            El usuario acepta indemnizar y mantener indemne a OMNI AGENCIA S.A.C. frente a reclamos, daños o sanciones
            derivados del uso indebido de la plataforma o infracciones legales atribuibles al usuario.
          </p>

          <h2 className="font-semibold text-[#0f172a]">22. Relación entre Partes</h2>
          <p>
            El uso de OMNI SCALE no crea relación laboral, de agencia, sociedad, franquicia ni representación legal
            entre OMNI AGENCIA S.A.C. y el usuario.
          </p>

          <h2 className="font-semibold text-[#0f172a]">23. Fuerza Mayor</h2>
          <p>
            OMNI SCALE no será responsable por retrasos o interrupciones originados por fuerza mayor, caídas de
            proveedores, fallas de conectividad o eventos fuera de su control razonable.
          </p>

          <h2 className="font-semibold text-[#0f172a]">24. Legislación Aplicable y Jurisdicción</h2>
          <p>
            Estos Términos y Condiciones se rigen por las leyes de la República del Perú. Cualquier controversia será
            resuelta por las autoridades competentes del Perú, salvo norma imperativa en contrario.
          </p>

          <h2 className="font-semibold text-[#0f172a]">25. Modificaciones</h2>
          <p>
            OMNI SCALE puede actualizar estos Términos y Condiciones en cualquier momento. El uso continuo del servicio
            después de una actualización implica aceptación de la nueva versión.
          </p>

          <h2 className="font-semibold text-[#0f172a]">26. Contacto</h2>
          <p>
            OMNI AGENCIA S.A.C.<br />
            RUC: 20612101648<br />
            Dirección: Ca. Rio Chicama 5539, Perú<br />
            Correo: soporte@omniscale.pe
          </p>
        </section>
      </div>
    </main>
  );
}
