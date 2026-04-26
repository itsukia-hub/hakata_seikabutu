import { getUserId } from './session';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8787';

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
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface CreateUserInput {
  nickname: string;
  iconUrl?: string | null;
  profileSummary?: string | null;
  profileDetail?: string | null;
}

export function createUser(input: CreateUserInput) {
  return apiFetch<{ id: string; nickname: string; created_at: string }>('/api/users', {
    method: 'POST',
    body: input,
    authed: false,
  });
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
}

export interface AgreementState {
  myAgreedAt: string | null;
  partnerAgreedAt: string | null;
  unlockedAt: string | null;
  expiredAt: string | null;
}

export interface EncounterCard {
  encounterId: string;
  count: number;
  lastEncounteredAt: string;
  partner: PartnerCard;
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
