export default function DataDeletionPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Politica de Eliminacion de Datos</h1>
        <p className="mt-3 text-sm text-slate-500">Ultima actualizacion: 20 de febrero de 2026</p>

        <section className="mt-8 space-y-5 text-slate-700">
          <h2 className="font-semibold text-[#0f172a]">1. Introduccion</h2>
          <p>
            La presente Politica de Eliminacion de Datos describe el procedimiento mediante el cual los usuarios de la
            plataforma OMNI SCALE pueden solicitar la eliminacion de su informacion personal y como OMNI AGENCIA S.A.C.
            gestiona dicho proceso.
          </p>
          <p>
            OMNI SCALE respeta el derecho de los usuarios a controlar su informacion y garantiza procesos transparentes
            para la eliminacion definitiva de datos.
          </p>

          <h2 className="font-semibold text-[#0f172a]">2. Responsable del tratamiento</h2>
          <p>
            Empresa: OMNI AGENCIA S.A.C. <br />
            RUC: 20612101648 <br />
            Direccion: Ca. Rio Chicama 5539, Peru <br />
            Correo: soporte@omniscale.pe
          </p>

          <h2 className="font-semibold text-[#0f172a]">3. Derecho a la eliminacion</h2>
          <p>Todo usuario tiene derecho a solicitar:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>eliminacion completa de su cuenta</li>
            <li>eliminacion de datos personales</li>
            <li>eliminacion de integraciones conectadas</li>
            <li>eliminacion de informacion almacenada por la plataforma</li>
          </ul>
          <p>Este derecho puede ejercerse en cualquier momento.</p>

          <h2 className="font-semibold text-[#0f172a]">4. Formas de solicitar la eliminacion</h2>

          <h3 className="font-semibold text-[#0f172a]">4.1 Eliminacion directa desde la plataforma</h3>
          <p>
            El usuario podra eliminar su cuenta desde la configuracion del perfil dentro de OMNI SCALE, cuando dicha
            opcion se encuentre disponible en la interfaz del sistema.
          </p>

          <h3 className="font-semibold text-[#0f172a]">4.2 Solicitud por correo electronico</h3>
          <p>
            El usuario tambien puede enviar una solicitud a: <strong>soporte@omniscale.pe</strong>
          </p>
          <p>La solicitud debe incluir:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>correo asociado a la cuenta</li>
            <li>solicitud expresa de eliminacion</li>
          </ul>
          <p>
            Podemos solicitar verificacion de identidad o informacion adicional razonable para validar la titularidad
            de la cuenta antes de ejecutar cambios.
          </p>

          <h2 className="font-semibold text-[#0f172a]">5. Proceso de eliminacion</h2>
          <p>Una vez solicitada la eliminacion:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>La cuenta sera desactivada inmediatamente.</li>
            <li>El acceso del usuario quedara bloqueado.</li>
            <li>Las integraciones OAuth seran revocadas cuando corresponda.</li>
            <li>Se iniciara el proceso interno de eliminacion segura.</li>
          </ol>

          <h2 className="font-semibold text-[#0f172a]">6. Periodo de eliminacion</h2>
          <p>
            Todos los datos personales seran eliminados de forma permanente dentro de un plazo maximo de siete (7) dias
            calendario desde la solicitud de eliminacion o desde que el usuario elimine su cuenta.
          </p>
          <p>Durante este periodo:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>la cuenta permanece inaccesible</li>
            <li>los datos no son utilizados</li>
            <li>se ejecutan procesos tecnicos de borrado definitivo</li>
          </ul>

          <h2 className="font-semibold text-[#0f172a]">7. Datos que se eliminan</h2>
          <p>El proceso incluye la eliminacion de, segun corresponda:</p>

          <h3 className="font-semibold text-[#0f172a]">7.1 Datos de cuenta</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>nombre</li>
            <li>correo electronico</li>
            <li>identificadores de usuario</li>
            <li>configuraciones</li>
          </ul>

          <h3 className="font-semibold text-[#0f172a]">7.2 Datos de autenticacion</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>sesiones activas</li>
            <li>tokens de acceso</li>
            <li>credenciales cifradas o hash</li>
          </ul>

          <h3 className="font-semibold text-[#0f172a]">7.3 Datos publicitarios conectados</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>IDs de cuentas publicitarias</li>
            <li>activos importados</li>
            <li>metricas almacenadas</li>
            <li>configuraciones sincronizadas</li>
          </ul>

          <h3 className="font-semibold text-[#0f172a]">7.4 Datos generados por IA</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>analisis automatizados</li>
            <li>recomendaciones generadas</li>
            <li>historiales operativos</li>
          </ul>

          <h3 className="font-semibold text-[#0f172a]">7.5 Datos tecnicos</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>registros asociados al usuario</li>
            <li>identificadores internos</li>
          </ul>

          <h2 className="font-semibold text-[#0f172a]">8. Revocacion de permisos de terceros</h2>
          <p>
            Cuando la eliminacion involucre cuentas conectadas mediante Facebook Login, Meta Ads API, Google OAuth u
            otras integraciones, OMNI SCALE procedera a:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>eliminar tokens almacenados</li>
            <li>invalidar sesiones</li>
            <li>detener sincronizaciones automaticas</li>
          </ul>
          <p>
            El usuario tambien puede revocar permisos directamente desde las plataformas externas, de forma adicional a
            la eliminacion interna en OMNI SCALE.
          </p>

          <h2 className="font-semibold text-[#0f172a]">9. Copias de seguridad (backups)</h2>
          <p>
            Por motivos de seguridad operacional, algunos datos pueden permanecer temporalmente en backups cifrados.
            Dichos backups no son accesibles operativamente y los datos seran eliminados automaticamente conforme al
            ciclo de rotacion de backups.
          </p>
          <p>Los backups nunca se utilizan nuevamente para reactivar cuentas eliminadas.</p>

          <h2 className="font-semibold text-[#0f172a]">10. Excepciones legales</h2>
          <p>
            OMNI AGENCIA S.A.C. podra conservar informacion minima cuando sea necesario para cumplir obligaciones
            legales, resolver disputas, prevenir fraude o cumplir requerimientos regulatorios.
          </p>
          <p>Estos datos seran limitados y protegidos.</p>

          <h2 className="font-semibold text-[#0f172a]">11. Irreversibilidad</h2>
          <p>
            Una vez completada la eliminacion, la cuenta no podra recuperarse, los datos no podran restaurarse y el
            historial sera eliminado permanentemente. El usuario debera crear una nueva cuenta si desea volver a
            utilizar el servicio.
          </p>

          <h2 className="font-semibold text-[#0f172a]">12. Confirmacion de eliminacion</h2>
          <p>
            Finalizado el proceso, el sistema podra enviar confirmacion por correo electronico y registrar internamente
            la eliminacion completa.
          </p>

          <h2 className="font-semibold text-[#0f172a]">13. Seguridad del proceso</h2>
          <p>
            OMNI SCALE aplica procedimientos seguros para garantizar eliminacion irreversible, proteccion contra accesos
            posteriores y destruccion logica de registros.
          </p>

          <h2 className="font-semibold text-[#0f172a]">14. Tiempos operativos</h2>
          <p>
            Accion: Desactivacion de cuenta — Tiempo: Inmediata <br />
            Accion: Inicio eliminacion — Tiempo: Automatico <br />
            Accion: Eliminacion completa — Tiempo: Hasta 7 dias <br />
            Accion: Eliminacion en backups — Tiempo: Segun ciclo tecnico
          </p>

          <h2 className="font-semibold text-[#0f172a]">15. Relacion con la Politica de Privacidad</h2>
          <p>
            Esta politica complementa la Politica de Privacidad de OMNI SCALE y debe interpretarse de manera conjunta
            con ella.
          </p>

          <h2 className="font-semibold text-[#0f172a]">16. Contacto</h2>
          <p>
            Para consultas relacionadas con eliminacion de datos:
            <br />
            OMNI AGENCIA S.A.C. <br />
            RUC: 20612101648 <br />
            Direccion: Ca. Rio Chicama 5539, Peru <br />
            Correo: soporte@omniscale.pe
          </p>
        </section>
      </div>
    </main>
  );
}