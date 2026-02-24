export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <header>
          <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">
            Política de Privacidad
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            OMNI SCALE — Última actualización: 2026
          </p>
        </header>

        <section className="mt-8 space-y-5 text-slate-700">
          <p>
            La presente Política de Privacidad describe cómo <strong>OMNI AGENCIA S.A.C.</strong>, titular de la
            plataforma tecnológica <strong>OMNI SCALE</strong>, recopila, utiliza, almacena, protege y trata la
            información personal de los usuarios que acceden o utilizan sus servicios digitales.
          </p>

          <p>
            OMNI SCALE es una plataforma SaaS orientada a análisis, automatización, optimización y gestión de campañas
            publicitarias mediante tecnologías de inteligencia artificial y procesamiento de datos.
          </p>

          <p>El respeto por la privacidad constituye un principio fundamental dentro del diseño y operación de nuestros servicios.</p>
        </section>

        <hr className="my-10 border-slate-200" />

        <section className="space-y-6 text-slate-700">
          <h2 className="text-xl font-semibold text-[#0f172a]">1. INTRODUCCIÓN</h2>
          <p>
            La presente Política de Privacidad describe cómo <strong>OMNI AGENCIA S.A.C.</strong>, titular de la
            plataforma tecnológica <strong>OMNI SCALE</strong>, recopila, utiliza, almacena, protege y trata la
            información personal de los usuarios que acceden o utilizan sus servicios digitales.
          </p>
          <p>
            OMNI SCALE es una plataforma SaaS orientada a análisis, automatización, optimización y gestión de campañas
            publicitarias mediante tecnologías de inteligencia artificial y procesamiento de datos.
          </p>
          <p>El respeto por la privacidad constituye un principio fundamental dentro del diseño y operación de nuestros servicios.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">2. IDENTIFICACIÓN DEL RESPONSABLE</h2>
          <p>
            <strong>Razón Social:</strong> OMNI AGENCIA S.A.C.
            <br />
            <strong>RUC:</strong> 20612101648
            <br />
            <strong>Dirección:</strong> Ca. Río Chicama 5539, Perú
            <br />
            <strong>Correo electrónico:</strong> soporte@omniscale.pe
            <br />
            <strong>Plataforma:</strong> OMNI SCALE
          </p>
          <p>OMNI AGENCIA S.A.C. actúa como <strong>Responsable del Tratamiento de Datos Personales</strong>.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">3. MARCO LEGAL APLICABLE</h2>
          <p>El tratamiento de datos personales se realiza conforme a:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Ley N° 29733 — Ley de Protección de Datos Personales del Perú</li>
            <li>Reglamento de la Ley de Protección de Datos Personales</li>
            <li>Reglamento General de Protección de Datos (GDPR) cuando resulte aplicable</li>
            <li>Estándares internacionales de seguridad informática</li>
            <li>Políticas de plataformas tecnológicas integradas (Meta, Google, etc.)</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">4. DEFINICIONES</h2>
          <p>Para efectos de esta política:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>Usuario:</strong> persona natural o jurídica que utiliza OMNI SCALE.</li>
            <li><strong>Datos Personales:</strong> información que identifica o hace identificable a una persona.</li>
            <li><strong>Tratamiento:</strong> cualquier operación realizada sobre datos personales.</li>
            <li><strong>Plataforma:</strong> software OMNI SCALE y sus servicios asociados.</li>
            <li><strong>Servicios de IA:</strong> sistemas automatizados que analizan información para generar recomendaciones.</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">5. INFORMACIÓN QUE RECOPILAMOS</h2>

          <h3 className="text-lg font-semibold text-[#0f172a]">5.1 Información proporcionada directamente por el usuario</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Nombre completo</li>
            <li>Dirección de correo electrónico</li>
            <li>Nombre comercial o empresa</li>
            <li>Tipo de negocio</li>
            <li>País o región</li>
            <li>Información ingresada durante onboarding</li>
            <li>Preferencias operativas</li>
          </ul>

          <h3 className="text-lg font-semibold text-[#0f172a]">5.2 Información de autenticación</h3>
          <p>Cuando el usuario crea o accede a una cuenta:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Identificador único de usuario</li>
            <li>Hash de credenciales</li>
            <li>Tokens de sesión</li>
            <li>Registros de acceso</li>
            <li>Verificaciones de correo electrónico</li>
          </ul>
          <p>
            OMNI SCALE <strong>no almacena contraseñas en texto plano</strong>.
          </p>

          <h3 className="text-lg font-semibold text-[#0f172a]">5.3 Información proveniente de integraciones externas</h3>
          <p>Cuando el usuario conecta plataformas publicitarias, podemos acceder a:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>ID de cuentas publicitarias</li>
            <li>Campañas activas</li>
            <li>Conjuntos de anuncios</li>
            <li>Creatividades</li>
            <li>Métricas de rendimiento</li>
            <li>Datos agregados de conversiones</li>
            <li>Estado de cuentas publicitarias</li>
          </ul>
          <p>El acceso ocurre únicamente mediante autorización explícita del usuario.</p>

          <h3 className="text-lg font-semibold text-[#0f172a]">5.4 Datos técnicos y operativos</h3>
          <p>Recopilamos automáticamente:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Dirección IP</li>
            <li>Tipo de navegador</li>
            <li>Sistema operativo</li>
            <li>Resolución de pantalla</li>
            <li>Identificadores de sesión</li>
            <li>Logs de actividad</li>
            <li>Eventos dentro del sistema</li>
          </ul>

          <h3 className="text-lg font-semibold text-[#0f172a]">5.5 Información generada por Inteligencia Artificial</h3>
          <p>
            OMNI SCALE puede procesar datos operativos para generar:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>análisis automatizados</li>
            <li>recomendaciones estratégicas</li>
            <li>predicciones de rendimiento</li>
            <li>sugerencias de optimización</li>
          </ul>
          <p>Las decisiones finales siempre permanecen bajo control humano del usuario.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">6. FINALIDADES DEL TRATAMIENTO</h2>
          <p>Utilizamos la información para:</p>

          <h3 className="text-lg font-semibold text-[#0f172a]">Operación del servicio</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Crear cuentas</li>
            <li>Permitir acceso seguro</li>
            <li>Gestionar suscripciones</li>
            <li>Ejecutar funcionalidades del software</li>
          </ul>

          <h3 className="text-lg font-semibold text-[#0f172a]">Inteligencia y automatización</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Analizar campañas</li>
            <li>Generar insights</li>
            <li>Detectar oportunidades de mejora</li>
            <li>Automatizar procesos autorizados</li>
          </ul>

          <h3 className="text-lg font-semibold text-[#0f172a]">Seguridad</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Prevenir fraude</li>
            <li>Detectar accesos no autorizados</li>
            <li>Proteger infraestructura tecnológica</li>
          </ul>

          <h3 className="text-lg font-semibold text-[#0f172a]">Mejora continua</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Optimizar rendimiento del sistema</li>
            <li>Desarrollar nuevas funciones</li>
            <li>Analizar comportamiento agregado de usuarios</li>
          </ul>

          <h3 className="text-lg font-semibold text-[#0f172a]">Cumplimiento legal</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>Obligaciones regulatorias</li>
            <li>Requerimientos judiciales válidos</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">7. BASE LEGAL DEL TRATAMIENTO</h2>
          <p>El tratamiento se fundamenta en:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Consentimiento del usuario</li>
            <li>Ejecución contractual del servicio SaaS</li>
            <li>Interés legítimo empresarial</li>
            <li>Cumplimiento de obligaciones legales</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">8. PRINCIPIOS DE PRIVACIDAD APLICADOS</h2>
          <p>OMNI SCALE aplica los siguientes principios:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Licitud</li>
            <li>Transparencia</li>
            <li>Minimización de datos</li>
            <li>Seguridad</li>
            <li>Confidencialidad</li>
            <li>Limitación de finalidad</li>
            <li>Responsabilidad proactiva</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">9. USO DE INTELIGENCIA ARTIFICIAL</h2>
          <p>La plataforma puede emplear sistemas automatizados para:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>evaluar estructuras publicitarias</li>
            <li>clasificar campañas</li>
            <li>generar recomendaciones estratégicas</li>
            <li>sugerir acciones operativas</li>
          </ul>
          <p>Los sistemas de IA:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>no toman decisiones legales vinculantes</li>
            <li>no reemplazan decisiones humanas</li>
            <li>no perfilan usuarios sensibles</li>
            <li>operan sobre datos funcionales del servicio</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">10. COMPARTICIÓN DE DATOS</h2>
          <p>OMNI SCALE <strong>no vende ni comercializa datos personales</strong>.</p>
          <p>Podremos compartir información únicamente con:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>proveedores cloud</li>
            <li>servicios de autenticación</li>
            <li>plataformas publicitarias conectadas</li>
            <li>procesadores tecnológicos necesarios</li>
          </ul>
          <p>Todos los proveedores cumplen estándares internacionales de seguridad.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">11. PROVEEDORES TECNOLÓGICOS</h2>
          <p>Podemos utilizar infraestructura de:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Supabase Inc.</li>
            <li>Vercel Inc.</li>
            <li>Meta Platforms Inc.</li>
            <li>Google LLC</li>
            <li>Proveedores de hosting y cloud computing</li>
          </ul>
          <p>Cada proveedor posee sus propias políticas de privacidad.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">12. TRANSFERENCIA INTERNACIONAL DE DATOS</h2>
          <p>
            Los datos pueden procesarse fuera del Perú debido a la naturaleza global de internet y los servicios cloud.
          </p>
          <p>Las transferencias se realizan bajo medidas adecuadas de protección y estándares internacionales.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">13. SEGURIDAD DE LA INFORMACIÓN</h2>
          <p>Implementamos medidas técnicas y organizativas como:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>cifrado SSL/TLS</li>
            <li>autenticación segura</li>
            <li>control de accesos por roles</li>
            <li>monitoreo continuo</li>
            <li>registros auditables</li>
            <li>protección contra accesos indebidos</li>
          </ul>
          <p>Ningún sistema conectado a internet puede garantizar seguridad absoluta.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">14. CONSERVACIÓN DE DATOS</h2>
          <p>Los datos serán conservados:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>mientras exista cuenta activa</li>
            <li>durante la prestación del servicio</li>
            <li>hasta solicitud de eliminación</li>
            <li>por periodos exigidos legalmente</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">15. DERECHOS DEL TITULAR DE DATOS</h2>
          <p>El usuario puede ejercer:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Acceso</li>
            <li>Rectificación</li>
            <li>Cancelación</li>
            <li>Oposición</li>
            <li>Portabilidad</li>
            <li>Eliminación de datos</li>
            <li>Revocación del consentimiento</li>
          </ul>
          <p>
            Solicitud mediante: <strong>soporte@omniscale.pe</strong>
          </p>

          <h2 className="text-xl font-semibold text-[#0f172a]">16. ELIMINACIÓN DE CUENTA Y DATOS</h2>
          <p>El usuario puede solicitar:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>eliminación permanente</li>
            <li>desconexión de integraciones</li>
            <li>borrado de información asociada</li>
          </ul>
          <p>La eliminación puede requerir tiempo técnico razonable para completarse.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">17. COOKIES Y TECNOLOGÍAS DE SEGUIMIENTO</h2>
          <p>Utilizamos cookies para:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>autenticación</li>
            <li>funcionamiento del dashboard</li>
            <li>análisis estadístico</li>
            <li>seguridad</li>
          </ul>
          <p>El usuario puede deshabilitarlas desde su navegador.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">18. DATOS DE MENORES</h2>
          <p>OMNI SCALE no está dirigido a menores de edad.</p>
          <p>Si se detecta información de menores, será eliminada.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">19. PRIVACIDAD POR DISEÑO</h2>
          <p>OMNI SCALE adopta principios de:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Privacy by Design</li>
            <li>Privacy by Default</li>
          </ul>
          <p>La protección de datos forma parte del diseño arquitectónico del sistema.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">20. LIMITACIÓN DE RESPONSABILIDAD</h2>
          <p>OMNI SCALE actúa como herramienta tecnológica.</p>
          <p>El usuario mantiene responsabilidad sobre:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>campañas ejecutadas</li>
            <li>decisiones comerciales</li>
            <li>cumplimiento normativo publicitario</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#0f172a]">21. MODIFICACIONES DE LA POLÍTICA</h2>
          <p>Podremos actualizar esta Política cuando:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>evolucione el servicio</li>
            <li>cambie la legislación</li>
            <li>se incorporen nuevas tecnologías</li>
          </ul>
          <p>La versión vigente estará siempre disponible en el sitio web.</p>

          <h2 className="text-xl font-semibold text-[#0f172a]">22. CONTACTO Y EJERCICIO DE DERECHOS</h2>
          <p>
            <strong>OMNI AGENCIA S.A.C.</strong>
            <br />
            <strong>RUC:</strong> 20612101648
            <br />
            <strong>Dirección:</strong> Ca. Río Chicama 5539, Perú
            <br />
            <strong>Correo:</strong> soporte@omniscale.pe
          </p>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © 2026 OMNI Scale — Un producto de OMNI AGENCIA S.A.C.
        </footer>
      </div>
    </main>
  );
}