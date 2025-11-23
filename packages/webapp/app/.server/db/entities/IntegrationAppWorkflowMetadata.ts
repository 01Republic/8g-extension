import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { FormWorkflow } from "~/models/integration/types";

/*
CREATE TABLE IF NOT EXISTS payplo_staging.integration_app_workflow_metadata (
  id INT NOT NULL AUTO_INCREMENT,
  description VARCHAR(255) NOT NULL,
  meta JSON NOT NULL,
  type VARCHAR(50) DEFAULT 'workflow',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

export type WorkflowType =
  | "WORKFLOW"
  | "WORKSPACE"
  | "WORKSPACE_DETAIL"
  | "MEMBERS"
  | "ADD_MEMBERS"
  | "DELETE_MEMBERS"
  | "BILLING"
  | "BILLING_HISTORIES";

@Entity("integration_app_workflow_metadata")
export class IntegrationAppWorkflowMetadata extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column({ type: "varchar", name: "description" })
  description: string;

  @Column({ type: "json", name: "meta" })
  meta: FormWorkflow;

  @Column({ type: "varchar", name: "type", default: "WORKFLOW" })
  type: WorkflowType;

  @Column({ type: "int", name: "product_id" })
  productId: number;

  @CreateDateColumn({ type: "datetime", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", name: "updated_at" })
  updatedAt: Date;
}
