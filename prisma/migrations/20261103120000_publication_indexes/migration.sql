-- CreateIndex
CREATE INDEX "idx_publications_status_published_at" ON "publications"("status", "published_at");

-- CreateIndex
CREATE INDEX "idx_publications_user_id" ON "publications"("user_id");

