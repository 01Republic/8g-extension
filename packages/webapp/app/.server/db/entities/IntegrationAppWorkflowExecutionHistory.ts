import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { IntegrationAppWorkflowMetadata } from "./IntegrationAppWorkflowMetadata";
import type { FormWorkflow } from "~/models/integration/types";

export type WorkflowExecutionStatus =
  | "running"
  | "success"
  | "failed"
  | "timeout";

@Entity("integration_app_workflow_execution_history")
@Index("idx_workflow_id", ["workflowId"])
@Index("idx_status", ["status"])
@Index("idx_started_at", ["startedAt"])
export class IntegrationAppWorkflowExecutionHistory extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column({ type: "int", name: "workflow_id" })
  workflowId: number;

  @ManyToOne(() => IntegrationAppWorkflowMetadata, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workflow_id" })
  workflow: IntegrationAppWorkflowMetadata;

  @Column({
    type: "enum",
    enum: ["running", "success", "failed", "timeout"],
    name: "status",
  })
  status: WorkflowExecutionStatus;

  @Column({ type: "datetime", name: "started_at" })
  startedAt: Date;

  @Column({ type: "datetime", name: "completed_at", nullable: true })
  completedAt: Date | null;

  @Column({ type: "int", name: "duration_ms", nullable: true })
  durationMs: number | null;

  @Column({ type: "json", name: "result", nullable: true })
  result: any;

  @Column({ type: "text", name: "error_message", nullable: true })
  errorMessage: string | null;

  @Column({ type: "json", name: "workflow_snapshot" })
  workflowSnapshot: FormWorkflow;

  @Column({ type: "json", name: "input_vars", nullable: true })
  inputVars: Record<string, any> | null;

  @Column({ type: "json", name: "step_results", nullable: true })
  stepResults: any[] | null;

  @CreateDateColumn({ type: "datetime", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", name: "updated_at" })
  updatedAt: Date;
}
