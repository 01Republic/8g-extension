import "reflect-metadata";
import { DataSource, BaseEntity } from "typeorm";
import { allEntities } from "./entities/index";

// 환경변수 설정
const config = {
  type: (process.env.DB_TYPE || "mysql") as "mysql" | "mariadb",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "your_database_name",
};

export const AppDataSource = new DataSource({
  type: config.type,
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.database,
  synchronize: false, // 기존 DB가 있으므로 false로 설정
  logging: process.env.NODE_ENV === "development",
  entities: allEntities,
});

// 데이터베이스 연결 초기화 함수
export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      console.log(config);
      await AppDataSource.initialize();

      // BaseEntity에 DataSource 설정
      BaseEntity.useDataSource(AppDataSource);

      console.log("Database connection has been initialized successfully.");
    }
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    throw error;
  }
};

// 데이터베이스 연결 종료 함수
export const closeDatabase = async () => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Database connection has been closed.");
    }
  } catch (error) {
    console.error("Error during Data Source destruction:", error);
    throw error;
  }
};
