export interface BirthdayConfig {
  recipientName: string;
  birthDatePassword: string; // e.g. "1611" or "16/11"
  birthDateDisplay: string;  // e.g. "16/11"
  defaultWishes: string[];
  flowerMessage: string;
  songTitle: string;
  songArtist: string;
  letterContent: string[];
  senderName: string;
}

export type SceneState = 'LOCK' | 'CELEBRATION' | 'GIFTS' | 'WISH' | 'FINALE';
