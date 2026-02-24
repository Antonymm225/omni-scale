"use client";

import { useLocale } from "../providers/LocaleProvider";

export default function PrivacyPolicyPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  if (isEn) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <header>
            <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Privacy Policy</h1>
            <p className="mt-3 text-sm text-slate-500">OMNI SCALE - Last update: 2026</p>
          </header>

          <section className="mt-8 space-y-6 text-slate-700">
            <h2 className="text-xl font-semibold text-[#0f172a]">1. INTRODUCTION</h2>
            <p>
              This Privacy Policy describes how <strong>OMNI AGENCIA S.A.C.</strong>, owner of the
              <strong> OMNI SCALE</strong> technology platform, collects, uses, stores, protects, and processes
              personal data from users who access or use its digital services.
            </p>
            <p>
              OMNI SCALE is a SaaS platform focused on analysis, automation, optimization, and advertising
              campaign management through artificial intelligence technologies and data processing.
            </p>
            <p>Respect for privacy is a fundamental principle in the design and operation of our services.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">2. CONTROLLER IDENTIFICATION</h2>
            <p>
              <strong>Legal Name:</strong> OMNI AGENCIA S.A.C.<br />
              <strong>RUC:</strong> 20612101648<br />
              <strong>Address:</strong> Ca. Rio Chicama 5539, Peru<br />
              <strong>Email:</strong> soporte@omniscale.pe<br />
              <strong>Platform:</strong> OMNI SCALE
            </p>
            <p>OMNI AGENCIA S.A.C. acts as the Data Controller.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">3. APPLICABLE LEGAL FRAMEWORK</h2>
            <p>Personal data processing is carried out under:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Peru Personal Data Protection Law No. 29733</li>
              <li>Regulations of the Personal Data Protection Law</li>
              <li>GDPR where applicable</li>
              <li>International information security standards</li>
              <li>Policies of integrated technology platforms (Meta, Google, etc.)</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0f172a]">4. DEFINITIONS</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>User:</strong> natural or legal person using OMNI SCALE.</li>
              <li><strong>Personal Data:</strong> information that identifies or can identify a person.</li>
              <li><strong>Processing:</strong> any operation performed on personal data.</li>
              <li><strong>Platform:</strong> OMNI SCALE software and related services.</li>
              <li><strong>AI Services:</strong> automated systems that analyze information and generate recommendations.</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0f172a]">5. INFORMATION WE COLLECT</h2>
            <h3 className="text-lg font-semibold text-[#0f172a]">5.1 Information provided by users</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Full name</li>
              <li>Email address</li>
              <li>Business or company name</li>
              <li>Business type</li>
              <li>Country or region</li>
              <li>Onboarding input data</li>
              <li>Operational preferences</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0f172a]">5.2 Authentication information</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Unique user identifier</li>
              <li>Credential hash</li>
              <li>Session tokens</li>
              <li>Access logs</li>
              <li>Email verification records</li>
            </ul>
            <p>OMNI SCALE does not store plaintext passwords.</p>

            <h3 className="text-lg font-semibold text-[#0f172a]">5.3 Information from external integrations</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Ad account IDs</li>
              <li>Active campaigns</li>
              <li>Ad sets</li>
              <li>Creatives</li>
              <li>Performance metrics</li>
              <li>Aggregated conversion data</li>
              <li>Ad account status</li>
            </ul>
            <p>Access occurs only through explicit user authorization.</p>

            <h3 className="text-lg font-semibold text-[#0f172a]">5.4 Technical and operational data</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Operating system</li>
              <li>Screen resolution</li>
              <li>Session identifiers</li>
              <li>Activity logs</li>
              <li>In-app events</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0f172a]">5.5 AI-generated information</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Automated analyses</li>
              <li>Strategic recommendations</li>
              <li>Performance forecasts</li>
              <li>Optimization suggestions</li>
            </ul>
            <p>Final decisions always remain under user human control.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">6. PURPOSES OF PROCESSING</h2>
            <h3 className="text-lg font-semibold text-[#0f172a]">Service operation</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Create accounts</li>
              <li>Enable secure access</li>
              <li>Manage subscriptions</li>
              <li>Run platform features</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0f172a]">Intelligence and automation</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Analyze campaigns</li>
              <li>Generate insights</li>
              <li>Detect optimization opportunities</li>
              <li>Automate authorized processes</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0f172a]">Security</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Prevent fraud</li>
              <li>Detect unauthorized access</li>
              <li>Protect infrastructure</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0f172a]">Continuous improvement</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Improve system performance</li>
              <li>Develop new features</li>
              <li>Analyze aggregated user behavior</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0f172a]">Legal compliance</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Regulatory obligations</li>
              <li>Valid court orders</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0f172a]">7. LEGAL BASIS</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>User consent</li>
              <li>Contract performance</li>
              <li>Legitimate interest</li>
              <li>Legal obligations</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0f172a]">8. PRIVACY PRINCIPLES</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Lawfulness</li>
              <li>Transparency</li>
              <li>Data minimization</li>
              <li>Security</li>
              <li>Confidentiality</li>
              <li>Purpose limitation</li>
              <li>Accountability</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0f172a]">9. USE OF ARTIFICIAL INTELLIGENCE</h2>
            <p>The platform may use automated systems to evaluate, classify, and recommend optimization actions.</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>They do not make legally binding decisions</li>
              <li>They do not replace human decisions</li>
              <li>They do not profile sensitive users</li>
              <li>They operate on functional service data</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0f172a]">10. DATA SHARING</h2>
            <p>OMNI SCALE does not sell personal data.</p>
            <p>Data may be shared only with essential providers for operation and security.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">11. TECHNOLOGY PROVIDERS</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Supabase Inc.</li>
              <li>Vercel Inc.</li>
              <li>Meta Platforms Inc.</li>
              <li>Google LLC</li>
              <li>Cloud and hosting providers</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0f172a]">12. INTERNATIONAL TRANSFERS</h2>
            <p>Data may be processed outside Peru due to the global nature of internet and cloud services.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">13. INFORMATION SECURITY</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>SSL/TLS encryption</li>
              <li>Secure authentication</li>
              <li>Role-based access control</li>
              <li>Continuous monitoring</li>
              <li>Auditable logs</li>
              <li>Protection against unauthorized access</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0f172a]">14. DATA RETENTION</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>While account remains active</li>
              <li>During service provision</li>
              <li>Until deletion is requested</li>
              <li>For legally required periods</li>
            </ul>

            <h2 className="text-xl font-semibold text-[#0f172a]">15. DATA SUBJECT RIGHTS</h2>
            <p>You may request access, rectification, deletion, portability, objection, and consent withdrawal.</p>
            <p>Contact: <strong>soporte@omniscale.pe</strong></p>

            <h2 className="text-xl font-semibold text-[#0f172a]">16. ACCOUNT AND DATA DELETION</h2>
            <p>You may request permanent deletion, integration disconnection, and associated data erasure.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">17. COOKIES</h2>
            <p>We use cookies for authentication, dashboard operation, analytics, and security.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">18. MINORS</h2>
            <p>OMNI SCALE is not intended for minors.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">19. PRIVACY BY DESIGN</h2>
            <p>OMNI SCALE applies Privacy by Design and Privacy by Default principles.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">20. LIMITATION OF LIABILITY</h2>
            <p>OMNI SCALE is a technology tool and does not assume responsibility for user business decisions.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">21. POLICY CHANGES</h2>
            <p>We may update this policy due to service evolution, legal changes, or new technologies.</p>

            <h2 className="text-xl font-semibold text-[#0f172a]">22. CONTACT</h2>
            <p>
              <strong>OMNI AGENCIA S.A.C.</strong><br />
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
        <header>
          <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Politica de Privacidad</h1>
          <p className="mt-3 text-sm text-slate-500">OMNI SCALE - Ultima actualizacion: 2026</p>
        </header>

        <section className="mt-8 space-y-6 text-slate-700">
          <h2 className="text-xl font-semibold text-[#0f172a]">1. INTRODUCCION</h2>
          <p>
            La presente Politica de Privacidad describe como <strong>OMNI AGENCIA S.A.C.</strong>, titular de la
            plataforma <strong>OMNI SCALE</strong>, recopila, utiliza, almacena, protege y trata la informacion
            personal de los usuarios que acceden o utilizan sus servicios digitales.
          </p>
          <p>
            OMNI SCALE es una plataforma SaaS orientada a analisis, automatizacion, optimizacion y gestion de
            campanas publicitarias mediante tecnologias de inteligencia artificial y procesamiento de datos.
          </p>
          <p>El respeto por la privacidad constituye un principio fundamental dentro del diseno y operacion del servicio.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">2. IDENTIFICACION DEL RESPONSABLE</h2>
          <p>
            <strong>Razon Social:</strong> OMNI AGENCIA S.A.C.<br />
            <strong>RUC:</strong> 20612101648<br />
            <strong>Direccion:</strong> Ca. Rio Chicama 5539, Peru<br />
            <strong>Correo:</strong> soporte@omniscale.pe<br />
            <strong>Plataforma:</strong> OMNI SCALE
          </p>
          <p>OMNI AGENCIA S.A.C. actua como Responsable del Tratamiento de Datos Personales.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">3. MARCO LEGAL APLICABLE</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Ley N 29733 de Proteccion de Datos Personales del Peru</li>
            <li>Reglamento de la Ley de Proteccion de Datos Personales</li>
            <li>GDPR cuando resulte aplicable</li>
            <li>Estandares internacionales de seguridad informatica</li>
            <li>Politicas de plataformas tecnologicas integradas (Meta, Google, etc.)</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">4. DEFINICIONES</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>Usuario:</strong> persona natural o juridica que utiliza OMNI SCALE.</li>
            <li><strong>Datos Personales:</strong> informacion que identifica o hace identificable a una persona.</li>
            <li><strong>Tratamiento:</strong> operacion realizada sobre datos personales.</li>
            <li><strong>Plataforma:</strong> software OMNI SCALE y servicios asociados.</li>
            <li><strong>Servicios de IA:</strong> sistemas automatizados que analizan informacion para recomendaciones.</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">5. INFORMACION QUE RECOPILAMOS</h2>
          <h3 className="text-lg font-semibold text-[#0f172a]">5.1 Informacion proporcionada por el usuario</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Nombre completo</li>
            <li>Correo electronico</li>
            <li>Nombre comercial o empresa</li>
            <li>Tipo de negocio</li>
            <li>Pais o region</li>
            <li>Informacion de onboarding</li>
            <li>Preferencias operativas</li>
          </ul>

          <h3 className="text-lg font-semibold text-[#0f172a]">5.2 Informacion de autenticacion</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Identificador unico de usuario</li>
            <li>Hash de credenciales</li>
            <li>Tokens de sesion</li>
            <li>Registros de acceso</li>
            <li>Verificaciones de correo</li>
          </ul>
          <p>OMNI SCALE no almacena contrasenas en texto plano.</p>

          <h3 className="text-lg font-semibold text-[#0f172a]">5.3 Informacion de integraciones externas</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>IDs de cuentas publicitarias</li>
            <li>Campanas activas</li>
            <li>Ad sets</li>
            <li>Creatividades</li>
            <li>Metricas de rendimiento</li>
            <li>Datos agregados de conversiones</li>
            <li>Estado de cuentas publicitarias</li>
          </ul>
          <p>El acceso ocurre unicamente mediante autorizacion explicita del usuario.</p>

          <h3 className="text-lg font-semibold text-[#0f172a]">5.4 Datos tecnicos y operativos</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Direccion IP</li>
            <li>Tipo de navegador</li>
            <li>Sistema operativo</li>
            <li>Resolucion de pantalla</li>
            <li>Identificadores de sesion</li>
            <li>Logs de actividad</li>
            <li>Eventos en el sistema</li>
          </ul>

          <h3 className="text-lg font-semibold text-[#0f172a]">5.5 Informacion generada por IA</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Analisis automatizados</li>
            <li>Recomendaciones estrategicas</li>
            <li>Predicciones de rendimiento</li>
            <li>Sugerencias de optimizacion</li>
          </ul>
          <p>Las decisiones finales permanecen bajo control humano del usuario.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">6. FINALIDADES DEL TRATAMIENTO</h2>
          <h3 className="text-lg font-semibold text-[#0f172a]">Operacion del servicio</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Crear cuentas</li>
            <li>Permitir acceso seguro</li>
            <li>Gestionar suscripciones</li>
            <li>Ejecutar funcionalidades del software</li>
          </ul>
          <h3 className="text-lg font-semibold text-[#0f172a]">Inteligencia y automatizacion</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Analizar campanas</li>
            <li>Generar insights</li>
            <li>Detectar oportunidades de mejora</li>
            <li>Automatizar procesos autorizados</li>
          </ul>
          <h3 className="text-lg font-semibold text-[#0f172a]">Seguridad</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Prevenir fraude</li>
            <li>Detectar accesos no autorizados</li>
            <li>Proteger infraestructura tecnologica</li>
          </ul>
          <h3 className="text-lg font-semibold text-[#0f172a]">Mejora continua</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Optimizar rendimiento del sistema</li>
            <li>Desarrollar nuevas funciones</li>
            <li>Analizar comportamiento agregado</li>
          </ul>
          <h3 className="text-lg font-semibold text-[#0f172a]">Cumplimiento legal</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Obligaciones regulatorias</li>
            <li>Requerimientos judiciales validos</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">7. BASE LEGAL</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Consentimiento del usuario</li>
            <li>Ejecucion contractual</li>
            <li>Interes legitimo</li>
            <li>Obligaciones legales</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">8. PRINCIPIOS DE PRIVACIDAD</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Licitud</li>
            <li>Transparencia</li>
            <li>Minimizacion de datos</li>
            <li>Seguridad</li>
            <li>Confidencialidad</li>
            <li>Limitacion de finalidad</li>
            <li>Responsabilidad proactiva</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">9. USO DE INTELIGENCIA ARTIFICIAL</h2>
          <p>La plataforma puede usar sistemas automatizados para evaluar, clasificar y recomendar acciones.</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>No toma decisiones legales vinculantes</li>
            <li>No reemplaza decisiones humanas</li>
            <li>No perfila usuarios sensibles</li>
            <li>Opera sobre datos funcionales del servicio</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">10. COMPARTICION DE DATOS</h2>
          <p>OMNI SCALE no vende datos personales.</p>
          <p>Solo comparte con proveedores esenciales para operacion y seguridad.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">11. PROVEEDORES TECNOLOGICOS</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Supabase Inc.</li>
            <li>Vercel Inc.</li>
            <li>Meta Platforms Inc.</li>
            <li>Google LLC</li>
            <li>Proveedores cloud y hosting</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">12. TRANSFERENCIA INTERNACIONAL</h2>
          <p>Los datos pueden procesarse fuera del Peru por la naturaleza global de internet y cloud.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">13. SEGURIDAD DE LA INFORMACION</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Cifrado SSL/TLS</li>
            <li>Autenticacion segura</li>
            <li>Control de acceso por roles</li>
            <li>Monitoreo continuo</li>
            <li>Registros auditables</li>
            <li>Proteccion contra acceso indebido</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">14. CONSERVACION DE DATOS</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Mientras la cuenta este activa</li>
            <li>Durante la prestacion del servicio</li>
            <li>Hasta solicitud de eliminacion</li>
            <li>Por periodos legales obligatorios</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">15. DERECHOS DEL TITULAR</h2>
          <p>Puedes solicitar acceso, rectificacion, eliminacion, portabilidad, oposicion y revocacion.</p>
          <p>Contacto: <strong>soporte@omniscale.pe</strong></p>

          <h2 className="text-xl font-semibold text-[#0f172a]">16. ELIMINACION DE CUENTA Y DATOS</h2>
          <p>Puedes solicitar eliminacion permanente, desconexion de integraciones y borrado de data asociada.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">17. COOKIES</h2>
          <p>Usamos cookies para autenticacion, dashboard, analitica y seguridad.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">18. MENORES</h2>
          <p>OMNI SCALE no esta dirigido a menores de edad.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">19. PRIVACIDAD POR DISENO</h2>
          <p>OMNI SCALE adopta Privacy by Design y Privacy by Default.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">20. LIMITACION DE RESPONSABILIDAD</h2>
          <p>OMNI SCALE es una herramienta tecnologica y no asume decisiones de negocio del usuario.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">21. MODIFICACIONES</h2>
          <p>La politica puede actualizarse por evolucion del servicio, cambios legales o nuevas tecnologias.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">22. CONTACTO</h2>
          <p>
            <strong>OMNI AGENCIA S.A.C.</strong><br />
            RUC: 20612101648<br />
            Direccion: Ca. Rio Chicama 5539, Peru<br />
            Correo: soporte@omniscale.pe
          </p>
        </section>
      </div>
    </main>
  );
}
