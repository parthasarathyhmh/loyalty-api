export interface RulePreview {
  id: number;
  name: string;
  value: number;
}

export class Preview {
  total: number;
  standard: number;
  rules: RulePreview[];
}
