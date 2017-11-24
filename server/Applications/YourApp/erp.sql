--
-- 表的结构 `users`用户表
--

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'user_id',
  `userName` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(20) NOT NULL DEFAULT '',
  `password` varchar(40) NOT NULL DEFAULT '',
  `access` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1:admin,2:总经理,3:部长,4:库管,5:采购,6:室组经理,7:员工',
  `group` varchar(20) NOT NULL COMMENT '',
  `data_permissions` text,
  `last_login_on` datetime DEFAULT NULL,
  `login_ip` varchar(20) NOT NULL COMMENT '',
  `created_on` datetime DEFAULT NULL,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_username` (`username`),
  UNIQUE KEY `uq_phone` (`phone`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

--
-- 表的结构 `roles`用户表
--

CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1:admin,2:总经理,3:部长,4:库管,5:采购,6:室组经理,7:员工',
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

--
-- 表的结构 `access`用户表
--

CREATE TABLE IF NOT EXISTS `access` (
  `role_id` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1:admin,2:总经理,3:部长,4:室组经理,5:库管,6:采购,7:员工',
  `system_permissions` text,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

system_permissions:

purchase_request,purchase_track,purchase_history,purchase_audit
stock_search,storage,delivery_storage,retirement_audit
material_application,retirement_application,information_maintenance
user_management,operation_log

data_permissions:
contract_number,unit_price,inventory_quantity,money,tax_rate,invoice,inventory_position


--
-- 表的结构 `purchase`采购表
--

CREATE TABLE IF NOT EXISTS `purchase_applicant` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `applicant` varchar(255) NOT NULL COMMENT '申请人',
  `purchase_applicant_id` varchar(30) NOT NULL COMMENT '采购申请编号',
  `current_approver` varchar(255) NOT NULL COMMENT '当前审批人',
  `group_leader` varchar(255) NOT NULL COMMENT '室组经理',
  `department` varchar(255) NOT NULL COMMENT '部长',
  `manager` varchar(255) NOT NULL COMMENT '总经理',
  `purchase` varchar(255) NOT NULL COMMENT '采购人员',
  `warehouse` varchar(255) NOT NULL COMMENT '库管',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0:待审批,1:已审核,2:已下单,3:待领料,4:已领料,,5:已完成',
  `created_on` datetime DEFAULT NULL COMMENT '采购申请日期',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `purchase_material` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_applicant_id` varchar(30) NOT NULL COMMENT '采购申请编号',
  `material_name` varchar(30) NOT NULL COMMENT '名称',
  `model` varchar(30) NOT NULL COMMENT '型号',
  `sn_num` varchar(30) NOT NULL COMMENT 'sn号',
  `project_num` varchar(30) NOT NULL COMMENT '项目号',
  `unit` varchar(10) NOT NULL COMMENT '单位',
  `number` int(11) NOT NULL COMMENT '数量',
  `expected_date` date COMMENT '期望交付日期',
  `remark` text COMMENT '备注',
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;


采购下单，生成purchase_order数据，更新purchase_order表
--
-- 表的结构 `purchase_order`
--

CREATE TABLE IF NOT EXISTS `purchase_order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_applicant_id` varchar(30) NOT NULL COMMENT '采购申请编号',
  `purchase_order_id` varchar(30) NOT NULL COMMENT '采购订单编号',
  `contract_num` varchar(30) NOT NULL COMMENT '合同号',
  `created_on` datetime DEFAULT NULL COMMENT '采购下单日期',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

--
-- 表的结构 `order_material`
--

CREATE TABLE IF NOT EXISTS `order_material` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_order_id` varchar(30) NOT NULL COMMENT '采购订单编号',
  `material_code` varchar(30) NOT NULL COMMENT '物料编码 唯一',
  `material_name` varchar(30) NOT NULL COMMENT '名称',
  `model` varchar(30) NOT NULL COMMENT '型号',
  `sn_num` varchar(30) NOT NULL COMMENT 'sn号',
  `supplier` varchar(255) NOT NULL COMMENT '供应商名称',
  `supplier_num` varchar(255) NOT NULL COMMENT '供应商编号',
  `project_num` varchar(30) NOT NULL COMMENT '项目号',
  `unit` varchar(30) NOT NULL COMMENT '单位',
  `number` int(11) NOT NULL COMMENT '数量',
  `batch` varchar(30) NOT NULL DEFAULT '' COMMENT '批次',
  `unit_price` varchar(30) NOT NULL DEFAULT '' COMMENT '单价',
  `total_price` varchar(30) NOT NULL DEFAULT '' COMMENT '金额',
  `rate` varchar(30) NOT NULL DEFAULT '' COMMENT '税率',
  `invoice` varchar(60) NOT NULL DEFAULT '' COMMENT '发票',
  `brand` varchar(255) NOT NULL DEFAULT '' COMMENT '品牌',
  `manufactor` varchar(255) NOT NULL DEFAULT '' COMMENT '厂家',
  `created_on` datetime DEFAULT NULL COMMENT '采购下单日期',
  `arrived_on` datetime DEFAULT NULL COMMENT '到货日期',
  `status` tinyint(1) DEFAULT '0' COMMENT '0:未到货,1:到货',
  `remark` text COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

--
-- 表的结构 `purchase_track`
--

CREATE TABLE IF NOT EXISTS `purchase_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_applicant_id` varchar(30) NOT NULL COMMENT '采购申请编号',
  `applicant` varchar(255) NOT NULL COMMENT '申请人',
  `applicant_date` datetime DEFAULT NULL,
  `group_leader` tinyint(1) DEFAULT '0' COMMENT '0:没有审批,1:已审核,2:已下单，3:已到货，-1:未通过',
  `group_leader_date` datetime DEFAULT NULL,
  `department` tinyint(1) DEFAULT '0',
  `department_date` datetime DEFAULT NULL,
  `manager` tinyint(1) DEFAULT '0',
  `manager_date` datetime DEFAULT NULL,
  `purchase` tinyint(1) DEFAULT '0',
  `purchase_date` datetime DEFAULT NULL,
  `warehouse` tinyint(1) DEFAULT '0',
  `warehouse_date` datetime DEFAULT NULL,
  `rejecter` varchar(255) NOT NULL COMMENT "拒绝人",
  `reason` text NOT NULL DEFAULT '' COMMENT "拒绝理由" ,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-1：未通过
1：待审批
2：待下单
3：已下单
4：已到货
5：已领料

--
-- 表的结构 `material requisition`领料表
--

CREATE TABLE IF NOT EXISTS `material_requisition` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `applicant` varchar(255) NOT NULL COMMENT '申请人',
  `material_requisition_id` varchar(30) NOT NULL COMMENT '领料编号',
  `material_code` varchar(30) NOT NULL COMMENT '物料编码',
  `material_name` varchar(30) NOT NULL COMMENT '名称',
  `model` varchar(30) NOT NULL COMMENT '型号',
  `sn_num` varchar(30) NOT NULL COMMENT 'sn号',
  `project_num` varchar(30) NOT NULL COMMENT '项目号',
  `unit` varchar(30) NOT NULL COMMENT '单位',
  `number` int(11) NOT NULL COMMENT '数量',
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '申请时间',
  `remark` text COMMENT '备注',
  `current_approver` varchar(255) NOT NULL DEFAULT 'default',
  `group_leader` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0:待审核,1:已审核,-1:未通过',
  `rejecter` varchar(255) NOT NULL DEFAULT '',
  `reason` text COMMENT "拒绝理由",
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

--
-- 表的结构 `material_return`退料表
--

CREATE TABLE IF NOT EXISTS `material_return` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `applicant` varchar(255) NOT NULL COMMENT '申请人',
  `material_return_id` varchar(30) NOT NULL COMMENT '采购退料编号',
  `material_name` varchar(30) NOT NULL COMMENT '名称',
  `model` varchar(30) NOT NULL COMMENT '型号',
  `sn_num` varchar(30) NOT NULL COMMENT 'sn号',
  `project_num` varchar(30) NOT NULL COMMENT '项目号',
  `unit` varchar(30) NOT NULL COMMENT '单位',
  `number` int(11) NOT NULL COMMENT '数量',
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '申请时间',
  `remark` text COMMENT '备注',
  `current_approver` varchar(255) NOT NULL DEFAULT 'default',
  `group_leader` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `goods_status` tinyint(1) NOT NULL COMMENT '0:待审核,1:已审核,-1:未通过',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;


--
-- 表的结构 `goods`
--

CREATE TABLE IF NOT EXISTS `material` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `material_code` varchar(30) NOT NULL COMMENT '物料编码',
  `material_name` varchar(30) NOT NULL COMMENT '名称',
  `model` varchar(30) NOT NULL COMMENT '型号',
  `sn_num` varchar(30) NOT NULL COMMENT 'sn号',
  `supplier` varchar(30) NOT NULL COMMENT '供应商名称',
  `supplier_num` varchar(255) NOT NULL COMMENT '供应商编号',
  `project_num` varchar(30) NOT NULL COMMENT '项目号',
  `unit` varchar(30) NOT NULL COMMENT '单位',
  `stock_number` int(11) NOT NULL COMMENT '库存数量',
  `batch` varchar(30) NOT NULL DEFAULT '' COMMENT '批次',
  `brand` varchar(255) NOT NULL DEFAULT '' COMMENT '品牌',
  `manufactor` varchar(255) NOT NULL DEFAULT '' COMMENT '厂家',
  `unit_price` varchar(30) NOT NULL DEFAULT '' COMMENT '单价',
  `stock_position` text DEFAULT '' COMMENT '库存位置',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

--
-- 表的结构 `log`
--

CREATE TABLE IF NOT EXISTS `log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `operator` varchar(30) NOT NULL DEFAULT '',
  `type` varchar(255) NOT NULL DEFAULT '',
  `ip` varchar(50) NOT NULL DEFAULT '',
  `operateDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;



--
-- 表的结构 `sendmessage`
--

CREATE TABLE IF NOT EXISTS `sendmessage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill` varchar(30) NOT NULL COMMENT '物料编号',
  `approver` varchar(30) NOT NULL COMMENT '要发给谁',
  `message` text COMMENT '发送的消息',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0:未发送,1:已发送',
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;


--
-- 表的结构 `sendmessage`
--

CREATE TABLE `purchase_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_applicant_id` varchar(30) NOT NULL COMMENT '采购申请编号',
  `applicant` varchar(255) NOT NULL COMMENT '申请人',
  `applicant_date` datetime DEFAULT NULL,
  `group_leader` tinyint(1) DEFAULT '0' COMMENT '0:没有审批,1:已审核,2:已下单，3:已到货，-1:未通过',
  `group_leader_date` datetime DEFAULT NULL,
  `department` tinyint(1) DEFAULT '0',
  `department_date` datetime DEFAULT NULL,
  `manager` tinyint(1) DEFAULT '0',
  `manager_date` datetime DEFAULT NULL,
  `purchase` tinyint(1) DEFAULT '0',
  `purchase_date` datetime DEFAULT NULL,
  `warehouse` tinyint(1) DEFAULT '0',
  `warehouse_date` datetime DEFAULT NULL,
  `sequence` tinyint(1) NOT NULL DEFAULT '1' COMMENT '审核顺序：1,室组经理 2,部长 3,总经理 4,采购 5,库管',
  `rejecter` varchar(255) NOT NULL COMMENT '拒绝人',
  `rejecter_position` varchar(255) NOT NULL COMMENT '拒绝人职位',
  `reason` text NOT NULL COMMENT '拒绝理由',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8


CREATE TABLE `material_return` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `applicant` varchar(255) NOT NULL COMMENT '申请人',
  `material_return_id` varchar(30) NOT NULL COMMENT '退料编号',
  `material_code` varchar(30) NOT NULL COMMENT '物料编码',
  `material_name` varchar(30) NOT NULL COMMENT '名称',
  `model` varchar(30) NOT NULL COMMENT '型号',
  `sn_num` varchar(30) NOT NULL COMMENT 'sn号',
  `project_num` varchar(30) NOT NULL COMMENT '项目号',
  `unit` varchar(30) NOT NULL COMMENT '单位',
  `number` int(11) NOT NULL COMMENT '数量',
  `applicant_date` datetime DEFAULT NULL COMMENT '申请时间',
  `remark` text COMMENT '备注',
  `current_approver` varchar(255) NOT NULL DEFAULT 'default',
  `group_leader` varchar(255) NOT NULL,
  `group_leader_status` tinyint(1) NOT NULL COMMENT '0:待审核,1:已审核,-1:未通过',
  `department` varchar(255) NOT NULL,
  `department_status` tinyint(1) NOT NULL COMMENT '0:待审核,1:已审核,-1:未通过',
  `status` tinyint(1) NOT NULL COMMENT '0:待审核,1:已审核,-1:未通过',
  `picking_status` tinyint(1) NOT NULL COMMENT '0:待退料,1:已退料',
  `rejecter` varchar(255) NOT NULL DEFAULT '',
  `reason` text NOT NULL COMMENT '拒绝理由',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8

CREATE TABLE IF NOT EXISTS `project` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_num` varchar(30) NOT NULL COMMENT '采购申请编号',
  `material_name` varchar(30) NOT NULL COMMENT '名称',
  `model` varchar(30) NOT NULL COMMENT '型号',
  `sn_num` varchar(30) NOT NULL COMMENT 'sn号',
  `project_num` varchar(30) NOT NULL COMMENT '项目号',
  `unit` varchar(10) NOT NULL COMMENT '单位',
  `number` int(11) NOT NULL COMMENT '数量',
  `expected_date` date COMMENT '期望交付日期',
  `remark` text COMMENT '备注',
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `material_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `material_code` varchar(30) NOT NULL COMMENT '物料编码',
  `material_name` varchar(30) NOT NULL COMMENT '名称',
  `unit` varchar(10) NOT NULL COMMENT '单位',
  `model` varchar(30) NOT NULL COMMENT '型号',
  `manufactor` varchar(255) NOT NULL DEFAULT '' COMMENT '厂家',
  `description` text NOT NULL DEFAULT '' COMMENT '描述',
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_material_code` (`material_code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `supplier` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(30) NOT NULL COMMENT '供应商名称',
  `supplier_num` varchar(255) NOT NULL COMMENT '供应商编号',
  `contact` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(20) NOT NULL DEFAULT '',
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_supplier_num` (`supplier_num`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `project` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_name` varchar(30) NOT NULL COMMENT '项目名称',
  `project_num` varchar(255) NOT NULL COMMENT '项目号',
  `responsibility` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(20) NOT NULL DEFAULT '',
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_supplier_num` (`project_num`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `borrow_material` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `borrow_material_id` int(11) NOT NULL COMMENT '物料表id',
  `material_code` varchar(30) NOT NULL COMMENT '物料编码 唯一',
  `material_name` varchar(30) NOT NULL COMMENT '名称',
  `model` varchar(30) NOT NULL COMMENT '型号',
  `selectedSn` varchar(30) NOT NULL COMMENT '选择的sn号',
  `number` int(11) NOT NULL COMMENT '数量',
  `borrowPeople` varchar(30) NOT NULL COMMENT '借用人',
  `borrowDate` datetime DEFAULT NULL COMMENT '借用申请日期',
  `planReturnDate` datetime DEFAULT NULL COMMENT '计划归还日期',
  `actualReturnDate` datetime DEFAULT NULL COMMENT '实际归还日期',
  `status` tinyint(1) DEFAULT '0' COMMENT '0:借用,1:归还',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;
