// Keys must match getEntryKind() in buildEntries.js.
// `kind` is a stable identifier used for data-testids (e.g. timeline-badge-pre).
// Labels are translated by consumers using t().
export const ENTRY_KINDS = {
  main: { kind: 'main', labelKey: 'REQUEST', badgeKey: 'BADGE_REQUEST', badgeClass: 'tl-badge tl-badge--main' },
  oauth: { kind: 'oauth', labelKey: 'OAUTH', badgeKey: 'BADGE_OAUTH', badgeClass: 'tl-badge tl-badge--oauth2' },
  pre: { kind: 'pre', labelKey: 'PRE_REQUEST', badgeKey: 'BADGE_SEND_REQUEST', badgeClass: 'tl-badge tl-badge--scripted' },
  post: { kind: 'post', labelKey: 'POST_RESPONSE', badgeKey: 'BADGE_RUN_REQUEST', badgeClass: 'tl-badge tl-badge--run-request' }
};

export const FILTER_CHIPS = [
  { id: 'all', labelKey: 'ALL' },
  { id: 'main', labelKey: 'REQUEST' },
  { id: 'pre', labelKey: 'PRE_REQUEST' },
  { id: 'post', labelKey: 'POST_RESPONSE' },
  { id: 'oauth', labelKey: 'OAUTH' }
];

export const getBadge = ({ source, isOauth2 }) => {
  if (isOauth2) return ENTRY_KINDS.oauth;
  if (!source || source === 'main') return ENTRY_KINDS.main;
  if (source === 'runRequest') return ENTRY_KINDS.post;
  return ENTRY_KINDS.pre;
};
