import LegalPage from "../../components/layout/legal-page";

export const metadata = {
  title: "Política de privacidad",
  description: "Cómo tratamos los datos personales en el Marketplace del Consultorio Empresarial Winner.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="3 de noviembre de 2026">
      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        Borrador: esta política debe ser revisada por la Universidad de Salamanca antes de su publicación definitiva.
      </p>

      <h2>1. Responsable</h2>
      <p>Universidad de Salamanca Colombia, a través del Consultorio Empresarial Winner.</p>

      <h2>2. Datos que recogemos</h2>
      <ul>
        <li>Datos de la cuenta: nombre, correo electrónico, tipo de perfil y contraseña (cifrada).</li>
        <li>Datos de perfil: los que decides añadir, como teléfono, carrera, empresa o enlaces.</li>
        <li>Datos de postulación: mensaje, teléfono, enlaces y hoja de vida (PDF o Word) que envías voluntariamente.</li>
      </ul>

      <h2>3. Finalidad</h2>
      <p>
        Usamos tus datos para operar la cuenta, mostrar tus publicaciones o perfil según lo autorices, gestionar
        postulaciones, enviarte avisos sobre tu cuenta y recuperar tu acceso.
      </p>

      <h2>4. Autorización</h2>
      <p>
        Al postularte autorizas expresamente compartir tus datos y tu hoja de vida con quien publicó la oferta. Puedes
        retirar la postulación en cualquier momento desde tu cuenta.
      </p>

      <h2>5. Seguridad y conservación</h2>
      <p>
        Protegemos los datos con controles de acceso y cifrado de contraseñas. Conservamos la información mientras la
        cuenta esté activa o sea necesaria para cumplir obligaciones legales.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Como titular, puedes conocer, actualizar, rectificar o suprimir tus datos, y revocar tu autorización, conforme a
        la Ley 1581 de 2012 y su normativa reglamentaria. También puedes consultar tus datos desde tu cuenta.
      </p>

      <h2>7. Consultas y reclamos</h2>
      <p>
        Para ejercer tus derechos escribe a la página de <a className="font-semibold text-unis-red hover:underline" href="/contacto">contacto</a>.
        Las consultas se responden en un plazo máximo de diez (10) días hábiles y los reclamos en un plazo máximo de quince
        (15) días hábiles, contados desde su recibo, prorrogables en los términos de la ley.
      </p>

      <h2>8. Vigencia</h2>
      <p>Esta política rige desde su publicación y se actualizará cuando cambien las finalidades del tratamiento.</p>
    </LegalPage>
  );
}
