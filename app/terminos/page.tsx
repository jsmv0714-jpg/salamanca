import LegalPage from "../../components/layout/legal-page";

export const metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso del Marketplace del Consultorio Empresarial Winner.",
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y condiciones" updated="3 de noviembre de 2026">
      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        Borrador: este texto debe ser revisado y aprobado por la Universidad de Salamanca antes de su publicación definitiva.
      </p>

      <h2>1. Objeto</h2>
      <p>
        El Marketplace conecta a empresas, estudiantes, emprendedores, agremiaciones y docentes del Consultorio
        Empresarial Winner para publicar y encontrar oportunidades de prácticas y servicios entre empresas.
      </p>

      <h2>2. Cuentas</h2>
      <ul>
        <li>Debes registrar datos verdaderos y mantener tu contraseña en secreto.</li>
        <li>Cada persona puede tener una sola cuenta, y solo puedes usar la que corresponda a tu tipo de perfil.</li>
        <li>La cuenta debe estar activa para publicar o postularte. Un administrador puede activarla o suspenderla.</li>
      </ul>

      <h2>3. Publicaciones</h2>
      <p>
        Las publicaciones se revisan antes de hacerse públicas. Quien publica responde por la veracidad y legalidad de
        su contenido. No se permiten anuncios engañosos, discriminatorios, ilegales ni de cobro a estudiantes por
        acceder a una práctica.
      </p>

      <h2>4. Postulaciones</h2>
      <p>
        Al postularte autorizas que tus datos y, si los adjuntas, tu hoja de vida se compartan con quien publicó la
        oferta. El Marketplace no garantiza la contratación ni interviene en las decisiones de selección.
      </p>

      <h2>5. Suspensión</h2>
      <p>
        Podemos suspender o eliminar cuentas y publicaciones que incumplan estos términos, sin perjuicio de otras
        acciones legales.
      </p>

      <h2>6. Datos personales</h2>
      <p>El tratamiento de tus datos se rige por la Política de privacidad, que forma parte de estos términos.</p>

      <h2>7. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República de Colombia.</p>

      <h2>8. Cambios</h2>
      <p>Estos términos pueden actualizarse. La versión vigente es la publicada en esta página.</p>
    </LegalPage>
  );
}
