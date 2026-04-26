import { getUserId } from './session';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8787';

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  authed?: boolean;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.authed !== false) {
    const userId = getUserId();
    if (userId) headers['X-User-Id'] = userId;
  }

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export type AgeRange = '20s_early' | '20s_late' | '30s_early' | '30s_late' | 'other';
export type RelationshipIntent = 'friend' | 'slow' | 'romance' | 'marriage' | 'undecided';
export type Chronotype = 'morning' | 'day' | 'night';

export interface ProfileExtras {
  ageRange?: AgeRange;
  relationshipIntent?: RelationshipIntent;
  chronotype?: Chronotype;
  hobbies?: string[];
  question1?: string;
  question2?: string;
}

export interface CreateUserInput {
  nickname: string;
  iconUrl?: string | null;
  profileSummary?: string | null;
  profileDetail?: string | null;
  profileExtras?: ProfileExtras;
}

export function createUser(input: CreateUserInput) {
  return apiFetch<{
    id: string;
    nickname: string;
    created_at: string;
    recovery_code: string;
  }>('/api/users', {
    method: 'POST',
    body: input,
    authed: false,
  });
}

export function recoverByCode(recoveryCode: string) {
  return apiFetch<{ id: string; nickname: string }>('/api/auth/recover', {
    method: 'POST',
    body: { recoveryCode },
    authed: false,
  });
}

// 開発モード専用: サンプル相手とのすれ違い履歴を自分のアカウントに付与
export function seedDevEncounters() {
  return apiFetch<{ ok: true; generated: string[]; skipped: string[] }>(
    '/api/dev/seed-encounters',
    { method: 'POST', body: {} },
  );
}

export function setHome(lat: number, lng: number) {
  return apiFetch<{ ok: true }>('/api/users/me/home', {
    method: 'PATCH',
    body: { lat, lng },
  });
}

export interface MeResponse {
  id: string;
  nickname: string;
  icon_url: string | null;
  profile_summary: string | null;
  profile_detail: string | null;
  home_lat: string | null;
  home_lng: string | null;
  recovery_code: string;
}

export function getMe() {
  return apiFetch<MeResponse>('/api/users/me');
}

export type Stage = 'Lv0' | 'Lv1' | 'Lv2' | 'Lv3';

export interface PartnerCard {
  id: string;
  stage: Stage;
  nickname?: string;
  nicknameInitial?: string;
  iconUrl?: string | null;
  iconUrlBlurred?: string | null;
  profileSummary?: string | null;
  profileDetail?: string | null;
  profileExtras?: ProfileExtras | null;
}

export interface AgreementState {
  myAgreedAt: string | null;
  partnerAgreedAt: string | null;
  unlockedAt: string | null;
  expiredAt: string | null;
}

export type SubmarineLevel = 1 | 2 | 3 | 4 | 5;

export interface SubmarineState {
  level: SubmarineLevel;
  imageUrl: string;
}

export interface EncounterCard {
  encounterId: string;
  count: number;
  lastEncounteredAt: string;
  partner: PartnerCard;
  submarine: SubmarineState;
  agreement: AgreementState;
}

export function getEncounters() {
  return apiFetch<{ encounters: EncounterCard[] }>('/api/encounters');
}

export interface AgreePayload {
  encounterId: string;
  agreementId: string;
  userAAgreedAt: string | null;
  userBAgreedAt: string | null;
  unlockedAt: string | null;
}

export function agreeOnEncounter(encounterId: string) {
  return apiFetch<AgreePayload>(`/api/agreements/${encounterId}/agree`, {
    method: 'POST',
    body: {},
  });
}

export function silentReject(rejectedId: string) {
  return apiFetch<{ ok: true }>('/api/silent-rejects', {
    method: 'POST',
    body: { rejectedId },
  });
}

export const apiBaseUrl = BASE;
