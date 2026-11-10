-- CreateTable
CREATE TABLE "role_changes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "changed_by_id" UUID,
    "from_role" "user_role" NOT NULL,
    "to_role" "user_role" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_role_changes_user_created" ON "role_changes"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_role_changes_created" ON "role_changes"("created_at");

-- AddForeignKey
ALTER TABLE "role_changes" ADD CONSTRAINT "role_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_changes" ADD CONSTRAINT "role_changes_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

