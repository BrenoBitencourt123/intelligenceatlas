export interface EnemContentFormat {
  color?: 'default' | 'muted';
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface EnemContentBlock {
  type: 'text' | 'image' | 'table' | 'citation';
  value?: string;
  data?: string;
  caption?: string;
  format?: EnemContentFormat;
  headers?: string[];
  rows?: string[][];
}

export interface EnemAlternative {
  text: string;
  image?: string | null;
}

export interface EnemQuestion {
  exam: string;
  number: string | number;
  content: EnemContentBlock[];
  command: string;
  alternatives: EnemAlternative[];
}
