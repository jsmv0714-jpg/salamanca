-- CreateIndex
CREATE INDEX "idx_associations_sector" ON "associations"("sector_id");

-- CreateIndex
CREATE INDEX "idx_companies_sector" ON "companies"("sector_id");

-- CreateIndex
CREATE INDEX "idx_directory_profile_areas_area" ON "directory_profile_areas"("area_id");

-- CreateIndex
CREATE INDEX "idx_directory_profiles_sector" ON "directory_profiles"("sector_id");

-- CreateIndex
CREATE INDEX "idx_publication_areas_area" ON "publication_areas"("area_id");

-- CreateIndex
CREATE INDEX "idx_publication_careers_career" ON "publication_careers"("career_id");

-- CreateIndex
CREATE INDEX "idx_publication_marks_hidden" ON "publication_marks"("user_id", "hidden");

-- CreateIndex
CREATE INDEX "idx_publication_sectors_sector" ON "publication_sectors"("sector_id");

-- CreateIndex
CREATE INDEX "idx_users_status_role" ON "users"("status", "role");

-- CreateIndex
CREATE INDEX "idx_venture_areas_area" ON "venture_areas"("area_id");

-- CreateIndex
CREATE INDEX "idx_venture_marks_hidden" ON "venture_marks"("user_id", "hidden");

-- CreateIndex
CREATE INDEX "idx_ventures_status_published_at" ON "ventures"("status", "published_at");

-- CreateIndex
CREATE INDEX "idx_ventures_sector" ON "ventures"("sector_id");
