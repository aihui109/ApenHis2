/*
 Navicat Premium Data Transfer

 Source Server         : 120pgsql
 Source Server Type    : PostgreSQL
 Source Server Version : 110019
 Source Host           : 120.48.115.252:5432
 Source Catalog        : vol_pro_service
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 110019
 File Encoding         : 65001

 Date: 07/05/2023 23:24:55
*/


-- ----------------------------
-- Table structure for TestService
-- ----------------------------
DROP TABLE IF EXISTS "public"."TestService";
CREATE TABLE "public"."TestService" (
  "Id" uuid NOT NULL,
  "DbName" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "DbContent" varchar(100) COLLATE "pg_catalog"."default",
  "CreateDate" timestamp(6),
  "CreateID" int4,
  "Creator" varchar(30) COLLATE "pg_catalog"."default",
  "Modifier" varchar(30) COLLATE "pg_catalog"."default",
  "ModifyDate" timestamp(6),
  "ModifyID" int4
)
;

-- ----------------------------
-- Records of TestService
-- ----------------------------
INSERT INTO "public"."TestService" VALUES ('0c074f22-8c78-4926-a35a-6fdf50d9c831', '业务数据库', '业务数据库业务数据库', '2023-05-07 22:03:21', 1, '超级管理员', '超级管理员', '2023-05-07 22:03:24', 1);

-- ----------------------------
-- Primary Key structure for table TestService
-- ----------------------------
ALTER TABLE "public"."TestService" ADD CONSTRAINT "TestService_pkey" PRIMARY KEY ("Id");
