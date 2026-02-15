export const AUTO_FORWARDING_FIELDS = [
  "domain",
  "url",
  "title",
  "description",
  "contentType",
] as const;

export const AUTO_FORWARDING_OPERATORS = ["contains", "equals"] as const;

export const AUTO_FORWARDING_JOIN_OPERATORS = ["AND", "OR"] as const;

export type AutoForwardingField = typeof AUTO_FORWARDING_FIELDS[number];
export type AutoForwardingOperator = typeof AUTO_FORWARDING_OPERATORS[number];
export type AutoForwardingJoinOperator = typeof AUTO_FORWARDING_JOIN_OPERATORS[number];

export interface AutoForwardingCondition {
  id: string;
  targetSpaceId: string;
  field: AutoForwardingField;
  operator: AutoForwardingOperator;
  value: string;
  join: AutoForwardingJoinOperator;
}

export interface AutoForwardingSettings {
  enabled: boolean;
  conditions: AutoForwardingCondition[];
}
