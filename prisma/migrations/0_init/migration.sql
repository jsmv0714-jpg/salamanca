-- CreateEnum
CREATE TYPE "alliance_status_mvp" AS ENUM ('none', 'intention', 'active');

-- CreateEnum
CREATE TYPE "author_type" AS ENUM ('company', 'association', 'entrepreneur');

-- CreateEnum
CREATE TYPE "modality_type" AS ENUM ('presential', 'remote', 'hybrid');

-- CreateEnum
CREATE TYPE "publication_status" AS ENUM ('draft', 'published', 'closed', 'rejected', 'in_review');

-- CreateEnum
CREATE TYPE "publication_type_code" AS ENUM ('internship', 'b2b_offer', 'b2b_request');

-- CreateEnum
CREATE TYPE "student_availability" AS ENUM ('full_time', 'part_time', 'flexible');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('company', 'student', 'teacher', 'association', 'entrepreneur', 'admin');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "venture_type" AS ENUM ('spin_off', 'startup');

-- CreateEnum
CREATE TYPE "venture_status" AS ENUM ('draft', 'in_review', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "business_model" AS ENUM ('b2b', 'b2c', 'both');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('sent', 'viewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "areas_of_expertise" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "areas_of_expertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "associations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "sector_id" UUID,
    "logo_url" VARCHAR(500),
    "website" VARCHAR(500),
    "description" TEXT,
    "core_activity" TEXT,
    "contact_email" VARCHAR(150),
    "contact_phone" VARCHAR(50),
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "careers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "faculty" VARCHAR(150),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "trade_name" VARCHAR(200) NOT NULL,
    "legal_name" VARCHAR(200),
    "tax_id" VARCHAR(50),
    "sector_id" UUID,
    "logo_url" VARCHAR(500),
    "website" VARCHAR(500),
    "description" TEXT,
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "contact_email" VARCHAR(150),
    "contact_phone" VARCHAR(50),
    "linkedin_url" VARCHAR(500),
    "is_mipyme" BOOLEAN NOT NULL DEFAULT true,
    "alliance_status" "alliance_status_mvp" NOT NULL DEFAULT 'none',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrepreneurs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "project_name" VARCHAR(200),
    "description" TEXT,
    "phone" VARCHAR(50),
    "website" VARCHAR(500),
    "linkedin_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entrepreneurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_areas" (
    "publication_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,

    CONSTRAINT "publication_areas_pkey" PRIMARY KEY ("publication_id","area_id")
);

-- CreateTable
CREATE TABLE "publication_careers" (
    "publication_id" UUID NOT NULL,
    "career_id" UUID NOT NULL,

    CONSTRAINT "publication_careers_pkey" PRIMARY KEY ("publication_id","career_id")
);

-- CreateTable
CREATE TABLE "publication_sectors" (
    "publication_id" UUID NOT NULL,
    "sector_id" UUID NOT NULL,

    CONSTRAINT "publication_sectors_pkey" PRIMARY KEY ("publication_id","sector_id")
);

-- CreateTable
CREATE TABLE "publication_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" "publication_type_code" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publication_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "author_type" "author_type" NOT NULL,
    "publication_type_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(250) NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "benefits" TEXT,
    "location" VARCHAR(150),
    "modality" "modality_type",
    "deadline" DATE,
    "contact_email" VARCHAR(150),
    "contact_phone" VARCHAR(50),
    "show_contact" BOOLEAN NOT NULL DEFAULT true,
    "status" "publication_status" NOT NULL DEFAULT 'draft',
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejection_reason" TEXT,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "document_id" VARCHAR(50),
    "career_id" UUID,
    "semester" VARCHAR(20),
    "phone" VARCHAR(50),
    "bio" TEXT,
    "skills" JSONB,
    "cv_url" VARCHAR(500),
    "portfolio_url" VARCHAR(500),
    "linkedin_url" VARCHAR(500),
    "availability" "student_availability",
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "title" VARCHAR(150),
    "research_group_name" VARCHAR(150),
    "department" VARCHAR(150),
    "phone" VARCHAR(50),
    "bio" TEXT,
    "linkedin_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL DEFAULT '',
    "email" VARCHAR(150) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" VARCHAR(500),
    "password_hash" VARCHAR(255),
    "role" "user_role" NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'pending',
    "email_verified_at" TIMESTAMP(6),
    "last_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" UUID NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "venture_type" NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "tagline" VARCHAR(200),
    "description" TEXT NOT NULL,
    "sector_id" UUID,
    "business_model" "business_model" NOT NULL DEFAULT 'both',
    "trl_level" INTEGER NOT NULL DEFAULT 1,
    "service_stage" INTEGER,
    "research_group" VARCHAR(150),
    "senior_consultant" VARCHAR(150),
    "city" VARCHAR(100),
    "logo_url" VARCHAR(500),
    "website" VARCHAR(500),
    "linkedin_url" VARCHAR(500),
    "contact_email" VARCHAR(150),
    "status" "venture_status" NOT NULL DEFAULT 'draft',
    "rejection_reason" TEXT,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venture_areas" (
    "venture_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,

    CONSTRAINT "venture_areas_pkey" PRIMARY KEY ("venture_id","area_id")
);

-- CreateTable
CREATE TABLE "directory_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(200),
    "headline" VARCHAR(200),
    "core_expertise" TEXT,
    "business_model" "business_model",
    "sector_id" UUID,
    "city" VARCHAR(100),
    "website" VARCHAR(500),
    "linkedin_url" VARCHAR(500),
    "logo_url" VARCHAR(500),
    "contact_email" VARCHAR(150),
    "is_visible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "directory_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directory_profile_areas" (
    "profile_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,

    CONSTRAINT "directory_profile_areas_pkey" PRIMARY KEY ("profile_id","area_id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publication_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "cv_url" VARCHAR(500),
    "portfolio_url" VARCHAR(500),
    "linkedin_url" VARCHAR(500),
    "phone" VARCHAR(50),
    "data_consent" BOOLEAN NOT NULL DEFAULT false,
    "consent_at" TIMESTAMP(6),
    "status" "application_status" NOT NULL DEFAULT 'sent',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_of_expertise_name_key" ON "areas_of_expertise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "areas_of_expertise_slug_key" ON "areas_of_expertise"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "associations_user_id_key" ON "associations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "careers_name_key" ON "careers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "careers_slug_key" ON "careers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "entrepreneurs_user_id_key" ON "entrepreneurs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "publication_types_code_key" ON "publication_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "publications_slug_key" ON "publications"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sectors_name_key" ON "sectors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sectors_slug_key" ON "sectors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ventures_slug_key" ON "ventures"("slug");

-- CreateIndex
CREATE INDEX "idx_ventures_status" ON "ventures"("status");

-- CreateIndex
CREATE INDEX "idx_ventures_type" ON "ventures"("type");

-- CreateIndex
CREATE INDEX "idx_ventures_user" ON "ventures"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "directory_profiles_user_id_key" ON "directory_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_directory_profiles_visible" ON "directory_profiles"("is_visible");

-- CreateIndex
CREATE INDEX "idx_applications_applicant" ON "applications"("applicant_id");

-- CreateIndex
CREATE INDEX "idx_applications_status" ON "applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_applications_publication_applicant" ON "applications"("publication_id", "applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_files_application_id_key" ON "application_files"("application_id");

-- AddForeignKey
ALTER TABLE "associations" ADD CONSTRAINT "associations_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "associations" ADD CONSTRAINT "associations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entrepreneurs" ADD CONSTRAINT "entrepreneurs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publication_areas" ADD CONSTRAINT "publication_areas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_of_expertise"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publication_areas" ADD CONSTRAINT "publication_areas_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publication_careers" ADD CONSTRAINT "publication_careers_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publication_careers" ADD CONSTRAINT "publication_careers_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publication_sectors" ADD CONSTRAINT "publication_sectors_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publication_sectors" ADD CONSTRAINT "publication_sectors_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_publication_type_id_fkey" FOREIGN KEY ("publication_type_id") REFERENCES "publication_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventures" ADD CONSTRAINT "ventures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventures" ADD CONSTRAINT "ventures_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venture_areas" ADD CONSTRAINT "venture_areas_venture_id_fkey" FOREIGN KEY ("venture_id") REFERENCES "ventures"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venture_areas" ADD CONSTRAINT "venture_areas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_of_expertise"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "directory_profiles" ADD CONSTRAINT "directory_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "directory_profiles" ADD CONSTRAINT "directory_profiles_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "directory_profile_areas" ADD CONSTRAINT "directory_profile_areas_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "directory_profile_areas" ADD CONSTRAINT "directory_profile_areas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_of_expertise"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_files" ADD CONSTRAINT "application_files_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

