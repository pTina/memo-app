const drafts = new Set<string>();

export function markDraft(id: string) {
  drafts.add(id);
}

export function isDraft(id: string) {
  return drafts.has(id);
}

export function clearDraft(id: string) {
  drafts.delete(id);
}