CREATE TABLE "VOL_PRO_TEST"."TestDb"
(
 "ID" VARCHAR(36) NOT NULL,
 "TESTDBNAME" VARCHAR(100) NOT NULL,
 "TESTDBCONTENT" VARCHAR(100) NULL,
 "CREATEDATE" TIMESTAMP(3) NULL,
 "CREATEID" INT NULL,
 "CREATOR" VARCHAR(30) NULL,
 "MODIFIER" VARCHAR(30) NULL,
 "MODIFYDATE" TIMESTAMP(3) NULL,
 "MODIFYID" INT NULL,
   CONSTRAINT "PK__TESTDB__3214EC077F60ED59"  CLUSTER PRIMARY KEY("ID") ENABLE 
);
INSERT INTO "VOL_PRO_TEST"."TestDb"("ID","TESTDBNAME","TESTDBCONTENT","CREATEDATE","CREATEID","CREATOR","MODIFIER","MODIFYDATE","MODIFYID") VALUES('6E4D6246-8A6C-4687-B11E-F35523B149E0','这是测试数据库','这是测试数据库。。。',TO_DATE('2023-05-19 11:46:47.000','YYYY-MM-DD HH24:MI:SS.FF'),3362,'测试管理员',null,null,null);

ALTER TABLE "VOL_PRO_TEST"."TestDb" ADD CONSTRAINT "PK__TESTDB__3214EC077F60ED59" CLUSTER  PRIMARY KEY("ID") ;

