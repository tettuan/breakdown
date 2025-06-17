#!/usr/bin/env -S deno run -A
/**
 * Resource Competition Risk Monitor
 *
 * Purpose:
 * - Monitor shared resource usage during test execution
 * - Detect potential race conditions and conflicts
 * - Provide recommendations for resource optimization
 * - Generate reports on resource utilization patterns
 */

import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

export interface ResourceMetrics {
  /** Timestamp of measurement */
  timestamp: number;
  /** Active test processes */
  activeTests: number;
  /** Temporary directory size (bytes) */
  tmpDirSize: number;
  /** Number of open file handles */
  openFiles: number;
  /** Memory usage (MB) */
  memoryUsage: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** Disk I/O operations per second */
  diskIOPS: number;
}

export interface ConflictDetection {
  /** Resource name */
  resource: string;
  /** Conflict severity (1-10) */
  severity: number;
  /** Conflict description */
  description: string;
  /** Affected test processes */
  affectedTests: string[];
  /** Timestamp when detected */
  detectedAt: number;
}

export interface MonitoringReport {
  /** Monitoring period start */
  startTime: number;
  /** Monitoring period end */
  endTime: number;
  /** Resource metrics over time */
  metrics: ResourceMetrics[];
  /** Detected conflicts */
  conflicts: ConflictDetection[];
  /** Resource usage statistics */
  statistics: ResourceStatistics;
  /** Optimization recommendations */
  recommendations: string[];
}

export interface ResourceStatistics {
  /** Average values */
  averages: {
    activeTests: number;
    tmpDirSize: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  /** Peak values */
  peaks: {
    activeTests: number;
    tmpDirSize: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  /** Resource utilization efficiency (0-1) */
  efficiency: number;
}

export class ResourceMonitor {
  private logger = new BreakdownLogger("resource-monitor");
  private monitoring = false;
  private metrics: ResourceMetrics[] = [];
  private conflicts: ConflictDetection[] = [];
  private monitoringInterval?: number;
  private startTime = 0;

  constructor(private intervalMs = 5000) {}

  /**
   * Start monitoring resources
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoring) {
      this.logger.warn("Monitoring already active");
      return;
    }

    this.logger.info("Starting resource monitoring", { intervalMs: this.intervalMs });
    this.monitoring = true;
    this.startTime = Date.now();
    this.metrics = [];
    this.conflicts = [];

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        this.detectConflicts();
      } catch (error) {
        this.logger.error("Error during monitoring", { error });
      }
    }, this.intervalMs);

    // Initial metrics collection
    await this.collectMetrics();
  }

  /**
   * Stop monitoring and generate report
   */
  async stopMonitoring(): Promise<MonitoringReport> {
    if (!this.monitoring) {
      this.logger.warn("Monitoring not active");
      return this.generateEmptyReport();
    }

    this.logger.info("Stopping resource monitoring");
    this.monitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Final metrics collection
    await this.collectMetrics();

    const report = this.generateReport();
    await this.saveReport(report);

    return report;
  }

  /**
   * Collect current resource metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: ResourceMetrics = {
        timestamp: Date.now(),
        activeTests: await this.getActiveTestCount(),
        tmpDirSize: await this.getTmpDirectorySize(),
        openFiles: await this.getOpenFileCount(),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: await this.getCpuUsage(),
        diskIOPS: this.getDiskIOPS(),
      };

      this.metrics.push(metrics);

      // Keep only last 1000 metrics to prevent memory leak
      if (this.metrics.length > 1000) {
        this.metrics.shift();
      }

      this.logger.debug("Collected metrics", metrics);
    } catch (error) {
      this.logger.error("Failed to collect metrics", { error });
    }
  }

  /**
   * Detect resource conflicts and race conditions
   */
  private detectConflicts(): void {
    if (this.metrics.length < 2) return;

    const current = this.metrics[this.metrics.length - 1];
    const previous = this.metrics[this.metrics.length - 2];

    // Detect tmp directory size spike (potential cleanup issue)
    if (current.tmpDirSize > previous.tmpDirSize * 2 && current.tmpDirSize > 100 * 1024 * 1024) {
      this.addConflict({
        resource: "tmp-directory",
        severity: 7,
        description: `Temporary directory size spike: ${
          Math.round(current.tmpDirSize / 1024 / 1024)
        }MB`,
        affectedTests: ["all-tests"],
        detectedAt: current.timestamp,
      });
    }

    // Detect high concurrent test activity
    if (current.activeTests > 5 && current.memoryUsage > 500) {
      this.addConflict({
        resource: "concurrent-tests",
        severity: 5,
        description:
          `High concurrent activity: ${current.activeTests} tests, ${current.memoryUsage}MB memory`,
        affectedTests: [`test-group-${current.activeTests}`],
        detectedAt: current.timestamp,
      });
    }

    // Detect CPU saturation
    if (current.cpuUsage > 80) {
      this.addConflict({
        resource: "cpu",
        severity: 6,
        description: `CPU saturation: ${current.cpuUsage}%`,
        affectedTests: ["all-tests"],
        detectedAt: current.timestamp,
      });
    }

    // Detect excessive file handle usage
    if (current.openFiles > 100) {
      this.addConflict({
        resource: "file-handles",
        severity: 8,
        description: `High file handle usage: ${current.openFiles} open files`,
        affectedTests: ["all-tests"],
        detectedAt: current.timestamp,
      });
    }
  }

  /**
   * Add conflict to detection list
   */
  private addConflict(conflict: ConflictDetection): void {
    // Avoid duplicate conflicts within 30 seconds
    const recent = this.conflicts.find((c) =>
      c.resource === conflict.resource &&
      (conflict.detectedAt - c.detectedAt) < 30000
    );

    if (!recent) {
      this.conflicts.push(conflict);
      this.logger.warn("Resource conflict detected", conflict);
    }
  }

  /**
   * Generate monitoring report
   */
  private generateReport(): MonitoringReport {
    const endTime = Date.now();
    const statistics = this.calculateStatistics();
    const recommendations = this.generateRecommendations(statistics);

    return {
      startTime: this.startTime,
      endTime,
      metrics: [...this.metrics],
      conflicts: [...this.conflicts],
      statistics,
      recommendations,
    };
  }

  /**
   * Calculate resource usage statistics
   */
  private calculateStatistics(): ResourceStatistics {
    if (this.metrics.length === 0) {
      return {
        averages: { activeTests: 0, tmpDirSize: 0, memoryUsage: 0, cpuUsage: 0 },
        peaks: { activeTests: 0, tmpDirSize: 0, memoryUsage: 0, cpuUsage: 0 },
        efficiency: 0,
      };
    }

    const averages = {
      activeTests: this.metrics.reduce((sum, m) => sum + m.activeTests, 0) / this.metrics.length,
      tmpDirSize: this.metrics.reduce((sum, m) => sum + m.tmpDirSize, 0) / this.metrics.length,
      memoryUsage: this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length,
      cpuUsage: this.metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / this.metrics.length,
    };

    const peaks = {
      activeTests: Math.max(...this.metrics.map((m) => m.activeTests)),
      tmpDirSize: Math.max(...this.metrics.map((m) => m.tmpDirSize)),
      memoryUsage: Math.max(...this.metrics.map((m) => m.memoryUsage)),
      cpuUsage: Math.max(...this.metrics.map((m) => m.cpuUsage)),
    };

    // Calculate efficiency as inverse of resource waste
    const efficiency = Math.max(
      0,
      1 - (
            (peaks.cpuUsage - averages.cpuUsage) / 100 +
            Math.min(1, (peaks.tmpDirSize - averages.tmpDirSize) / (100 * 1024 * 1024))
          ) / 2,
    );

    return { averages, peaks, efficiency };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(stats: ResourceStatistics): string[] {
    const recommendations: string[] = [];

    if (stats.peaks.activeTests > 8) {
      recommendations.push(
        "Consider reducing maximum parallel test execution to improve stability",
      );
    }

    if (stats.averages.tmpDirSize > 50 * 1024 * 1024) {
      recommendations.push(
        "Implement more aggressive temporary file cleanup during test execution",
      );
    }

    if (stats.peaks.cpuUsage > 90) {
      recommendations.push("CPU saturation detected - consider test parallelization tuning");
    }

    if (stats.efficiency < 0.7) {
      recommendations.push(
        "Resource efficiency below 70% - review test resource allocation strategy",
      );
    }

    if (this.conflicts.length > 0) {
      const highSeverityConflicts = this.conflicts.filter((c) => c.severity >= 7).length;
      if (highSeverityConflicts > 0) {
        recommendations.push(
          `${highSeverityConflicts} high-severity resource conflicts detected - investigate immediately`,
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Resource utilization is optimal - no specific recommendations");
    }

    return recommendations;
  }

  /**
   * Save report to file
   */
  private async saveReport(report: MonitoringReport): Promise<void> {
    try {
      await ensureDir("tmp/monitoring");
      const filename = `resource_report_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      const filepath = join("tmp/monitoring", filename);

      await Deno.writeTextFile(filepath, JSON.stringify(report, null, 2));
      this.logger.info("Report saved", { filepath });
    } catch (error) {
      this.logger.error("Failed to save report", { error });
    }
  }

  /**
   * Generate empty report for error cases
   */
  private generateEmptyReport(): MonitoringReport {
    return {
      startTime: 0,
      endTime: Date.now(),
      metrics: [],
      conflicts: [],
      statistics: {
        averages: { activeTests: 0, tmpDirSize: 0, memoryUsage: 0, cpuUsage: 0 },
        peaks: { activeTests: 0, tmpDirSize: 0, memoryUsage: 0, cpuUsage: 0 },
        efficiency: 0,
      },
      recommendations: ["Monitoring data unavailable"],
    };
  }

  // Platform-specific metric collection methods

  private async getActiveTestCount(): Promise<number> {
    try {
      // Count deno test processes
      const process = new Deno.Command("pgrep", {
        args: ["-cf", "deno test"],
        stdout: "piped",
        stderr: "piped",
      });

      const { stdout } = await process.output();
      const output = new TextDecoder().decode(stdout).trim();

      return output ? parseInt(output, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private async getTmpDirectorySize(): Promise<number> {
    try {
      const tmpDir = "tmp";
      return await this.getDirectorySize(tmpDir);
    } catch {
      return 0;
    }
  }

  private async getDirectorySize(dir: string): Promise<number> {
    try {
      let size = 0;
      for await (const entry of Deno.readDir(dir)) {
        const fullPath = join(dir, entry.name);
        const stat = await Deno.stat(fullPath);

        if (stat.isFile) {
          size += stat.size;
        } else if (stat.isDirectory) {
          size += await this.getDirectorySize(fullPath);
        }
      }
      return size;
    } catch {
      return 0;
    }
  }

  private async getOpenFileCount(): Promise<number> {
    try {
      // macOS/Linux specific - count open file descriptors
      const process = new Deno.Command("sh", {
        args: ["-c", "lsof | wc -l"],
        stdout: "piped",
        stderr: "piped",
      });

      const { stdout } = await process.output();
      const output = new TextDecoder().decode(stdout).trim();

      return parseInt(output, 10) || 0;
    } catch {
      return 0;
    }
  }

  private getMemoryUsage(): number {
    try {
      // Get memory usage of current process
      if (Deno.systemMemoryInfo) {
        const memInfo = Deno.systemMemoryInfo();
        const usedMB = (memInfo.total - memInfo.available) / 1024 / 1024;
        return Math.round(usedMB);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private async getCpuUsage(): Promise<number> {
    try {
      // Simple CPU usage estimation (platform-specific implementation needed)
      const process = new Deno.Command("sh", {
        args: ["-c", "top -l 1 | grep 'CPU usage' | awk '{print $3}' | sed 's/%//'"],
        stdout: "piped",
        stderr: "piped",
      });

      const { stdout } = await process.output();
      const output = new TextDecoder().decode(stdout).trim();

      return parseFloat(output) || 0;
    } catch {
      return 0;
    }
  }

  private getDiskIOPS(): number {
    try {
      // Simplified disk I/O estimation
      return 0; // Implementation depends on platform
    } catch {
      return 0;
    }
  }
}

/**
 * CLI interface for resource monitoring
 */
async function main() {
  const args = Deno.args;
  const command = args[0];

  const monitor = new ResourceMonitor();

  switch (command) {
    case "start": {
      await monitor.startMonitoring();
      console.log("Resource monitoring started. Press Ctrl+C to stop and generate report.");

      // Handle graceful shutdown
      Deno.addSignalListener("SIGINT", async () => {
        console.log("\nStopping resource monitoring...");
        const report = await monitor.stopMonitoring();
        console.log("Monitoring report generated:");
        console.log(`- Duration: ${Math.round((report.endTime - report.startTime) / 1000)}s`);
        console.log(`- Metrics collected: ${report.metrics.length}`);
        console.log(`- Conflicts detected: ${report.conflicts.length}`);
        console.log(`- Resource efficiency: ${Math.round(report.statistics.efficiency * 100)}%`);

        if (report.recommendations.length > 0) {
          console.log("\nRecommendations:");
          report.recommendations.forEach((rec) => console.log(`- ${rec}`));
        }

        Deno.exit(0);
      });

      // Keep monitoring running
      await new Promise(() => {}); // Run indefinitely
      break;
    }

    case "test": {
      console.log("Starting test monitoring session...");
      await monitor.startMonitoring();

      // Simulate test activity for demonstration
      await new Promise((resolve) => setTimeout(resolve, 30000));

      const report = await monitor.stopMonitoring();
      console.log("Test monitoring completed:");
      console.log(JSON.stringify(report, null, 2));
      break;
    }

    default:
      console.log(`
Resource Monitor CLI

Usage:
  deno run -A scripts/resource_monitor.ts start    # Start continuous monitoring
  deno run -A scripts/resource_monitor.ts test     # Run test monitoring session

The monitor tracks:
- Active test processes
- Temporary directory usage
- Memory consumption
- CPU utilization
- File handle usage
- Resource conflicts and race conditions

Reports are saved to tmp/monitoring/ directory.
      `);
  }
}

if (import.meta.main) {
  await main();
}
