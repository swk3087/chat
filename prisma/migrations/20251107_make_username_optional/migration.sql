SET search_path = public;

-- username 필수 해제
ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL;

-- emailVerified 컬럼 추가 (이미 있으면 건너뜀)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'emailVerified'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMPTZ;
  END IF;
END $$;
