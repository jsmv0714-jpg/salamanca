import LegalPage from "../../components/layout/legal-page";

export const metadata = {
  title: "Contacto",
  description: "Cómo comunicarte con el Consultorio Empresarial Winner.",
};

export default function ContactoPage() {
  const email = process.env.CONTACT_EMAIL;

  return (
    <LegalPage title="Contacto" updated="3 de noviembre de 2026">
      <p>
        Para dudas sobre el Marketplace, tu cuenta o el tratamiento de tus datos, escríbenos al Consultorio Empresarial
        Winner de la Universidad de Salamanca Colombia.
      </p>
      {email ? (
        <p>
          Correo de contacto: <a className="font-semibold text-unis-red hover:underline" href={`mailto:${email}`}>{email}</a>
        </p>
      ) : (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          El correo de contacto aún no está configurado. Define <code>CONTACT_EMAIL</code> en el archivo <code>.env</code>.
        </p>
      )}
    </LegalPage>
  );
}
