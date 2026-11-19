declare module 'connect-pg-simple' {
  import type { Store } from 'express-session';
  import type { Pool } from 'pg';

  interface PgStoreOptions {
    pool: Pool;
    createTableIfMissing?: boolean;
  }

  function connectPgSimple(
    session: typeof import('express-session')
  ): new (options: PgStoreOptions) => Store;

  export default connectPgSimple;
}
