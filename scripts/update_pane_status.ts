#!/usr/bin/env deno run --allow-run

type StatusKey = 'IDLE' | 'WORKING' | 'BLOCKED' | 'DONE' | 'TERMINATED' | 'UNKNOWN';

async function getCurrentPaneInfo(): Promise<{command: string, pid: string}> {
  const cmd = new Deno.Command("bash", {
    args: ["-c", "tmux display -p '#{pane_current_command}|#{pane_pid}'"],
    stdout: "piped"
  });
  
  const result = await cmd.output();
  const output = new TextDecoder().decode(result.stdout).trim();
  const [command, pid] = output.split('|');
  
  return { command, pid };
}

function isNodeCommand(command: string): boolean {
  if (!command) return false;
  
  const nodePatterns = [
    'node', 'deno', 'bun', 'npm', 'yarn', 'pnpm', 'npx',
    'tsc', 'typescript', 'ts-node', 'jest', 'vitest', 'mocha',
    'webpack', 'vite', 'rollup', 'next', 'nuxt'
  ];
  
  const cmd = command.toLowerCase();
  return nodePatterns.some(pattern => 
    cmd === pattern || cmd.includes(pattern) || cmd.includes(`/${pattern}`)
  );
}

function determineStatus(command: string, pid: string): StatusKey {
  if (!pid || pid === '0' || !command) return 'TERMINATED';
  
  const shells = ['zsh', 'bash', 'sh', 'fish'];
  if (shells.includes(command)) return 'IDLE';
  
  const activeTools = ['claude', 'cld', 'vim', 'nvim', 'code'];
  if (activeTools.some(tool => command.includes(tool))) return 'WORKING';
  
  if (isNodeCommand(command)) return 'WORKING';
  if (command.includes('git')) return 'WORKING';
  
  return 'WORKING';
}

async function updatePaneTitle(scriptType: string, status: StatusKey): Promise<void> {
  const newTitle = `Script(${scriptType}) + Status(${status})`;
  const cmd = new Deno.Command("tmux", {
    args: ["rename-pane", newTitle]
  });
  
  await cmd.output();
  console.log(`Updated title: ${newTitle}`);
}

async function main() {
  const paneInfo = await getCurrentPaneInfo();
  const scriptType = isNodeCommand(paneInfo.command) ? 'Node' : 'Other';
  const status = determineStatus(paneInfo.command, paneInfo.pid);
  
  console.log(`Command: ${paneInfo.command}`);
  console.log(`Script Type: ${scriptType}`);
  console.log(`Status: ${status}`);
  
  await updatePaneTitle(scriptType, status);
}

if (import.meta.main) {
  await main();
}