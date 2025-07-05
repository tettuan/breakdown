#!/bin/bash

# Kill Node Panes Script
# 
# This script safely terminates all node processes running in tmux panes
# 
# Usage:
#   ./scripts/kill_node_panes.sh          # Safe termination (default)
#   ./scripts/kill_node_panes.sh --force  # Force kill with SIGKILL
#   bash scripts/kill_node_panes.sh
#   
# What it does:
#   1. Finds all tmux panes running node commands
#   2. Gets the PID of each node process
#   3. Safely terminates processes using graceful shutdown sequence:
#      - First: SIGTERM (15) - allows graceful shutdown
#      - Wait: 5 seconds for process to terminate
#      - Then: SIGKILL (9) - force kill if still running

echo "=== Safely Terminating Node Processes in tmux Panes ==="

# Check command line arguments
FORCE_MODE=false
if [ "$1" = "--force" ] || [ "$1" = "-f" ]; then
    FORCE_MODE=true
    echo "⚠️  FORCE MODE: Using immediate SIGKILL"
fi

# Check if tmux is running
if ! tmux list-sessions &>/dev/null; then
    echo "Error: No tmux sessions found or tmux is not running"
    exit 1
fi

# Counter for terminated processes
terminated_count=0

# Function to safely terminate a process
safe_terminate() {
    local pid=$1
    local pane=$2
    
    # Check if process is still running
    if ! kill -0 "$pid" 2>/dev/null; then
        echo "  ℹ️  Process $pid is already terminated"
        return 1
    fi
    
    # Force mode: immediate SIGKILL
    if [ "$FORCE_MODE" = true ]; then
        echo "  💥 Force killing PID $pid..."
        if kill -KILL "$pid" 2>/dev/null; then
            echo "  ✓ Process $pid force-killed"
            return 0
        else
            echo "  ✗ Failed to kill PID $pid"
            return 1
        fi
    fi
    
    # Safe mode: SIGTERM first, then SIGKILL if needed
    echo "  📤 Sending SIGTERM to PID $pid (graceful shutdown)..."
    if kill -TERM "$pid" 2>/dev/null; then
        # Wait up to 5 seconds for graceful shutdown
        local count=0
        while [ $count -lt 5 ]; do
            if ! kill -0 "$pid" 2>/dev/null; then
                echo "  ✓ Process $pid terminated gracefully"
                return 0
            fi
            sleep 1
            ((count++))
            echo "  ⏳ Waiting for graceful shutdown... ($count/5)"
        done
        
        # If still running after 5 seconds, force kill
        echo "  ⚠️  Process $pid didn't respond to SIGTERM, using SIGKILL..."
        if kill -KILL "$pid" 2>/dev/null; then
            echo "  ✓ Process $pid force-killed"
            return 0
        else
            echo "  ✗ Failed to kill PID $pid"
            return 1
        fi
    else
        echo "  ✗ Failed to send SIGTERM to PID $pid"
        return 1
    fi
}

# Find and safely terminate node processes in tmux panes
for pane in $(tmux list-panes -a -F "#{pane_id} #{pane_current_command}" | awk '$2 == "node" {print $1}'); do
    pid=$(tmux display-message -p -t "$pane" "#{pane_pid}")
    echo "Terminating node in $pane (PID: $pid)"
    
    if safe_terminate "$pid" "$pane"; then
        ((terminated_count++))
    fi
    echo ""
done

if [ $terminated_count -eq 0 ]; then
    echo "No node processes found in tmux panes"
else
    echo "=== Summary: Safely terminated $terminated_count node process(es) ==="
fi
