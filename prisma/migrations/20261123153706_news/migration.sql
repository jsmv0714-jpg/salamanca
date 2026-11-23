-- CreateEnum
CREATE TYPE "news_type" AS ENUM ('news', 'event', 'announcement');

-- CreateEnum
CREATE TYPE "news_status" AS ENUM ('draft', 'published');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notify_news" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "news" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID NOT NULL,
    "type" "news_type" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(250) NOT NULL,
    "summary" VARCHAR(400) NOT NULL,
    "body" TEXT NOT NULL,
    "cover_key" VARCHAR(500),
    "status" "news_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(6),
    "event_starts_at" TIMESTAMP(6),
    "event_location" VARCHAR(200),
    "event_url" VARCHAR(500),
    "emails_sent_at" TIMESTAMP(6),
    "emails_sent_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");

-- CreateIndex
CREATE INDEX "idx_news_status_published" ON "news"("status", "published_at");

-- CreateIndex
CREATE INDEX "idx_news_type_event" ON "news"("type", "event_starts_at");

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
