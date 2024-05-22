/*
 Navicat Premium Data Transfer

 Source Server         : 120pgsql
 Source Server Type    : PostgreSQL
 Source Server Version : 110019
 Source Host           : 120.48.115.252:5432
 Source Catalog        : vol_pro_test
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 110019
 File Encoding         : 65001

 Date: 07/05/2023 23:25:10
*/


-- ----------------------------
-- Table structure for TestDb
-- ----------------------------
DROP TABLE IF EXISTS "public"."TestDb";
CREATE TABLE "public"."TestDb" (
  "Id" uuid NOT NULL,
  "TestDbName" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "TestDbContent" varchar(100) COLLATE "pg_catalog"."default",
  "CreateDate" timestamp(6),
  "CreateID" int4,
  "Creator" varchar(30) COLLATE "pg_catalog"."default",
  "Modifier" varchar(30) COLLATE "pg_catalog"."default",
  "ModifyDate" timestamp(6),
  "ModifyID" int4
)
;

-- ----------------------------
-- Records of TestDb
-- ----------------------------
INSERT INTO "public"."TestDb" VALUES ('3ad3735d-0fc2-439d-ab9f-7c9867961456', '测试数据库', '测试数据库测试数据库', '2023-05-07 22:03:32', 1, '超级管理员', NULL, NULL, NULL);

-- ----------------------------
-- Primary Key structure for table TestDb
-- ----------------------------
ALTER TABLE "public"."TestDb" ADD CONSTRAINT "TestDb_pkey" PRIMARY KEY ("Id");
