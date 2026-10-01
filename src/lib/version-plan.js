const FEATURE_SUGGESTIONS = {
  Web: [
    'Account sign-up and sign-in flow', 'Responsive core screens', 'Create and edit the primary content',
    'Form validation and helpful errors', 'REST API integration', 'Persistent database storage',
    'Empty and loading states', 'Basic search or filtering', 'Accessibility review', 'Deployment configuration',
  ],
  Mobile: [
    'Cross-platform navigation', 'Onboarding flow', 'Create and edit the primary content',
    'Offline local storage', 'Push-notification foundation', 'Responsive mobile layouts',
    'Error and loading states', 'Search or filtering', 'Accessibility review', 'Store-release checklist',
  ],
  'AI/ML': [
    'Project input form', 'Structured prompt template', 'AI request integration',
    'Validated structured response', 'Loading and failure states', 'Result history storage',
    'Prompt settings', 'Result filtering', 'Privacy review', 'Deployment configuration',
  ],
  CLI: [
    'Command and help interface', 'Argument validation', 'Core command workflow',
    'Configuration-file support', 'Clear terminal output', 'Actionable error messages',
    'Persistent local data', 'Interactive confirmation prompts', 'Documentation', 'Package-release setup',
  ],
  Game: [
    'Playable game loop', 'Player controls', 'Core game rules',
    'Score and state tracking', 'Restart flow', 'Responsive game layout',
    'Difficulty or level settings', 'Sound and animation hooks', 'Playtesting pass', 'Deployment configuration',
  ],
  API: [
    'Core resource endpoints', 'Request validation', 'Consistent error responses',
    'Database persistence', 'Authentication foundation', 'Rate-limit foundation',
    'API documentation', 'Filtering and pagination', 'Automated tests', 'Deployment configuration',
  ],
  Data: [
    'Data import workflow', 'Input validation', 'Data cleaning pipeline',
    'Initial visualizations', 'Summary metrics', 'Filtering controls',
    'Export workflow', 'Saved analysis state', 'Accessibility review', 'Deployment configuration',
  ],
  DevOps: [
    'Project configuration', 'Containerized local environment', 'Core automation script',
    'Structured logging', 'Health checks', 'Error notifications',
    'CI workflow', 'Environment documentation', 'Security review', 'Deployment runbook',
  ],
  Other: [
    'Core user workflow', 'Responsive interface', 'Input validation',
    'Persistent data storage', 'Loading and error states', 'Basic search or filtering',
    'Accessibility review', 'User documentation', 'Testing pass', 'Deployment configuration',
  ],
};

export function getDefaultFeatures(category) {
  return FEATURE_SUGGESTIONS[category] || FEATURE_SUGGESTIONS.Other;
}

export function getInitialVersionPlan(category) {
  const features = getDefaultFeatures(category);

  return [
    {
      label: 'v0.1',
      summary: 'Foundation',
      features: features.slice(0, 8),
      notes: 'Set up the smallest usable release and validate the core workflow.',
    },
    {
      label: 'v0.2',
      summary: 'Core workflow',
      features: features.slice(8, 10),
      notes: 'Refine the primary experience after the foundation is complete.',
    },
    {
      label: 'v0.3',
      summary: 'Launch ready',
      features: ['Final quality assurance', 'Release and handoff checklist'],
      notes: 'Prepare the finished project for release.',
    },
  ];
}

export function parseFeatureRecords(features, featureMeta) {
  const legacyFeatures = String(features || '')
    .split('\n')
    .map((feature) => feature.trim())
    .filter(Boolean);

  let metadata = [];
  try {
    const parsed = typeof featureMeta === 'string' ? JSON.parse(featureMeta || '[]') : featureMeta;
    metadata = Array.isArray(parsed) ? parsed : [];
  } catch {
    metadata = [];
  }

  if (metadata.length > 0) {
    return metadata.map((record, index) => ({
      id: record?.id || `legacy-feature-${index}`,
      text: String(record?.text || '').replace(/^✓\s*/, ''),
      source: record?.source || 'legacy',
      accepted: record?.accepted ?? true,
      edited: Boolean(record?.edited),
      completed: Boolean(record?.completed) || String(record?.text || '').startsWith('✓ '),
      originalText: record?.originalText || null,
    })).filter((record) => record.text);
  }

  return legacyFeatures.map((feature, index) => ({
    id: `legacy-feature-${index}-${feature}`,
    text: feature.replace(/^✓\s*/, ''),
    source: 'legacy',
    accepted: true,
    edited: false,
    completed: feature.startsWith('✓ '),
    originalText: null,
  }));
}

export function parseFeatureHistory(featureHistory) {
  try {
    const parsed = typeof featureHistory === 'string' ? JSON.parse(featureHistory || '[]') : featureHistory;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
