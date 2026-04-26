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

export interface UserPublic {
  id: string;
  nickname: string;
  iconUrl: string | null;
  profileSummary: string | null;
  profileDetail: string | null;
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
      };
    case 'Lv3':
      return {
        id: user.id,
        stage,
        nickname: user.nickname,
        iconUrl: user.iconUrl,
        profileSummary: user.profileSummary,
        profileDetail: user.profileDetail,
      };
  }
}
