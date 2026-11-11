-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" VARCHAR(2000),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "contact_email" VARCHAR(150),
ADD COLUMN     "headline" VARCHAR(160),
ADD COLUMN     "phone" VARCHAR(50),
ADD COLUMN     "profile_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "social_links" JSONB,
ADD COLUMN     "website" VARCHAR(500);
