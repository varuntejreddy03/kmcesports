const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const teamsToFind = [
  'ECE-EAGLES', 'VIRATIAN', 'VICTORY VIPERS', 'Team transformers',
  'Strike seekers', 'WICKET WARRIORS 🐯', 'ELITE EAGLES ECE', 'Rising warriors',
  'STRIKE FORCE CSE', 'ROYAL BLASTERS', 'Suryaveer sena', 'SPARTHAN LIONS'
];

async function run() {
  const { data, error } = await supabase.from('teams').select('id, name').in('name', teamsToFind);
  if (error) {
    console.error('Error fetching teams:', error);
    process.exit(1);
  }
  data.forEach(t => console.log(`${t.name} === ${t.id}`));
}

run();
