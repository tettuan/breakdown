import { PaneDetail } from "./models.ts";

/**
 * Pane Display Class - Single Responsibility: Display Management
 */
export class PaneDisplayer {
  private constructor(
    private logger: any
  ) {}

  static create(logger: any): PaneDisplayer {
    return new PaneDisplayer(logger);
  }

  displayPaneList(panes: PaneDetail[]): void {
    this.logger.info(`\nFound ${panes.length} panes:`);
    panes.forEach((pane, index) => {
      const activeStatus = pane.active === '1' ? 'ACTIVE' : 'INACTIVE';
      this.logger.info(`  ${index + 1}. [${pane.paneId}] ${pane.title} - ${pane.currentCommand} (${activeStatus})`);
    });
  }

  displayMainAndTargetPanes(mainPanes: PaneDetail[], targetPanes: PaneDetail[]): void {
    this.logger.info(`\nMain panes (${mainPanes.length}):`);
    mainPanes.forEach((pane, index) => {
      this.logger.info(`  ${index + 1}. [${pane.paneId}] ${pane.title} - ${pane.currentCommand}`);
    });

    this.logger.info(`\nTarget panes (${targetPanes.length}):`);
    targetPanes.forEach((pane, index) => {
      this.logger.info(`  ${index + 1}. [${pane.paneId}] ${pane.title} - ${pane.currentCommand}`);
    });
  }
}
