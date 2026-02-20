export default function DataDeletionPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-[#0f172a] sm:text-4xl">Politica de Eliminacion de Datos</h1>
        <p className="mt-3 text-sm text-slate-500">Ultima actualizacion: 20 de febrero de 2026</p>

        <section className="mt-8 space-y-5 text-slate-700">
          <p>
            Puedes solicitar la eliminacion de tus datos en cualquier momento. Esta politica detalla como procesamos
            esa solicitud.
          </p>
          <p>
            Para solicitar eliminacion, escribe a soporte indicando el correo de tu cuenta y una solicitud explicita de
            borrado. Podemos pedir verificacion de identidad antes de ejecutar cambios.
          </p>
          <p>
            Al confirmar la solicitud, eliminaremos o anonimizaremos datos personales y de uso asociados a tu cuenta,
            salvo los que deban conservarse por obligaciones legales o de seguridad.
          </p>
          <p>
            Si conectaste integraciones de terceros (como Meta/Facebook), te recomendamos revocar permisos desde esas
            plataformas ademas de la eliminacion interna en OMNI Scale.
          </p>
          <p>
            Los backups tecnicos pueden retener copias por periodos limitados antes de su depuracion automatica.
          </p>
        </section>
      </div>
    </main>
  );
}

