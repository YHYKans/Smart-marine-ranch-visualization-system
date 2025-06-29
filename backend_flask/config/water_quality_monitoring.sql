/*
 Navicat Premium Dump SQL

 Source Server         : 水质数据库
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42)
 Source Host           : localhost:3306
 Source Schema         : water_quality_monitoring

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42)
 File Encoding         : 65001

 Date: 25/06/2025 18:41:28
*/
USE water_quality_monitoring;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for fish_species
-- ----------------------------
DROP TABLE IF EXISTS `fish_species`;
CREATE TABLE `fish_species`  (
  `species_id` int NOT NULL AUTO_INCREMENT,
  `common_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`species_id`) USING BTREE,
  UNIQUE INDEX `common_name`(`common_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for monitoring_site
-- ----------------------------
DROP TABLE IF EXISTS `monitoring_site`;
CREATE TABLE `monitoring_site`  (
  `site_id` int NOT NULL AUTO_INCREMENT,
  `site_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `site_name` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `river_basin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `section_name` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `established_date` date NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`site_id`) USING BTREE,
  UNIQUE INDEX `site_code`(`site_code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2104 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for fish_observations
-- ----------------------------
DROP TABLE IF EXISTS `fish_observations`;
CREATE TABLE `fish_observations`  (
  `observation_id` bigint NOT NULL AUTO_INCREMENT,
  `species_id` int NOT NULL,
  `body_weight` decimal(8, 2) NULL DEFAULT NULL,
  `body_length1` decimal(8, 2) NULL DEFAULT NULL,
  `body_length2` decimal(8, 2) NULL DEFAULT NULL,
  `body_length3` decimal(8, 2) NULL DEFAULT NULL,
  `body_height` decimal(8, 2) NULL DEFAULT NULL,
  `body_width` decimal(8, 2) NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`observation_id`) USING BTREE,
  INDEX `species_id`(`species_id` ASC) USING BTREE,
  CONSTRAINT `fish_observations_ibfk_1` FOREIGN KEY (`species_id`) REFERENCES `fish_species` (`species_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 160 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sensor_device
-- ----------------------------
DROP TABLE IF EXISTS `sensor_device`;
CREATE TABLE `sensor_device`  (
  `device_id` int NOT NULL AUTO_INCREMENT COMMENT '设备唯一ID',
  `site_id` int NOT NULL COMMENT '关联站点ID',
  `device_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备名称(如\"水质监测器01\")',
  `device_type` enum('WATER_QUALITY','WEATHER','CAMERA','FLOW','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'WATER_QUALITY' COMMENT '设备类型',
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备型号',
  `manufacturer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '制造商',
  `parameters` json NULL COMMENT '监测参数配置(JSON格式)',
  `installation_date` date NULL DEFAULT NULL COMMENT '安装日期',
  `last_calibration` date NULL DEFAULT NULL COMMENT '上次校准日期',
  `status` enum('ACTIVE','MAINTENANCE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'ACTIVE' COMMENT '设备状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`device_id`) USING BTREE,
  INDEX `idx_site`(`site_id` ASC) USING BTREE,
  CONSTRAINT `sensor_device_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `monitoring_site` (`site_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '监测设备信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否为管理员(1=是,0=否)',
  `status` enum('active','inactive','blocked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '用户状态',
  `login_attempts` int NOT NULL DEFAULT 0 COMMENT '登录尝试次数',
  `last_login` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;


-- ----------------------------
-- Insert record for user_id = 0 (防止用户注册使用)
-- ----------------------------
INSERT INTO `users` (`user_id`, `username`, `password_hash`, `email`, `is_admin`, `status`, `login_attempts`, `created_at`) 
VALUES (0, 'system_reserved', '0', 'reserved@system.com', 0, 'inactive', 0, CURRENT_TIMESTAMP);

-- ----------------------------
-- Table structure for auth_logs
-- ----------------------------
DROP TABLE IF EXISTS `auth_logs`;
CREATE TABLE `auth_logs`  (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型',
  `user_type` enum('user','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户类型',
  `successful` tinyint(1) NOT NULL COMMENT '操作是否成功(1=成功,0=失败)',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '用户代理信息',
  `failure_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '失败原因',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`log_id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `username`(`username` ASC) USING BTREE,
  INDEX `action`(`action` ASC) USING BTREE,
  INDEX `successful`(`successful` ASC) USING BTREE,
  INDEX `timestamp`(`timestamp` ASC) USING BTREE,
  CONSTRAINT `auth_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------
-- Table structure for video_record
-- ----------------------------
DROP TABLE IF EXISTS `video_record`;
CREATE TABLE `video_record`  (
  `record_id` bigint NOT NULL AUTO_INCREMENT COMMENT '记录唯一ID',
  `site_id` int NOT NULL COMMENT '关联站点ID',
  `device_id` int NULL DEFAULT NULL COMMENT '拍摄设备(可为空)',
  `record_datetime` datetime NOT NULL COMMENT '拍摄时间',
  `duration` int NULL DEFAULT NULL COMMENT '视频时长(秒)',
  `resolution` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分辨率(如\"1920x1080\")',
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频存储路径',
  `file_size` bigint NULL DEFAULT NULL COMMENT '文件大小(字节)',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '视频内容描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`record_id`) USING BTREE,
  INDEX `device_id`(`device_id` ASC) USING BTREE,
  INDEX `idx_site_time`(`site_id` ASC, `record_datetime` ASC) USING BTREE,
  CONSTRAINT `video_record_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `monitoring_site` (`site_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `video_record_ibfk_2` FOREIGN KEY (`device_id`) REFERENCES `sensor_device` (`device_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '视频监测记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for water_quality
-- ----------------------------
DROP TABLE IF EXISTS `water_quality`;
CREATE TABLE `water_quality`  (
  `record_id` bigint NOT NULL AUTO_INCREMENT,
  `site_id` int NOT NULL,
  `monitoring_date` date NOT NULL,
  `monitoring_time` time NULL DEFAULT NULL,
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `river_basin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `section_name` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `water_grade` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `water_temp` decimal(5, 2) NULL DEFAULT NULL,
  `ph` decimal(4, 2) NULL DEFAULT NULL,
  `dissolved_oxygen` decimal(5, 2) NULL DEFAULT NULL,
  `conductivity` decimal(10, 2) NULL DEFAULT NULL,
  `turbidity` decimal(8, 2) NULL DEFAULT NULL,
  `cod_mn` decimal(8, 2) NULL DEFAULT NULL,
  `ammonia_nitrogen` decimal(8, 3) NULL DEFAULT NULL,
  `total_phosphorus` decimal(8, 3) NULL DEFAULT NULL,
  `total_nitrogen` decimal(8, 2) NULL DEFAULT NULL,
  `chla` decimal(10, 4) NULL DEFAULT NULL,
  `algae_density` decimal(20, 2) NULL DEFAULT NULL,
  `site_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `original_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`) USING BTREE,
  INDEX `site_id`(`site_id` ASC) USING BTREE,
  CONSTRAINT `water_quality_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `monitoring_site` (`site_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 70581 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;

-- 创建异常阈值表
CREATE TABLE `anomaly_thresholds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `parameter` VARCHAR(50) NOT NULL UNIQUE,
  `lower_threshold` FLOAT,
  `upper_threshold` FLOAT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入初始阈值数据

INSERT INTO `anomaly_thresholds` (`parameter`, `lower_threshold`, `upper_threshold`) 
VALUES 
('water_temp', 15, 30),
('ph', 6.5, 8.5),
('dissolved_oxygen', 4, 10),
('turbidity', 0, 50),
('ammonia_nitrogen', 0, 0.2);