export type Stage = 'Lv0' | 'Lv1' | 'Lv2' | 'Lv3';

export interface StageInput {
  count: number;
  unlocked: boolean;
}

export function calcStage({ count, unlocked }: StageInput): Stage {
  if (unlocked) return 'Lv3';
  if (count >= 3) return 'Lv2';
  if (count >= 2) return 'Lv1';
  return 'Lv0';
}

export type SubmarineLevel = 1 | 2 | 3 | 4 | 5;

export function evalSubmarineLevel(count: number): SubmarineLevel {
  if (count >= 5) return 5;
  if (count >= 4) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  return 1;
}

export function submarineImageUrl(level: SubmarineLevel): string {
  return `/submarine/level${level}.png`;
}

export interface ProfileExtras {
  ageRange?: string;
  relationshipIntent?: string;
  chronotype?: string;
  hobbies?: string[];
  question1?: string;
  question2?: string;
}

export interface UserPublic {
  id: string;
  nickname: string;
  iconUrl: string | null;
  profileSummary: string | null;
  profileDetail: string | null;
  profileExtras: ProfileExtras | null;
}

function publicExtras(e: ProfileExtras | null) {
  if (!e) return null;
  return {
    ageRange: e.ageRange,
    relationshipIntent: e.relationshipIntent,
    chronotype: e.chronotype,
    hobbies: e.hobbies,
  };
}

function fullExtras(e: ProfileExtras | null) {
  if (!e) return null;
  return e;
}

export function filterByStage(stage: Stage, user: UserPublic) {
  switch (stage) {
    case 'Lv0':
      return { id: user.id, stage };
    case 'Lv1':
      return {
        id: user.id,
        stage,
        nicknameInitial: user.nickname.slice(0, 1),
        iconUrlBlurred: user.iconUrl,
      };
    case 'Lv2':
      return {
        id: user.id,
        stage,
        nickname: user.nickname,
        iconUrl: user.iconUrl,
        profileSummary: user.profileSummary,
        profileExtras: publicExtras(user.profileExtras),
      };
    case 'Lv3':
      return {
        id: user.id,
        stage,
        nickname: user.nickname,
        iconUrl: user.iconUrl,
        profileSummary: user.profileSummary,
        profileDetail: user.profileDetail,
        profileExtras: fullExtras(user.profileExtras),
      };
  }
}
