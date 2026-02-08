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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const matchesToInsert = [
  { team_a: '23958164-1ead-4353-82ba-6f7cd26a677a', team_b: 'e8120933-4fd5-424a-91f4-63479df58733', num: 1 }, // Team transformers VS VICTORY VIPERS
  { team_a: 'ca53ad07-aa81-4547-9ded-78c48ca16af2', team_b: 'd21d84a8-e3eb-4505-a068-0849fa0b9efe', num: 2 }, // WICKET WARRIORS 🐯 VS ELITE EAGLES ECE
  { team_a: '271112eb-4890-4771-b70b-3afce6f37461', team_b: '6eb482d9-ba00-4622-8c51-6b44fa9ec727', num: 3 }, // ROYAL BLASTERS VS Aiml warriors
  { team_a: '8cea03b5-d80f-42d2-af40-f077bf8d2f9f', team_b: '4c4f455b-7520-4d1c-bf82-8bf9b745c748', num: 4 }, // Strike seekers VS Super kings
  { team_a: 'b9f206ad-262c-4881-aef9-cdfb0fdf8f54', team_b: '80495e85-e153-4e37-95d3-881d5f815924', num: 5 }, // ECE-EAGLES VS SPARTHAN LIONS
  { team_a: 'da3fa34d-127f-466c-9c74-a276338cae0d', team_b: '153d7dfb-cf86-4549-bb50-6801692e0b9d', num: 6 }  // Suryaveer sena VS STRIKE FORCE CSE
];

async function run() {
  console.log('Deleting existing matches...');
  const { error: delError } = await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) {
    console.error('Error deleting matches:', delError);
    return;
  }

  const inserts = matchesToInsert.map(m => ({
    team_a_id: m.team_a,
    team_b_id: m.team_b,
    match_number: m.num,
    round: 1,
    status: 'scheduled',
    venue: 'Main Ground',
    match_date: new Date().toISOString().split('T')[0],
    match_time: '09:00'
  }));

  console.log('Inserting new matches...');
  const { data, error } = await supabase.from('matches').insert(inserts);
  if (error) {
    console.error('Error inserting matches:', error);
    process.exit(1);
  }
  console.log('Successfully inserted 6 matches.');
}

run();
