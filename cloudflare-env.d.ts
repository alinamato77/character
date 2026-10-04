declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

declare namespace Cloudflare { interface Env { INBOX_OWNER_EMAIL?: string; } }
