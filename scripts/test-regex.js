function extractStatements(sql) {
  const results = [];
  const doBlockRe = /DO\s+\$\$\s+BEGIN\s+([\s\S]*?)\s+EXCEPTION\s+WHEN\s+\w+\s+THEN\s+null;\s+END\s+\$\$/gi;
  let remaining = sql;
  let match;
  while ((match = doBlockRe.exec(remaining)) !== null) {
    const inner = match[1].trim();
    if (inner) {
      const innerStmts = inner.split(';').map(s => s.trim()).filter(s => s.length > 0);
      results.push(...innerStmts);
    }
  }
  remaining = remaining.replace(doBlockRe, '');
  if (remaining.trim()) {
    const plain = remaining.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    results.push(...plain);
  }
  return results;
}

// Test with FKS_SQL pattern (ADD CONSTRAINT with duplicate_object)
const fks = 'DO $$ BEGIN ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;';

// Test with MIGRATIONS pattern (ADD COLUMN with duplicate_column)
const mig = 'DO $$ BEGIN ALTER TABLE "Settings" ADD COLUMN "configJson" JSONB; EXCEPTION WHEN duplicate_column THEN null; END $$;';

// Test ENUMS pattern (CREATE TYPE)
const enm = 'DO $$ BEGIN CREATE TYPE "SubscriptionCycle" AS ENUM (\'MONTHLY\',\'QUARTERLY\',\'SEMI_ANNUAL\',\'YEARLY\'); EXCEPTION WHEN duplicate_object THEN null; END $$;';

// Test mixed
const mixed = enm + '\n' + mig + '\n' + fks + '\nCREATE INDEX IF NOT EXISTS "test" ON "User" ("role");';

console.log('=== ENUMS ===');
console.log(JSON.stringify(extractStatements(enm), null, 2));
console.log('\n=== MIGRATIONS ===');
console.log(JSON.stringify(extractStatements(mig), null, 2));
console.log('\n=== FKS ===');
console.log(JSON.stringify(extractStatements(fks), null, 2));
console.log('\n=== MIXED ===');
console.log(JSON.stringify(extractStatements(mixed), null, 2));
