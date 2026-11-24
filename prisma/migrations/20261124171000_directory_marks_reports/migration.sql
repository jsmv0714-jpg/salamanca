-- CreateTable
CREATE TABLE "directory_marks" (
    "user_id" UUID NOT NULL,
    "directory_profile_id" UUID NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "directory_marks_pkey" PRIMARY KEY ("user_id","directory_profile_id")
);

-- CreateTable
CREATE TABLE "directory_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "directory_profile_id" UUID NOT NULL,
    "reporter_id" UUID,
    "reason" "report_reason" NOT NULL,
    "details" VARCHAR(1000) NOT NULL,
    "status" "report_status" NOT NULL DEFAULT 'open',
    "admin_note" VARCHAR(500),
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "directory_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_directory_marks_saved" ON "directory_marks"("user_id", "saved");

-- CreateIndex
CREATE INDEX "idx_directory_marks_hidden" ON "directory_marks"("user_id", "hidden");

-- CreateIndex
CREATE INDEX "idx_directory_reports_status_created" ON "directory_reports"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_directory_reports_profile_reporter" ON "directory_reports"("directory_profile_id", "reporter_id");

-- AddForeignKey
ALTER TABLE "directory_marks" ADD CONSTRAINT "directory_marks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "directory_marks" ADD CONSTRAINT "directory_marks_directory_profile_id_fkey" FOREIGN KEY ("directory_profile_id") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "directory_reports" ADD CONSTRAINT "directory_reports_directory_profile_id_fkey" FOREIGN KEY ("directory_profile_id") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "directory_reports" ADD CONSTRAINT "directory_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "directory_reports" ADD CONSTRAINT "directory_reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
