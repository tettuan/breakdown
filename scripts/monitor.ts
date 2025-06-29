#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * tmux pane monitor script with worker status detection
 * Displays tmux pane list with worker status every 10 seconds until interrupted by key press
 * Automatically sends status update commands to UNKNOWN status panes
 */

type WorkerStatus = 'IDLE' | 'WORKING' | 'BLOCKED' | 'DONE' | 'TERMINATED' | 'UNKNOWN';

interface PaneInfo {
  sessionWindow: string;
  paneId: string;
  isActive: boolean;
  command: string;
  title: string;
  status: WorkerStatus;
  managerPaneId?: string;
  timestamp?: string;
}

/**
 * pane_title からワーカーゴルーチンのステータスを判定
 */
function detectWorkerStatus(paneTitle: string): { status: WorkerStatus; managerPaneId?: string; timestamp?: string } {
  // ターミナルタイトルのパターンマッチング
  // 形式: [状態→mgr\[\マネージャーのpane_id\] MM/dd HH:mm]
  const titlePattern = /\[(\w+)→mgr\[(\d+)\]\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})\]/;
  const match = paneTitle.match(titlePattern);

  if (match) {
    const [, statusStr, managerPaneId, timestamp] = match;
    
    // ステータス文字列を WorkerStatus にマッピング
    let status: WorkerStatus = 'UNKNOWN';
    switch (statusStr.toUpperCase()) {
      case 'IDLE':
        status = 'IDLE';
        break;
      case 'WORKING':
        status = 'WORKING';
        break;
      case 'BLOCKED':
        status = 'BLOCKED';
        break;
      case 'DONE':
        status = 'DONE';
        break;
      case 'TERMINATED':
        status = 'TERMINATED';
        break;
    }
    
    return { status, managerPaneId, timestamp };
  } else {
    // パターンにマッチしない場合、部分的なマッチングを試行
    const partialMatches = [
      { pattern: /IDLE/i, status: 'IDLE' as WorkerStatus },
      { pattern: /WORKING/i, status: 'WORKING' as WorkerStatus },
      { pattern: /BLOCKED/i, status: 'BLOCKED' as WorkerStatus },
      { pattern: /DONE/i, status: 'DONE' as WorkerStatus },
      { pattern: /TERMINATED/i, status: 'TERMINATED' as WorkerStatus }
    ];

    for (const { pattern, status } of partialMatches) {
      if (pattern.test(paneTitle)) {
        return { status };
      }
    }
  }

  return { status: 'UNKNOWN' };
}

/**
 * ステータス別に色分けして表示
 */
function getStatusColor(status: WorkerStatus): string {
  switch (status) {
    case 'IDLE': return '\x1b[36m';      // cyan
    case 'WORKING': return '\x1b[33m';   // yellow
    case 'BLOCKED': return '\x1b[31m';   // red
    case 'DONE': return '\x1b[32m';      // green
    case 'TERMINATED': return '\x1b[35m'; // magenta
    case 'UNKNOWN': return '\x1b[37m';   // white
    default: return '\x1b[0m';           // reset
  }
}

const RESET_COLOR = '\x1b[0m';

let isRunning = true;

// Setup signal handlers for graceful exit
Deno.addSignalListener("SIGINT", () => {
  console.log("\n\nMonitoring stopped by user (Ctrl+C)");
  isRunning = false;
});

// Setup stdin to detect key press
if (Deno.stdin.isTerminal()) {
  Deno.stdin.setRaw(true);
  
  // Start listening for key press in background
  (async () => {
    const buffer = new Uint8Array(1);
    while (isRunning) {
      try {
        const bytesRead = await Deno.stdin.read(buffer);
        if (bytesRead && isRunning) {
          console.log("\n\nMonitoring stopped by key press");
          isRunning = false;
          break;
        }
      } catch (error) {
        if (error instanceof Deno.errors.Interrupted) {
          break;
        }
      }
    }
  })();
}

async function listTmuxPanes(autoUpdate: boolean = false, targetStatus: WorkerStatus = 'IDLE'): Promise<void> {
  try {
    const cmd = new Deno.Command("tmux", {
      args: [
        "list-panes",
        "-a",
        "-F",
        "#{session_name}:#{window_index}.#{pane_index}|#{pane_id}|#{pane_active}|#{pane_current_command}|#{pane_title}"
      ],
      stdout: "piped",
      stderr: "piped"
    });

    const output = await cmd.output();
    
    if (output.success) {
      const result = new TextDecoder().decode(output.stdout);
      
      // Clear screen and move cursor to top
      console.clear();
      console.log("=== tmux Panes Monitor with Worker Status ===");
      console.log(`Updated: ${new Date().toLocaleString()}`);
      console.log("Press any key or Ctrl+C to stop\n");
      
      if (result.trim()) {
        const panes: PaneInfo[] = [];
        const lines = result.trim().split('\n');
        
        // Parse each pane line
        for (const line of lines) {
          const parts = line.split('|');
          if (parts.length >= 5) {
            const [sessionWindow, paneId, activeStr, command, title] = parts;
            const statusInfo = detectWorkerStatus(title);
            
            panes.push({
              sessionWindow,
              paneId,
              isActive: activeStr === '1',
              command,
              title,
              status: statusInfo.status,
              managerPaneId: statusInfo.managerPaneId,
              timestamp: statusInfo.timestamp
            });
          }
        }
        
        // Display panes grouped by status
        displayPanesByStatus(panes);
        
        // Send status update commands to UNKNOWN panes (if auto-update is enabled)
        if (autoUpdate) {
          await sendStatusUpdateToUnknownPanes(panes, targetStatus);
        }
        
        // Display detailed pane list
        console.log("\n=== Detailed Pane List ===");
        for (const pane of panes) {
          const activeIndicator = pane.isActive ? '*' : ' ';
          const statusColor = getStatusColor(pane.status);
          const statusDisplay = `${statusColor}${pane.status.padEnd(10)}${RESET_COLOR}`;
          
          let statusDetails = '';
          if (pane.managerPaneId) {
            statusDetails += ` → mgr[${pane.managerPaneId}]`;
          }
          if (pane.timestamp) {
            statusDetails += ` (${pane.timestamp})`;
          }
          
          // タイトルが異なる場合は1行に含める
          let titleInfo = '';
          if (pane.title && pane.title !== pane.command) {
            titleInfo = ` | Title: ${pane.title}`;
          }
          
          console.log(
            `${activeIndicator}${pane.sessionWindow} ${pane.paneId} ${statusDisplay} ${pane.command}${statusDetails}${titleInfo}`
          );
        }
      } else {
        console.log("No tmux panes found");
      }
    } else {
      const error = new TextDecoder().decode(output.stderr);
      console.error("Error executing tmux command:", error);
    }
  } catch (error) {
    console.error("Failed to list tmux panes:", error);
  }
}

/**
 * ステータス別にペインを表示
 */
function displayPanesByStatus(panes: PaneInfo[]): void {
  const statusGroups: Record<WorkerStatus, PaneInfo[]> = {
    IDLE: [],
    WORKING: [],
    BLOCKED: [],
    DONE: [],
    TERMINATED: [],
    UNKNOWN: []
  };
  
  // Group panes by status
  for (const pane of panes) {
    statusGroups[pane.status].push(pane);
  }
  
  console.log("=== Worker Status Summary ===");
  
  for (const [status, statusPanes] of Object.entries(statusGroups)) {
    if (statusPanes.length > 0) {
      const statusColor = getStatusColor(status as WorkerStatus);
      const paneIds = statusPanes.map(p => p.paneId).join(', ');
      console.log(`${statusColor}${status}${RESET_COLOR} (${statusPanes.length}): ${paneIds}`);
    }
  }
}

/**
 * マネージャーペインを特定する
 * マネージャーは通常、他のワーカーから参照されているpaneまたは特定のタイトルパターンを持つ
 */
function findManagerPaneId(panes: PaneInfo[]): string | null {
  // 他のpaneから参照されているマネージャーIDを探す
  const referencedManagers = new Set<string>();
  for (const pane of panes) {
    if (pane.managerPaneId) {
      referencedManagers.add(pane.managerPaneId);
    }
  }
  
  // 最も多く参照されているマネージャーを返す
  if (referencedManagers.size > 0) {
    return Array.from(referencedManagers)[0]; // 最初に見つかったものを返す
  }
  
  // マネージャーらしいタイトルパターンを探す
  const managerPatterns = [
    /manager/i,
    /supervisor/i,
    /head/i,
    /secretary/i
  ];
  
  for (const pane of panes) {
    for (const pattern of managerPatterns) {
      if (pattern.test(pane.title)) {
        return pane.paneId.replace('%', ''); // % を除去
      }
    }
  }
  
  // デフォルトとして最初のペインを返す
  return panes.length > 0 ? panes[0].paneId.replace('%', '') : null;
}

/**
 * UNKNOWNステータスのペインに状態更新コマンドを送信
 */
async function sendStatusUpdateToUnknownPanes(panes: PaneInfo[], targetStatus: WorkerStatus = 'IDLE'): Promise<void> {
  const unknownPanes = panes.filter(pane => pane.status === 'UNKNOWN');
  
  if (unknownPanes.length === 0) {
    return;
  }
  
  const managerPaneId = findManagerPaneId(panes);
  if (!managerPaneId) {
    console.log("⚠️  マネージャーペインが見つかりません");
    return;
  }
  
  console.log(`\n=== Sending Status Update Commands ===`);
  console.log(`Manager Pane ID: ${managerPaneId}`);
  console.log(`UNKNOWN panes: ${unknownPanes.length}`);
  console.log(`Target Status: ${targetStatus}`);
  
  for (const pane of unknownPanes) {
    const paneId = pane.paneId;
    // 状態変更コマンド
    const statusCommand = `echo -ne "\\033]0;[${targetStatus}→mgr[${managerPaneId}] $(date '+%m/%d %H:%M')]\\007"`;
    
    try {
      const cmd = new Deno.Command("tmux", {
        args: [
          "send-keys",
          "-t", paneId,
          statusCommand,
          "Enter"
        ],
        stdout: "piped",
        stderr: "piped"
      });
      
      const output = await cmd.output();
      
      if (output.success) {
        console.log(`✅ ${paneId}: Status update command sent (${targetStatus})`);
      } else {
        const error = new TextDecoder().decode(output.stderr);
        console.log(`❌ ${paneId}: Failed to send command - ${error.trim()}`);
      }
    } catch (error) {
      console.log(`❌ ${paneId}: Error sending command - ${error}`);
    }
    
    // 少し待機して次のコマンドへ
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

function showHelp(): void {
  console.log(`
tmux Pane Monitor with Worker Status Detection

Usage: deno run --allow-run --allow-read scripts/monitor.ts [options]

Options:
  -a, --auto-update     Automatically send status update commands to UNKNOWN panes
  --status=STATUS       Set target status for auto-update (default: IDLE)
                        Valid statuses: IDLE, WORKING, BLOCKED, DONE, TERMINATED
  -h, --help           Show this help message

Examples:
  # Monitor only (no auto-update)
  deno run --allow-run --allow-read scripts/monitor.ts
  
  # Monitor with auto-update to IDLE status
  deno run --allow-run --allow-read scripts/monitor.ts --auto-update
  
  # Monitor with auto-update to WORKING status
  deno run --allow-run --allow-read scripts/monitor.ts -a --status=WORKING

Worker Status Legend:
  IDLE        - 待機中（新しいタスクを即座に受け入れ可能）
  WORKING     - 実行中（タスク処理中、進捗定期報告）
  BLOCKED     - 依存関係待ち（他ワーカーの完了・リソース待ち）
  DONE        - タスク完了（結果報告済み、次タスク待ち）
  TERMINATED  - 終了（コンテキストクリア、リソース解放完了）
  UNKNOWN     - ステータス不明（タイトルパターンにマッチしない）
`);
}

async function main(): Promise<void> {
  // コマンドライン引数の解析
  const args = Deno.args;
  const autoUpdate = args.includes('--auto-update') || args.includes('-a');
  const targetStatus = args.find(arg => arg.startsWith('--status='))?.split('=')[1] as WorkerStatus || 'IDLE';
  
  // Help option
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }
  
  // ステータスの妥当性チェック
  const validStatuses: WorkerStatus[] = ['IDLE', 'WORKING', 'BLOCKED', 'DONE', 'TERMINATED'];
  if (!validStatuses.includes(targetStatus)) {
    console.error(`Error: Invalid status '${targetStatus}'. Valid statuses: ${validStatuses.join(', ')}`);
    return;
  }
  
  console.log("Starting tmux pane monitor...");
  console.log(`Auto-update UNKNOWN panes: ${autoUpdate ? 'Enabled' : 'Disabled'}`);
  if (autoUpdate) {
    console.log(`Target status: ${targetStatus}`);
  }
  console.log("Press any key or Ctrl+C to stop\n");

  // Monitor function with auto-update option
  const monitorWithOptions = async () => {
    await listTmuxPanes(autoUpdate, targetStatus);
  };

  // Initial display
  await monitorWithOptions();

  // Monitor loop
  while (isRunning) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
    
    if (isRunning) {
      await monitorWithOptions();
    }
  }

  // Restore terminal
  if (Deno.stdin.isTerminal()) {
    Deno.stdin.setRaw(false);
  }
  
  console.log("Monitor stopped.");
}

if (import.meta.main) {
  await main();
}
