
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://bcxnmzoinugkhuexdgjx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeG5tem9pbnVna2h1ZXhkZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjk5MDYsImV4cCI6MjA4ODk0NTkwNn0.x-YyMTI-NCI3IKhJCK9SCKh_wW3QoSAdmR0Aj2d7TG4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkTables() {
  console.log("Checking tables...");
  const { data: flows, error: flowsErr } = await supabase.from('flows').select('id').limit(1);
  console.log("flows query:", flowsErr ? "ERROR: " + flowsErr.message : "SUCCESS (flows table exists)");

  const { data: workflows, error: workflowsErr } = await supabase.from('workflows').select('id').limit(1);
  console.log("workflows query:", workflowsErr ? "ERROR: " + workflowsErr.message : "SUCCESS (workflows table exists)");

  const { data: flowSteps, error: flowStepsErr } = await supabase.from('flow_steps').select('id').limit(1);
  console.log("flow_steps query:", flowStepsErr ? "ERROR: " + flowStepsErr.message : "SUCCESS (flow_steps table exists)");

  const { data: workflowSteps, error: workflowStepsErr } = await supabase.from('workflow_steps').select('id').limit(1);
  console.log("workflow_steps query:", workflowStepsErr ? "ERROR: " + workflowStepsErr.message : "SUCCESS (workflow_steps table exists)");
}

checkTables();
