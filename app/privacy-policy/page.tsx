export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Politica de Privacidad</h1>
        <p className="mt-3 text-sm text-slate-500">Ultima actualizacion: 20 de febrero de 2026</p>

        <section className="mt-8 space-y-5 text-slate-700">
          <p>
            En OMNI Scale respetamos tu privacidad. Esta politica explica que datos recopilamos, para que los usamos,
            como los protegemos y que opciones tienes sobre ellos.
          </p>
          <p>
            Recopilamos datos de cuenta (nombre, correo), datos de autenticacion, y datos de integraciones que conectes
            voluntariamente (por ejemplo, Meta/Facebook assets y tokens segun permisos otorgados).
          </p>
          <p>
            Usamos la informacion para operar la plataforma, mejorar el producto, brindar soporte, prevenir fraude y
            cumplir obligaciones legales.
          </p>
          <p>
            No vendemos datos personales. Podemos compartir informacion con proveedores de infraestructura y servicios
            necesarios para operar la plataforma bajo obligaciones de confidencialidad.
          </p>
          <p>
            Aplicamos medidas tecnicas y organizativas razonables para proteger la informacion. Aun asi, ningun sistema
            es 100% inmune a incidentes.
          </p>
          <p>
            Puedes solicitar acceso, correccion o eliminacion de tus datos mediante contacto directo con soporte.
          </p>
        </section>
      </div>
    </main>
  );
}

