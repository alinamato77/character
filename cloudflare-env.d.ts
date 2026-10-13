declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

declare namespace Cloudflare { interface Env { INBOX_OWNER_EMAIL?: string; } }

declare namespace Cloudflare { interface Env { INBOX_ACCESS_CODE?: string; INBOX_RATE_SALT?: string; } }
