-- CreateTable
CREATE TABLE "publication_marks" (
    "user_id" UUID NOT NULL,
    "publication_id" UUID NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publication_marks_pkey" PRIMARY KEY ("user_id","publication_id")
);

-- CreateTable
CREATE TABLE "venture_marks" (
    "user_id" UUID NOT NULL,
    "venture_id" UUID NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venture_marks_pkey" PRIMARY KEY ("user_id","venture_id")
);

-- CreateTable
CREATE TABLE "venture_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venture_id" UUID NOT NULL,
    "reporter_id" UUID,
    "reason" "report_reason" NOT NULL,
    "details" VARCHAR(1000) NOT NULL,
    "status" "report_status" NOT NULL DEFAULT 'open',
    "admin_note" VARCHAR(500),
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venture_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_publication_marks_saved" ON "publication_marks"("user_id", "saved");

-- CreateIndex
CREATE INDEX "idx_venture_marks_saved" ON "venture_marks"("user_id", "saved");

-- CreateIndex
CREATE INDEX "idx_venture_reports_status_created" ON "venture_reports"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_venture_reports_venture_reporter" ON "venture_reports"("venture_id", "reporter_id");

-- AddForeignKey
ALTER TABLE "publication_marks" ADD CONSTRAINT "publication_marks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publication_marks" ADD CONSTRAINT "publication_marks_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venture_marks" ADD CONSTRAINT "venture_marks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venture_marks" ADD CONSTRAINT "venture_marks_venture_id_fkey" FOREIGN KEY ("venture_id") REFERENCES "ventures"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venture_reports" ADD CONSTRAINT "venture_reports_venture_id_fkey" FOREIGN KEY ("venture_id") REFERENCES "ventures"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venture_reports" ADD CONSTRAINT "venture_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venture_reports" ADD CONSTRAINT "venture_reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
