import { demoHashPassword, demoVerifyPassword } from "@/lib/auth";
import { generateId, nowISO } from "@/lib/id";
import { getRepositories } from "@/repositories";
import type { Session, StoredUser } from "@/types";

/**
 * PROTOTYPE AUTH — akun dummy dari data/users.json + pendaftaran LocalStorage.
 * PRODUCTION: ganti dengan Supabase Auth (password tidak pernah menyentuh
 * LocalStorage; sesi via httpOnly cookie). Kontrak method di bawah disamakan
 * dengan Supabase (signIn/signUp/signOut) agar UI tidak berubah.
 */
export const authService = {
  async getSession(): Promise<Session | null> {
    return getRepositories().users.getSession();
  },

  async signIn(email: string, password: string): Promise<Session> {
    const repo = getRepositories().users;
    const user = await repo.findByEmail(email);
    if (!user || !demoVerifyPassword(password, user.passwordHash)) {
      throw new Error("Email atau kata sandi salah.");
    }
    const session: Session = {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      loggedAt: nowISO(),
    };
    await repo.setSession(session);
    return session;
  },

  async signUp(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<Session> {
    const repo = getRepositories().users;
    const existing = await repo.findByEmail(input.email);
    if (existing) {
      throw new Error("Email sudah terdaftar. Silakan masuk.");
    }
    const user: StoredUser = {
      id: generateId("USR"),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      role: "patient",
      // PROTOTYPE: hash demo — production memakai auth backend (argon2/bcrypt)
      passwordHash: demoHashPassword(input.password),
      createdAt: nowISO(),
    };
    await repo.save(user);
    const session: Session = {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      loggedAt: nowISO(),
    };
    await repo.setSession(session);
    return session;
  },

  async signOut(): Promise<void> {
    await getRepositories().users.setSession(null);
  },
};
