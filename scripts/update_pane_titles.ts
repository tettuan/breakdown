#!/usr/bin/env -S deno run --allow-run --allow-env

/**
 * Update tmux pane titles with script type and status
 * Format: Script(Node/Other) + Status(IDLE/WORKING/BLOCKED/DONE/TERMINATED/UNKNOWN)
 */

interface PaneInfo {
  paneId: string;
  paneIndex: string;
  command: string;
  pid: string;
}

interface ProcessInfo {
  scriptType: "Node" | "Other";
  status: "IDLE" | "WORKING" | "BLOCKED" | "DONE" | "TERMINATED" | "UNKNOWN";
}

async function runCommand(cmd: string[]): Promise<string> {
  try {
    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: "piped",
      stderr: "piped",
    });
    
    const { stdout } = await process.output();
    return new TextDecoder().decode(stdout).trim();
  } catch {
    return "";
  }
}

async function getPaneList(): Promise<PaneInfo[]> {
  const output = await runCommand([
    "tmux",
    "list-panes",
    "-a",
    "-F",
    "#{pane_id}|#{pane_index}|#{pane_current_command}|#{pane_pid}"
  ]);
  
  return output.split('\n').filter(line => line).map(line => {
    const [paneId, paneIndex, command, pid] = line.split('|');
    return { paneId, paneIndex, command, pid };
  });
}

async function getProcessInfo(pane: PaneInfo): Promise<ProcessInfo> {
  try {
    // Get pane content to determine what's running
    const paneContent = await runCommand([
      "tmux",
      "capture-pane",
      "-t",
      pane.paneId,
      "-p",
      "-S",
      "-10"
    ]);
    
    const content = paneContent.toLowerCase();
    
    // Determine script type (Node or Other)
    let scriptType: "Node" | "Other" = "Other";
    
    // Check for Node.js related content
    if (content.includes("node") || content.includes("npm") || content.includes("deno") || 
        content.includes("yarn") || content.includes("npx") || content.includes("typescript") ||
        pane.command.includes("node") || pane.command.includes("deno")) {
      scriptType = "Node";
    }
    
    // Determine status based on content indicators
    let status: "IDLE" | "WORKING" | "BLOCKED" | "DONE" | "TERMINATED" | "UNKNOWN" = "UNKNOWN";
    
    // WORKING indicators
    if (content.includes("✳") || content.includes("✶") || content.includes("✽") ||
        content.includes("✢") || content.includes("·") || content.includes("⏺") ||
        content.includes("tokens") || content.includes("esc to interrupt") ||
        content.includes("importing") || content.includes("processing") ||
        content.includes("analyzing") || content.includes("investigating") ||
        content.includes("creating") || content.includes("writing") ||
        content.includes("reading") || content.includes("searching")) {
      status = "WORKING";
    }
    // BLOCKED indicators  
    else if (content.includes("╭─") && content.includes("╰─")) {
      status = "BLOCKED"; // Waiting for input
    }
    // DONE indicators
    else if (content.includes("completed") || content.includes("done") || 
             content.includes("finished") || content.includes("success") ||
             content.includes("✓") || content.includes("passed")) {
      status = "DONE";
    }
    // TERMINATED indicators
    else if (content.includes("terminated") || content.includes("exited") ||
             content.includes("killed") || content.includes("stopped")) {
      status = "TERMINATED";
    }
    // IDLE indicators
    else if (content.includes("human:") || content.includes("assistant:") ||
             content.includes("awaiting") || content.length < 30) {
      status = "IDLE";
    }
    
    return { scriptType, status };
  } catch (error) {
    return { scriptType: "Other", status: "UNKNOWN" };
  }
}

async function updatePaneTitle(paneId: string, title: string): Promise<void> {
  await runCommand([
    "tmux",
    "select-pane",
    "-t",
    paneId,
    "-T",
    title
  ]);
}

async function main() {
  const panes = await getPaneList();
  
  for (const pane of panes) {
    const processInfo = await getProcessInfo(pane);
    const title = `Script(${processInfo.scriptType}) + Status(${processInfo.status})`;
    
    await updatePaneTitle(pane.paneId, title);
    console.log(`Updated pane ${pane.paneIndex} (${pane.paneId}): ${title}`);
  }
}

// Run the update
await main();