export const IDEAS_PER_PAGE = 5;

// "Task Tracker App!" and "task tracker app" count as the same idea.
export function normalizeTitle(title) {
  return String(title ?? '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUsableIdea(idea) {
  return (
    idea &&
    typeof idea === 'object' &&
    typeof idea.title === 'string' &&
    idea.title.trim() &&
    typeof idea.description === 'string' &&
    idea.description.trim()
  );
}

/**
 * Keeps asking for ideas until `count` brand-new ones are collected.
 *
 * - drops ideas already saved (excludedTitles) or already on screen (existing)
 * - drops duplicates inside the same batch and across batches
 * - drops incomplete ideas (no title / description)
 * - refills when something was dropped, so the page never ends up short
 *
 * fetchBatch({ excludedTitles, count }) must resolve to an array of ideas.
 */
export async function collectUniqueIdeas({
  fetchBatch,
  excludedTitles = [],
  existing = [],
  count = IDEAS_PER_PAGE,
  maxAttempts = 6,
}) {
  const seen = new Set();
  const avoidList = [];

  const remember = (title) => {
    const key = normalizeTitle(title);
    if (key && !seen.has(key)) {
      seen.add(key);
      avoidList.push(String(title).trim());
    }
  };

  excludedTitles.forEach(remember);
  existing.forEach((idea) => remember(idea?.title));

  const collected = [];
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts && collected.length < count; attempt++) {
    let batch;
    try {
      // Ask for a few extra so filtering still leaves enough.
      batch = await fetchBatch({
        excludedTitles: [...avoidList],
        count: count - collected.length + 3,
      });
    } catch (error) {
      lastError = error;
      continue;
    }

    for (const idea of Array.isArray(batch) ? batch : []) {
      if (!isUsableIdea(idea)) continue;
      const key = normalizeTitle(idea.title);
      if (!key || seen.has(key)) continue;

      remember(idea.title);
      collected.push({
        ...idea,
        id: idea.id ?? `idea-${key.replace(/\s+/g, '-')}`,
      });
      if (collected.length === count) break;
    }
  }

  if (collected.length === 0 && lastError) throw lastError;
  return collected;
}
