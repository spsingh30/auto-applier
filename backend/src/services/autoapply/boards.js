// Verified no-login / no-captcha boards.
// Source: career_links verified list + verified-companies.md (2026-06-30).
// Sirf ye slugs ke JSON APIs hit karte hain.
// chime & gemini Greenhouse pe anti-bot hain BROWSER ke liye — discovery API theek chalti hai,
// par fill-phase me inhe skip karna (note ANTI_BOT me).

const BOARDS = {
  greenhouse: [
    'affirm', 'airbnb', 'airtable', 'algolia', 'amplitude', 'anthropic',
    'asana', 'brex', 'butcherbox', 'calendly', 'chime', 'circleci',
    'cloudflare', 'cockroachlabs', 'coinbase', 'databricks', 'datadog', 'discord',
    'dropbox', 'elastic', 'figma', 'flexport', 'gemini', 'gitlab',
    'gusto', 'instacart', 'mixpanel', 'mongodb', 'pagerduty', 'peloton',
    'pinterest', 'postman', 'reddit', 'robinhood', 'roblox', 'samsara',
    'scaleai', 'sigmacomputing', 'sofi', 'squarespace', 'stripe', 'toast',
    'twilio', 'twitch', 'vercel', 'verkada', 'webflow', 'betterment',
    'marqeta', 'ripple', 'consensys', 'duolingo', 'sumologic', 'grafanalabs',
    'tanium', 'netlify', 'planetscale', 'fivetran', 'hightouch', 'clickhouse',
    'starburst', 'dremio', 'imply', 'yugabyte', 'dbtlabsinc', 'lattice',
    'cultureamp', 'okta', 'fastly', 'snorkelai', 'udemy', 'classpass',
    'adyen', 'oscar', 'found', 'modernhealth', 'coalition', 'huntress',
    'synack', 'bugcrowd', 'tailscale', 'gocardless', 'sumup', 'pleo',
    'contentful', 'celonis', 'pendo', 'instabase', 'dataiku', 'bitpanda',
    'creditkarma', 'attentive', 'getyourguide', 'cribl', 'fireworksai', 'gongio',
    'groww', 'justworks', 'monzo', 'onetrust', 'orca', 'oura',
    'poshmark', 'renttherunway', 'salesloft', 'stockx', 'tide', 'tines',
    'truelayer', 'lyft', 'purestorage', 'canonical', 'phonepe', 'coursera',
    // --- added from verified-companies.md (verified 2026-06-30, +40) ---
    'calm', 'masterclass', 'thenewyorktimes', 'medium', 'wikimedia', 'mozilla',
    'hubspot', 'intercom', 'apolloio', 'iterable', 'customerio', 'pandadoc',
    'remotecom', 'brave', 'dashlane', 'proton', 'carta', 'mercari',
    'brilliantearth', 'olipop', 'tripadvisor', 'bird', 'project44', 'truepill',
    'mavenclinic', 'komodohealth', 'tia', 'recursionpharmaceuticals', 'billiontoone', 'isomorphiclabs',
    'astranis', 'graphcore', 'pacaso', 'roofstock', 'homelight', 'knock',
    'rocketlawyer', 'hudl', 'outschool', 'newsela',
  ],
  ashby: [
    'baseten', 'clerk', 'decagon', 'deel', 'elevenlabs', 'gamma',
    'langchain', 'linear', 'mercury', 'modal', 'pinecone', 'ramp',
    'resend', 'supabase', 'vanta', 'watershed', 'zip', 'openai',
    'notion', 'plaid', 'loom', 'character', 'harvey', 'sierra',
    'writer', 'assembly', 'airbyte', 'lovable', 'vapi', 'browserbase',
    'mintlify', 'warp', 'railway', 'suno', 'photoroom', 'perplexity',
    'cohere', 'physicalintelligence', 'krea', 'hedra', 'pika', 'cognition',
    'mercor', 'abridge', 'cartesia', 'commure', 'continue', 'genmo',
    'greptile', 'ideogram', 'inngest', 'knock', 'langfuse', 'middesk',
    'openevidence', 'opusclip', 'poolside', 'recraft', 'reflectionai', 'rogo',
    'saronic', 'sesame', 'standardbots', 'stytch', 'workos',
    // --- added from verified-companies.md (verified 2026-06-30, +12) ---
    'motherduck', 'sweep', 'clickhouse', 'neon', 'render', 'hightouch',
    'attio', 'commonroom', 'plain', 'matter-labs', 'levels', 'heirloomcarbon',
  ],
  workable: [
    'hotjar', 'remote', 'veriff', 'bolt', 'causaly', 'blueground',
    'typeform', 'docplanner', 'automattic', 'printful', 'wallbox', 'factorial',
    'jobandtalent', 'qonto', 'tier', 'bird', 'choco', 'gorillas',
    'revolut', 'scalable', 'aircall', 'alan', 'ankorstore', 'backmarket',
    'contentsquare', 'deliveryhero', 'flink', 'glovo', 'ledger', 'lydia',
    'mirakl', 'n26', 'payhawk', 'sorare', 'sumup2', 'vinted',
    'wolt',
    // --- added from verified-companies.md (verified 2026-06-30, +1) ---
    'huggingface',
  ],
  lever: [
    'spotify', 'voleon', 'palantir', 'metabase', 'shieldai', 'alloy',
    'cred',
    // --- added from verified-companies.md (verified 2026-06-30, +7) ---
    'mistral', 'qonto', 'offchainlabs', 'charmindustrial', 'dreamsports', 'voodoo',
    'meesho',
  ],
  smartrecruiters: [
    'Visa', 'BoschGroup', 'AveryDennison', 'PublicStorage', 'Ubisoft2', 'McDonalds',
    'Skechers', 'SquareEnix', 'TwoSigma', 'Biocon', 'Accor', 'LVMH',
    'Block', 'Atlassian', 'IKEA', 'BNPParibas',
  ],
};

// Browser fill-phase me skip (discovery API theek hai, par headless block karta hai).
const ANTI_BOT = new Set(['greenhouse:chime', 'greenhouse:gemini']);

module.exports = { BOARDS, ANTI_BOT };
