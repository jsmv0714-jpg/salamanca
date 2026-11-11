"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Building2, Eye, GraduationCap, Phone, Rocket, Share2, Sparkles, Users, type LucideIcon } from "lucide-react";
import { Field, FormError, inputClass, primaryButtonClass } from "../../../components/ui/form";
import SkillInput from "../../../components/profile/skill-input";
import {
  AVAILABILITY_LABELS,
  PROFILE_LIMITS,
  ROLE_FIELDS,
  SOCIAL_NETWORKS,
  copyFor,
  type ProfileRole,
} from "../../../lib/profile";
import type { FormState } from "../../../lib/validation";

export type ProfessionalDefaults = {
  headline: string;
  bio: string;
  skills: string;
  city: string;
  phone: string;
  website: string;
  contact_email: string;
  social_linkedin: string;
  social_instagram: string;
  social_facebook: string;
  social_x: string;
  profile_public: boolean;
  career_id: string;
  semester: string;
  availability: string;
  portfolio_url: string;
  title: string;
  department: string;
  research_group_name: string;
  sector_id: string;
  address: string;
  core_activity: string;
  project_name: string;
};

type Option = { id: string; name: string };

const ROLE_SECTION: Record<ProfileRole, { title: string; icon: LucideIcon }> = {
  student: { title: "Formación y disponibilidad", icon: GraduationCap },
  teacher: { title: "Trayectoria académica", icon: BookOpen },
  company: { title: "Datos de la empresa", icon: Building2 },
  association: { title: "Datos de la agremiación", icon: Users },
  entrepreneur: { title: "Tu proyecto", icon: Rocket },
  admin: { title: "", icon: Sparkles },
};

export default function ProfessionalProfileForm({
  action,
  defaults,
  role,
  careers,
  sectors,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: ProfessionalDefaults;
  role: ProfileRole;
  careers: Option[];
  sectors: Option[];
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const copy = copyFor(role);
  const roleKeys = ROLE_FIELDS[role];
  const has = (key: string) => roleKeys.includes(key);

  const current = (key: Exclude<keyof ProfessionalDefaults, "profile_public">): string => {
    const sent = state.values?.[key];
    if (typeof sent === "string") return sent;
    return defaults[key];
  };
  const visible = state.values ? state.values.profile_public === "on" : defaults.profile_public;
  const err = (key: string) => state.fieldErrors?.[key];
  const socialValue = (key: string) => current(`social_${key}` as "social_x");
  const [bioLength, setBioLength] = useState(current("bio").length);

  const roleSection = ROLE_SECTION[role];
  const RoleIcon = roleSection.icon;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <FormError message={state.error} />

      <Section id="presentacion" step={1} icon={Sparkles} title="Presentación" description={copy.intro}>
        <div className="space-y-5">
          <Field label={copy.headline.label} htmlFor="headline" error={err("headline")} hint={copy.headline.hint}>
            <input
              id="headline"
              name="headline"
              type="text"
              maxLength={PROFILE_LIMITS.headline}
              defaultValue={current("headline")}
              className={inputClass}
            />
          </Field>

          <Field label={copy.bio.label} htmlFor="bio" error={err("bio")} hint={copy.bio.hint}>
            <textarea
              id="bio"
              name="bio"
              rows={6}
              maxLength={PROFILE_LIMITS.bio}
              defaultValue={current("bio")}
              onChange={(event) => setBioLength(event.target.value.length)}
              className={inputClass}
            />
            <p className="mt-1 text-right text-xs text-unis-gray tabular-nums">
              {bioLength} / {PROFILE_LIMITS.bio}
            </p>
          </Field>

          <SkillInput
            name="skills"
            label={copy.skills.label}
            hint={copy.skills.hint}
            error={err("skills")}
            initial={current("skills")}
          />
        </div>
      </Section>

      {roleKeys.length > 0 ? (
        <Section id="perfil-rol" step={2} icon={RoleIcon} title={roleSection.title}>
          <div className="space-y-5">
            {has("career_id") ? (
              <Field label="Carrera" htmlFor="career_id" error={err("career_id")}>
                <select id="career_id" name="career_id" defaultValue={current("career_id")} className={inputClass}>
                  <option value="">Sin definir</option>
                  {careers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            {has("semester") || has("availability") ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {has("semester") ? (
                  <Field label="Semestre" htmlFor="semester" error={err("semester")}>
                    <input
                      id="semester"
                      name="semester"
                      type="text"
                      maxLength={PROFILE_LIMITS.semester}
                      defaultValue={current("semester")}
                      className={inputClass}
                    />
                  </Field>
                ) : null}
                {has("availability") ? (
                  <Field label="Disponibilidad" htmlFor="availability" error={err("availability")}>
                    <select id="availability" name="availability" defaultValue={current("availability")} className={inputClass}>
                      <option value="">Sin definir</option>
                      {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
              </div>
            ) : null}

            {has("title") || has("department") || has("research_group_name") ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {has("title") ? (
                  <Field label="Cargo o título" htmlFor="title" error={err("title")}>
                    <input id="title" name="title" type="text" maxLength={PROFILE_LIMITS.title} defaultValue={current("title")} className={inputClass} />
                  </Field>
                ) : null}
                {has("department") ? (
                  <Field label="Departamento o facultad" htmlFor="department" error={err("department")}>
                    <input id="department" name="department" type="text" maxLength={PROFILE_LIMITS.department} defaultValue={current("department")} className={inputClass} />
                  </Field>
                ) : null}
                {has("research_group_name") ? (
                  <Field label="Grupo de investigación" htmlFor="research_group_name" error={err("research_group_name")}>
                    <input
                      id="research_group_name"
                      name="research_group_name"
                      type="text"
                      maxLength={PROFILE_LIMITS.research_group_name}
                      defaultValue={current("research_group_name")}
                      className={inputClass}
                    />
                  </Field>
                ) : null}
              </div>
            ) : null}

            {has("sector_id") ? (
              <Field label="Sector" htmlFor="sector_id" error={err("sector_id")}>
                <select id="sector_id" name="sector_id" defaultValue={current("sector_id")} className={inputClass}>
                  <option value="">Sin sector</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            {has("core_activity") ? (
              <Field label="Actividad principal" htmlFor="core_activity" error={err("core_activity")}>
                <textarea id="core_activity" name="core_activity" rows={3} maxLength={PROFILE_LIMITS.core_activity} defaultValue={current("core_activity")} className={inputClass} />
              </Field>
            ) : null}

            {has("project_name") ? (
              <Field label="Nombre del proyecto" htmlFor="project_name" error={err("project_name")}>
                <input id="project_name" name="project_name" type="text" maxLength={PROFILE_LIMITS.project_name} defaultValue={current("project_name")} className={inputClass} />
              </Field>
            ) : null}

            {has("address") ? (
              <Field label="Dirección" htmlFor="address" error={err("address")}>
                <input id="address" name="address" type="text" maxLength={PROFILE_LIMITS.address} defaultValue={current("address")} className={inputClass} />
              </Field>
            ) : null}

            {has("portfolio_url") ? (
              <Field label="Portafolio" htmlFor="portfolio_url" error={err("portfolio_url")} hint="Enlace a tus trabajos, repositorio o sitio personal.">
                <input id="portfolio_url" name="portfolio_url" type="text" inputMode="url" placeholder="https://" maxLength={PROFILE_LIMITS.portfolio_url} defaultValue={current("portfolio_url")} className={inputClass} />
              </Field>
            ) : null}
          </div>
        </Section>
      ) : null}

      <Section id="contacto" step={roleKeys.length > 0 ? 3 : 2} icon={Phone} title="Contacto" description="Solo se muestra lo que completes, y únicamente a miembros con sesión iniciada cuando tu perfil es visible.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ciudad" htmlFor="city" error={err("city")}>
            <input id="city" name="city" type="text" maxLength={PROFILE_LIMITS.city} defaultValue={current("city")} className={inputClass} />
          </Field>
          <Field label="Teléfono" htmlFor="phone" error={err("phone")}>
            <input id="phone" name="phone" type="tel" maxLength={PROFILE_LIMITS.phone} defaultValue={current("phone")} className={inputClass} />
          </Field>
          <Field label="Correo de contacto" htmlFor="contact_email" error={err("contact_email")} hint="Opcional. Puede ser distinto a tu correo de acceso.">
            <input id="contact_email" name="contact_email" type="email" maxLength={PROFILE_LIMITS.contact_email} defaultValue={current("contact_email")} className={inputClass} />
          </Field>
          <Field label="Sitio web" htmlFor="website" error={err("website")}>
            <input id="website" name="website" type="text" inputMode="url" placeholder="https://" maxLength={PROFILE_LIMITS.website} defaultValue={current("website")} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section id="redes" step={roleKeys.length > 0 ? 4 : 3} icon={Share2} title="Redes sociales" description="Pega el enlace completo de tu perfil. Déjalo vacío si no usas la red.">
        <div className="grid gap-5 sm:grid-cols-2">
          {SOCIAL_NETWORKS.map((network) => (
            <Field key={network.key} label={network.label} htmlFor={`social_${network.key}`} error={err(`social_${network.key}`)}>
              <input
                id={`social_${network.key}`}
                name={`social_${network.key}`}
                type="text"
                inputMode="url"
                placeholder="https://"
                maxLength={500}
                defaultValue={socialValue(network.key)}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section id="visibilidad" step={roleKeys.length > 0 ? 5 : 4} icon={Eye} title="Visibilidad">
        <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-unis-lightgray p-4 transition hover:border-unis-cyan">
          <input
            type="checkbox"
            name="profile_public"
            defaultChecked={visible}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-unis-lightgray transition peer-checked:bg-unis-cyan peer-focus-visible:ring-2 peer-focus-visible:ring-unis-cyan/60 after:absolute after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
          />
          <span>
            <span className="block text-sm font-semibold text-unis-text">Mostrar mi perfil a otros miembros</span>
            <span className="mt-0.5 block text-xs text-unis-gray">
              Solo lo verán personas con cuenta en el Marketplace que hayan iniciado sesión. Tus postulaciones siguen
              visibles para quien publicó la oferta, como hasta ahora.
            </span>
          </span>
        </label>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-4 border-t border-unis-lightgray bg-white/95 px-4 py-4 shadow-[0_-8px_24px_-16px_rgba(42,34,102,0.25)] backdrop-blur sm:-mx-0 sm:rounded-2xl sm:border sm:px-6">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Guardando..." : "Guardar perfil"}
        </button>
        <Link href="/cuenta" className="text-sm font-medium text-unis-gray hover:text-unis-red">
          Volver a mi cuenta
        </Link>
      </div>
    </form>
  );
}

function Section({
  id,
  step,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  step: number;
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-unis-lightgray bg-white p-6 shadow-sm transition hover:shadow-md sm:p-8">
      <header className="mb-6 flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-unis-cyan/10 text-unis-red ring-1 ring-inset ring-unis-cyan/30">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-unis-cyan">Paso {step}</p>
          <h2 className="text-lg font-bold text-unis-text">{title}</h2>
          {description ? <p className="mt-1 text-sm text-unis-gray">{description}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}
