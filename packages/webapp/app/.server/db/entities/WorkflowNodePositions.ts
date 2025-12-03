import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * 워크플로우 노드 위치 정보 저장 테이블
 *
 * MySQL / MariaDB 호환 테이블 생성 쿼리:
 *
 * CREATE TABLE IF NOT EXISTS workflow_node_positions (
 *   id INT NOT NULL AUTO_INCREMENT,
 *   workflow_id INT NOT NULL,
 *   positions JSON NOT NULL,
 *   created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
 *   updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 *   PRIMARY KEY (id),
 *   UNIQUE KEY uk_workflow_id (workflow_id),
 *   KEY idx_workflow_id (workflow_id)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 */
export type NodePositionsMap = Record<string, { x: number; y: number }>;

@Entity("workflow_node_positions")
export class WorkflowNodePositions extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column({ type: "int", name: "workflow_id", unique: true })
  workflowId: number;

  @Column({ type: "json", name: "positions" })
  positions: NodePositionsMap;

  @CreateDateColumn({ type: "datetime", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", name: "updated_at" })
  updatedAt: Date;
}
