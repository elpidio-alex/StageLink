CREATE TYPE "StudentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "StudentProfile" ADD COLUMN "studentProofStatus" "StudentProofStatus" NOT NULL DEFAULT 'PENDING';