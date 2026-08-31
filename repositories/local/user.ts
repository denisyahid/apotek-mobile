import usersJson from "@/data/users.json";
import { readJson, writeJson, StorageKeys } from "@/lib/storage";
import type { UserRepository } from "@/repositories/types";
import type { Session, StoredUser, User } from "@/types";

const SEED_USERS = usersJson as unknown as StoredUser[];

/**
 * PROTOTYPE AUTH (jangan dipakai production):
 * - user seed dari users.json + pendaftaran baru disimpan di LocalStorage
 * - password hanya disimpan sebagai hash demo (lihat lib/auth.ts)
 * - sesi login disimpan sebagai `apotek:currentUser`
 * Production: Supabase Auth (email/password + role), sesi via JWT/cookie.
 */
export class LocalUserRepository implements UserRepository {
  private localUsers(): StoredUser[] {
    return readJson<StoredUser[]>(StorageKeys.users, []);
  }

  async getAll(): Promise<StoredUser[]> {
    const locals = this.localUsers();
    const merged = [...locals];
    for (const seed of SEED_USERS) {
      if (!locals.some((u) => u.id === seed.id)) merged.push(seed);
    }
    return merged;
  }

  async getById(id: string): Promise<User | null> {
    const u = (await this.getAll()).find((x) => x.id === id);
    if (!u) return null;
    const { passwordHash: _ignored, ...rest } = u;
    return rest;
  }

  async findByEmail(email: string): Promise<StoredUser | null> {
    const target = email.trim().toLowerCase();
    return (await this.getAll()).find((x) => x.email.toLowerCase() === target) ?? null;
  }

  async save(user: StoredUser): Promise<StoredUser> {
    const locals = this.localUsers();
    const idx = locals.findIndex((u) => u.id === user.id);
    if (idx >= 0) locals[idx] = user;
    else locals.push(user);
    writeJson(StorageKeys.users, locals);
    return user;
  }

  async getSession(): Promise<Session | null> {
    return readJson<Session | null>(StorageKeys.session, null);
  }

  async setSession(session: Session | null): Promise<void> {
    if (session === null) {
      writeJson(StorageKeys.session, null);
    } else {
      writeJson(StorageKeys.session, session);
    }
  }
}
