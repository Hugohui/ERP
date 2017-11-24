<?php
/**
 * This file is part of workerman.
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the MIT-LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @author walkor<walkor@workerman.net>
 * @copyright walkor<walkor@workerman.net>
 * @link http://www.workerman.net/
 * @license http://www.opensource.org/licenses/mit-license.php MIT License
 */

/**
 * 用于检测业务代码死循环或者长时间阻塞等问题
 * 如果发现业务卡死，可以将下面declare打开（去掉//注释），并执行php start.php reload
 * 然后观察一段时间workerman.log看是否有process_timeout异常
 */
//declare(ticks=1);

use \GatewayWorker\Lib\Gateway;
require_once __DIR__ . '/../../vendor/workerman/workerman/mysql/mysql-master/src/Connection.php';
require_once (__DIR__ . '/../../vendor/autoload.php');
require_once('search_string.php');
require_once('msg_type.php');
require_once('HashTable.php');
require_once('unique_array.php');
error_reporting( E_ALL&~E_NOTICE );

/**
 * 主逻辑
 * 主要是处理 onConnect onMessage onClose 三个方法
 * onConnect 和 onClose 如果不需要可以不用实现并删除
 */
class Events
{
    /**
     * 当客户端连接时触发
     * 如果业务不需此回调可以删除onConnect
     *
     * @param int $client_id 连接id
     */
    public static function onConnect($client_id) {

    }

    /**
     * 新建一个类的静态成员，用来保存数据库实例
     */
    public static $db = null;

    /**
     * 新建一个类的静态成员，用来保存日志实例
     */
    public static $logger = null;

    public static $hash = null;


    public static function onWorkerStart($worker)
    {
        //创建mysql实例
        self::$db = new Workerman\MySQL\Connection('localhost', '3306', 'root', 'idriver', 'erp');
        //创建log实例
        self::$logger = new Katzgrau\KLogger\Logger(__DIR__.'/logs');
        //创建hash表实例
        self::$hash = new HashTable();
    }

   /**
    * 当客户端发来消息时触发
    * @param int $client_id 连接id
    * @param mixed $message 具体消息
    */
    public static function onMessage($client_id, $message) {
        $message_data = $message['get'];
        if(!$message_data)
        {
            return;
        }

        //根据类型执行不同业务
        switch($message_data['action'])
        {
/**
 * 登录接口
 */
            case 'erpLogin':
            $password_data = self::$db->select('password,access')->from('users')->where("userName = '{$message_data['params']['userName']}'")->query();
            if(empty($password_data))
            {
                $login_result = array("resData" => array(
                                                         "result" => -2,
                                                         "msg" => "用户名不存在"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($login_result, JSON_UNESCAPED_UNICODE).')'));
                break;
            }
            if($password_data[0]['password'] == $message_data['params']['password'])
            {
                self::$hash->insert($message_data['params']['userName'], $message_data['params']['password']);
                //var_dump($message_data['params']['userName']);
                //var_dump(self::$hash->find($message_data['params']['userName']));
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['userName'],'type'=>LOGIN_SYSTEM))->query();
                //获取系统权限
                $system_permissions = self::$db->select('system_permissions')->from('access')->where("role_id = '{$password_data[0]['access']}'")->query();
                $system_permissions = unserialize($system_permissions[0]['system_permissions']);
                $system_permissions['role_id'] = $password_data[0]['access'];

                //查找未点开的推送消息
                $message = self::$db->select('bill,message')->from('sendmessage')->where("status = 0")->query();
                $message = empty($message) ? '' : $message;

                //添加消息推送
                $sendmessage = self::$db->select('applicant,bill,message')->from('sendmessage')->where("approver = '{$message_data['params']['userName']}' and status = 0")->query();

                $login_result = array("resData" => array(
                                                         "result" => 0,
                                                         "access" => $system_permissions,
                                                         "sendMessage" => $sendmessage));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($login_result, JSON_UNESCAPED_UNICODE).')'));


                self::$logger->info('erpLogin', $message_data['params']);
            }
            else
            {
                $login_result = array("resData" => array(
                                                         "result" => -1,
                                                         "msg" => "密码错误"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($login_result, JSON_UNESCAPED_UNICODE).')'));

            }
            break;

/**
 * 采购申请接口
 */
            //采购申请
            case 'purchaseRequest':
            $date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
            try {
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['applicant'],'type'=>PURCHASE_APPLICANT))->query();
                //获取采购和库管人员
                // $purchase_man = self::$db->select('userName')->from('users')->where("access = 5")->limit(1)->query();
                $purchase_man[0]['userName'] = '张智丰';
                // $warehouse_man = self::$db->select('userName')->from('users')->where("access = 4")->limit(1)->query();
                $warehouse_man[0]['userName'] = '姚威';
                //插入到采购申请表
                $insert_purchase = self::$db->insert('purchase_applicant')->cols(array('applicant'=>$message_data['params']['applicant'],'purchase_applicant_id'=>$message_data['params']['purchase_applicant_id'],'group_leader'=>$message_data['params']['approver']['group_leader'],'department'=>$message_data['params']['approver']['department'],'manager'=>$message_data['params']['approver']['manager'], 'current_approver'=>$message_data['params']['approver']['group_leader'], 'purchase'=>$purchase_man[0]['userName'], 'warehouse'=>$warehouse_man[0]['userName'], 'created_on'=>$date))->query();
                //插入到物料表
                foreach ($message_data['params']['materialList'] as $value)
                {
                    $value['purchase_applicant_id'] = $message_data['params']['purchase_applicant_id'];
                    $insert_purchase = self::$db->insert('purchase_material')->cols($value)->query();

                    // $sql = "insert into project_num(project_num) select '{$value['project_num']}' from dual where not exists (select project_num from project_num where project_num.project_num = '{$value['project_num']}')";
                    // $insert_project_num = self::$db->query($sql);
                }
                //如果霍舒豪为组长
                if ($message_data['params']['approver']['group_leader'] == '霍舒豪')
                {
                    $date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
                    $update_track = self::$db->update('purchase_track')->cols(array('group_leader'=>1, 'group_leader_date'=>$date, 'sequence'=>2 ))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "提交失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('purchaseRequest params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "提交成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //获取审批人
            case 'getApprover':
            try {
                //获取组长
                //bug 添加霍舒豪为组长
                if ($message_data['params'] == 'group_leader')
                {
                    $approverlist = self::$db->select('userName,department')->from('users')->where("access = 6")->query();
                    $index = count($approverlist, 0);
                    $approverlist[$index]['userName'] = '霍舒豪';
                    $approverlist[$index]['department'] = '软件组';
                }
                //获取部长
                if ($message_data['params'] == 'department')
                {
                    $approverlist = self::$db->select('userName,department')->from('users')->where("access = 3")->query();
                }
                //获取总经理
                if ($message_data['params'] == 'manager')
                {
                    $approverlist = self::$db->select('userName,department')->from('users')->where("access = 2")->query();
                }
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "查询失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('getApprover params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $approverlist));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //采购跟踪
            case 'purchaseTrack':
            if (empty($message_data['params']['queryData']))
            {
                try {
                    $sql = "select t.purchase_applicant_id,t.applicant,applicant_date,t.group_leader,t.group_leader_date,t.department,t.department_date,t.manager,t.manager_date,t.purchase,t.purchase_date,t.warehouse,t.warehouse_date,t.rejecter,t.rejecter_position,t.reason,t.group_leader_reason,t.department_reason,t.manager_reason,a.status from purchase_track t, purchase_applicant a where t.applicant = '{$message_data['params']['applicant']}' and t.purchase_applicant_id = a.purchase_applicant_id order by applicant_date desc limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $purchaseTrack_data = self::$db->query($sql);
                    $data = array();
                    foreach ($purchaseTrack_data as $k => $v)
                    {
                        $data[$k]['purchase_applicant_id'] = $v['purchase_applicant_id'];
                        $v['applicant_date'] = is_null($v['applicant_date']) ? "" : $v['applicant_date'];
                        $data[$k]['personal'] = array('status' => $v['applicant'], 'reason' => '', 'date' =>$v['applicant_date']);
                        $v['group_leader_date'] = is_null($v['group_leader_date']) ? "" : $v['group_leader_date'];
                        $data[$k]['group_leader'] = array('status' => $v['group_leader'], 'reason' => $v['group_leader_reason'], 'date' =>$v['group_leader_date']);
                        $v['department_date'] = is_null($v['department_date']) ? "" : $v['department_date'];
                        $data[$k]['department'] = array('status' => $v['department'], 'reason' => $v['department_reason'], 'date' =>$v['department_date']);
                        $v['manager_date'] = is_null($v['manager_date']) ? "" : $v['manager_date'];
                        $data[$k]['manager'] = array('status' => $v['manager'], 'reason' => $v['manager_reason'], 'date' =>$v['manager_date']);
                        $v['purchase_date'] = is_null($v['purchase_date']) ? "" : $v['purchase_date'];
                        $data[$k]['purchase'] = array('status' => $v['purchase'], 'reason' => '', 'date' =>$v['purchase_date']);
                        $v['warehouse_date'] = is_null($v['warehouse_date']) ? "" : $v['warehouse_date'];
                        $data[$k]['warehouse'] = array('status' => $v['warehouse'], 'reason' => '', 'date' =>$v['warehouse_date']);

                        $data[$k]['status'] = $v['status'];
                        //不可以撤销
                        if ($v['group_leader'] == 1 && $v['department'] == 1 && $v['manager'] == 1 && $v['purchase'] == 3)
                        {
                            $data[$k]['canCancle'] = -1;
                        }
                        //可以撤销
                        else
                        {
                            $data[$k]['canCancle'] = 0;
                        }

                        if(!empty($v['rejecter_position']))
                        {
                            //$data[$k][$v['rejecter_position']] = array('status' => -1, 'reason' => $v['reason'], 'date' =>$v['rejecter_position'.'_date']);
                            $data[$k][$v['rejecter_position']]['status'] = -1;
                            $data[$k][$v['rejecter_position']]['reason'] = $v['reason'];
                        }
                    }
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('purchaseTrack params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            else
            {
                try {
                    $startDate = $message_data['params']['queryData']['startDate'];
                    $endDate = $message_data['params']['queryData']['endDate'];
                    $where_data = "";
                    $where_data = !empty($startDate) && !empty($endDate) ? "applicant_date > '$startDate 00:00:00' and applicant_date < '$endDate 23:59:59'" : $where_data;
                    if ($where_data == "")
                    {
                        // $where_data = !empty($message_data['params']['queryData']['startDate']) ? "applicant_date > '$message_data['params']['queryData']['startDate'] 00:00:00'" : $where_data;
                        $where_data = !empty($startDate) ? "applicant_date > '$startDate 00:00:00'" : $where_data;
                        $where_data = !empty($endDate) ? "applicant_date < '$endDate 23:59:59'" : $where_data;
                    }
                    // $sql = "select purchase_applicant_id,applicant,applicant_date,group_leader,group_leader_date,department,department_date,manager,manager_date,purchase,purchase_date,warehouse,warehouse_date,rejecter,rejecter_position,reason,group_leader_reason,department_reason,manager_reason,isCancle from purchase_track where applicant = '{$message_data['params']['applicant']}' order by applicant_date desc limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    // bug
                    $sql = "select purchase_applicant_id,applicant,applicant_date,group_leader,group_leader_date,department,department_date,manager,manager_date,purchase,purchase_date,warehouse,warehouse_date,rejecter,rejecter_position,reason from purchase_track where ".$where_data." order by applicant_date desc limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $purchaseTrack_data = self::$db->query($sql);
                    $data = array();
                    foreach ($purchaseTrack_data as $k => $v)
                    {
                        $data[$k]['purchase_applicant_id'] = $v['purchase_applicant_id'];
                        $v['applicant_date'] = is_null($v['applicant_date']) ? "" : $v['applicant_date'];
                        $data[$k]['personal'] = array('status' => $v['applicant'], 'reason' => '', 'date' =>$v['applicant_date']);
                        $v['group_leader_date'] = is_null($v['group_leader_date']) ? "" : $v['group_leader_date'];
                        $data[$k]['group_leader'] = array('status' => $v['group_leader'], 'reason' => '', 'date' =>$v['group_leader_date']);
                        $v['department_date'] = is_null($v['department_date']) ? "" : $v['department_date'];
                        $data[$k]['department'] = array('status' => $v['department'], 'reason' => '', 'date' =>$v['department_date']);
                        $v['manager_date'] = is_null($v['manager_date']) ? "" : $v['manager_date'];
                        $data[$k]['manager'] = array('status' => $v['manager'], 'reason' => '', 'date' =>$v['manager_date']);
                        $v['purchase_date'] = is_null($v['purchase_date']) ? "" : $v['purchase_date'];
                        $data[$k]['purchase'] = array('status' => $v['purchase'], 'reason' => '', 'date' =>$v['purchase_date']);
                        $v['warehouse_date'] = is_null($v['warehouse_date']) ? "" : $v['warehouse_date'];
                        $data[$k]['warehouse'] = array('status' => $v['warehouse'], 'reason' => '', 'date' =>$v['warehouse_date']);

                        $data[$k]['status'] = $v['status'];
                        //不可以撤销
                        if ($v['group_leader'] == 1 && $v['department'] == 1 && $v['manager'] == 1 && $v['purchase'] == 3)
                        {
                            $data[$k]['canCancle'] = -1;
                        }
                        //可以撤销
                        else
                        {
                            $data[$k]['canCancle'] = 0;
                        }

                        if(!empty($v['rejecter_position']))
                        {
                            //$data[$k][$v['rejecter_position']] = array('status' => -1, 'reason' => $v['reason'], 'date' =>$v['rejecter_position'.'_date']);
                            $data[$k][$v['rejecter_position']]['status'] = -1;
                            $data[$k][$v['rejecter_position']]['reason'] = $v['reason'];
                        }
                    }
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('purchaseTrack params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //历史采购
            case 'purchaseHistory':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    //bug 缺少arrived_on和每个物料状态
                    $sql = "select a.applicant,a.status,a.purchase_applicant_id,o.purchase_order_id,o.contract_num,a.created_on  from purchase_applicant a left join purchase_order o on a.purchase_applicant_id = o.purchase_applicant_id  where a.applicant = '{$message_data['params']['applicant']}' limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $purchase_order_id_data = self::$db->query($sql);
                    foreach ($purchase_order_id_data as $k => $v)
                    {
                        $getMaterialList_data = self::$db->select('material_name,model,brand,project_num,unit,number,expected_date,remark')->from('purchase_material')->where("purchase_applicant_id = '{$v['purchase_applicant_id']}'")->query();
                        $purchase_order_id_data[$k]['materialList'] = $getMaterialList_data;
                    }
                    $sql = "select count(*)  from purchase_applicant a left join purchase_order o on a.purchase_applicant_id = o.purchase_applicant_id  where a.applicant = '{$message_data['params']['applicant']}'";
                    $total = self::$db->query($sql);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('purchaseHistory params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            else
            {
                try {
                    //bug 缺少arrived_on和每个物料状态
                    $startDate = $message_data['params']['queryData']['startDate'];
                    $endDate = $message_data['params']['queryData']['endDate'];
                    $queryInput = $message_data['params']['queryData']['queryInput'];

                    $where_data = "";
                    $where_data = !empty($startDate) && !empty($endDate) ? "a.created_on > '$startDate 00:00:00' and a.created_on < '$endDate 23:59:59'" : $where_data;
                    if ($where_data == "")
                    {
                        $where_data = !empty($startDate) ? "a.created_on > '$startDate 00:00:00'" : $where_data;
                        $where_data = !empty($endDate) ? "a.created_on < '$endDate 23:59:59'" : $where_data;
                    }
                    if ($where_data == "")
                    {
                        $where_data = !empty($queryInput) ? "a.purchase_applicant_id = '$queryInput'" : $where_data;
                    }
                    else
                    {
                        $where_data = !empty($queryInput) ? " and a.purchase_applicant_id = '$queryInput'" : $where_data;
                    }

                    $sql = "select a.applicant,a.purchase_applicant_id,o.purchase_order_id,o.contract_num,a.created_on  from purchase_applicant a left join purchase_order o on a.purchase_applicant_id = o.purchase_applicant_id  where ".$where_data." limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $purchase_order_id_data = self::$db->query($sql);
                    foreach ($purchase_order_id_data as $k => $v)
                    {
                        $getMaterialList_data = self::$db->select('material_name,model,brand,project_num,unit,number,expected_date,remark')->from('purchase_material')->where("purchase_applicant_id = '{$v['purchase_applicant_id']}'")->query();
                        $purchase_order_id_data[$k]['materialList'] = $getMaterialList_data;
                    }
                    $sql = "select count(*)  from purchase_applicant a left join purchase_order o on a.purchase_applicant_id = o.purchase_applicant_id  where ".$where_data." limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $total = self::$db->query($sql);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('purchaseHistory params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "total" => $total[0]['count(*)'],
                                                "data" => $purchase_order_id_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //获取采购指派人
            case 'getAssignList':
            try {
                //获取除了张智丰以外的所有人
                $purchase_list = self::$db->select('userName')->from('users')->where("access = 5")->query();
                foreach ($purchase_list as $k => $v)
                {
                    if ($v['userName'] == '张智丰')
                    {
                        unset($purchase_list[$k]);
                    }
                }
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "查询失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('getAssignList params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "查询成功",
                                                "data" => $purchase_list));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //指派人
            case 'sendAssign':
            try {
                self::$db->beginTrans();
                $applicant_data = self::$db->select('applicant')->from('purchase_applicant')->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                // $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$applicant_data[0]['applicant'],'bill'=>$message_data['params']['purchase_applicant_id'],'approver'=>$message_data['params']['assignPerson'],'message'=>'采购申请'))->query();
                //消息推送为已读
                $update_sendmessage = self::$db->update('sendmessage')->cols(array('status'=>1))->where("bill = '{$message_data['params']['purchase_applicant_id']}' and approver = '张智丰'")->query();
                //更新当前审核人和采购指派人
                $update_purchase_applicant = self::$db->update('purchase_applicant')->cols(array('purchase'=>$message_data['params']['assignPerson'], 'current_approver'=>$message_data['params']['assignPerson']))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "指派失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('sendAssign params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "指派成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //采购审核 获取审核列表
            case 'getPurchaseListCheck':
            //获取审核人列表
            $access = self::$db->select('access')->from('users')->where("userName = '{$message_data['params']['userName']}'")->query();
            $approver = array(1 => 'admin', 2 => 'manager', 3 => 'department', 4 => 'warehouse', 5 => 'purchase', 6 => 'group_leader');

            foreach ($approver as $k => $v)
            {
                if($k == $access[0]['access'])
                {
                    $position = $v;
                    break;
                }
            }

            $sequences = array('admin' => 0, 'group_leader' => 1,'department' => 2,'manager' => 3,'purchase' => 4,'warehouse' => 5);

            foreach ($sequences as $k => $v)
            {
                if($k == $position)
                {
                    $sequence = $v;
                    break;
                }
            }

            if ($message_data['params']['queryData'] == '')
            {
                try {
                    //组长，部长，总经理 显示track中的status
                    if ($position == 'group_leader' || $position == 'department' || $position == 'manager')
                    {
                        $sql = "select purchase_applicant.purchase_applicant_id,purchase_applicant.applicant,purchase_track.$position as status,purchase_applicant.created_on from purchase_applicant,purchase_track where purchase_applicant.purchase_applicant_id = purchase_track.purchase_applicant_id and purchase_applicant.status != -1 and purchase_track.sequence >= $sequence limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                        $getPurchaseListCheck_data = self::$db->query($sql);
                    }
                    //采购，库管 显示purchase_applicant中的status
                    else
                    {
                        if ($message_data['params']['userName'] == '张智丰' || $message_data['params']['userName'] == '姚威')
                        {
                            $sql = "select purchase_applicant.purchase_applicant_id,purchase_applicant.purchase,purchase_applicant.applicant,purchase_applicant.created_on,purchase_applicant.status from purchase_applicant,purchase_track where purchase_applicant.purchase_applicant_id = purchase_track.purchase_applicant_id and purchase_applicant.status != -1 and purchase_track.sequence >= $sequence limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                        }
                        else
                        {
                            $sql = "select purchase_applicant.purchase_applicant_id,purchase_applicant.purchase,purchase_applicant.applicant,purchase_applicant.created_on,purchase_applicant.status from purchase_applicant,purchase_track where purchase_applicant.purchase = '{$message_data['params']['userName']}' and purchase_applicant.purchase_applicant_id = purchase_track.purchase_applicant_id and purchase_applicant.status != -1 and purchase_track.sequence >= $sequence limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                        }
                        $getPurchaseListCheck_data = self::$db->query($sql);
                        foreach ($getPurchaseListCheck_data as &$value)
                        {
                            if($value['purchase'] == '张智丰')
                            {
                                $value['isAssign'] = '0';
                                unset($value['purchase']);
                            }
                            else
                            {
                                $value['isAssign'] = '1';
                                unset($value['purchase']);
                            }
                        }
                    }
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getPurchaseListCheck params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            else
            {
                try {
                    $status = $message_data['params']['queryData']['status'];
                    $applicant = $message_data['params']['queryData']['applicant'];
                    $where_data = "";
                    //组长，部长，总经理 显示track中的status
                    if ($position == 'group_leader' || $position == 'department' || $position == 'manager')
                    {
                        if ($status == '0')
                        {
                            $where_data = "purchase_track.$position = '0'";
                        }
                        elseif ($status == "")
                        {
                            $where_data = "";
                        }
                        else
                        {
                            $where_data = "purchase_track.$position != '0'";
                        }

                        if ($where_data == "")
                        {
                            if ($applicant != "")
                            {
                                $where_data .= " purchase_track.applicant = '$applicant'";
                            }
                            else
                            {
                            }
                        }
                        else
                        {
                            if ($applicant != "")
                            {
                                $where_data .= " and purchase_track.applicant = '$applicant'";
                            }
                            else
                            {
                            }
                        }

                        $sql = "select purchase_applicant.purchase_applicant_id,purchase_applicant.applicant,purchase_track.$position as status,purchase_applicant.created_on from purchase_applicant,purchase_track where purchase_applicant.purchase_applicant_id = purchase_track.purchase_applicant_id and purchase_applicant.status != -1 and purchase_track.sequence >= $sequence and ".$where_data." limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                        $getPurchaseListCheck_data = self::$db->query($sql);
                    }
                    //采购，库管 显示purchase_applicant中的status
                    else
                    {
                        if ($status == '0')
                        {
                            $where_data = "purchase_applicant.status = '0'";
                        }
                        elseif ($status == "")
                        {
                            $where_data = "";
                        }
                        else
                        {
                            $where_data = "purchase_applicant.status != '0'";
                        }

                        if ($where_data == "")
                        {
                            if ($applicant != "")
                            {
                                $where_data .= " purchase_applicant.applicant = '$applicant'";
                            }
                            else
                            {
                            }
                        }
                        else
                        {
                            if ($applicant != "")
                            {
                                $where_data .= " and purchase_applicant.applicant = '$applicant'";
                            }
                            else
                            {
                            }
                        }

                        $sql = "select purchase_applicant.purchase_applicant_id,purchase_applicant.purchase,purchase_applicant.applicant,purchase_applicant.created_on,purchase_applicant.status from purchase_applicant,purchase_track where purchase_applicant.purchase_applicant_id = purchase_track.purchase_applicant_id and purchase_applicant.status != -1 and purchase_track.sequence >= $sequence and ".$where_data." limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                        $getPurchaseListCheck_data = self::$db->query($sql);
                        foreach ($getPurchaseListCheck_data as &$value)
                        {
                            if($value['purchase'] == '张智丰')
                            {
                                $value['isAssign'] = '0';
                                unset($value['purchase']);
                            }
                            else
                            {
                                $value['isAssign'] = '1';
                                unset($value['purchase']);
                            }
                        }
                    }
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getPurchaseListCheck params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "total" => count($getPurchaseListCheck_data, 0),
                                                "data" => $getPurchaseListCheck_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //审核操作 获取物料信息
            case 'getMaterialList':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    // $sql = "select material_name,model,brand,project_num,unit,number,remark from  purchase_applicant,purchase_order where purchase_applicant.purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}' and purchase_applicant.purchase_applicant_id = purchase_order.purchase_applicant_id";
                    // $getMaterialList_data = self::$db->query($sql);
                    $getMaterialList_data = self::$db->select('material_code,material_name,model,brand,project_num,unit,number,expected_date,remark')->from('purchase_material')->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getMaterialList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $getMaterialList_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //审核操作 查看采购下单信息
            case 'viewMaterialList':
            try {
                // $viewMaterialList_data = self::$db->select('purchase_applicant_id,purchase_order_id,contract_num,created_on')->from('purchase_order')->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                $sql = "select purchase_order.purchase_applicant_id,purchase_order.purchase_order_id,purchase_order.contract_num,purchase_order.created_on,purchase_applicant.status from  purchase_applicant,purchase_order where purchase_applicant.purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}' and purchase_applicant.purchase_applicant_id = purchase_order.purchase_applicant_id";
                $viewMaterialList_data = self::$db->query($sql);
                $materialList_data = self::$db->select('material_code,material_name,model,supplier,supplier_num,project_num,unit,number,batch,unit_price,total_price,noRateTotal,rate,ratePrice,invoice,manufactor,brand,created_on,arrived_on,remark')->from('order_material')->where("purchase_order_id = '{$viewMaterialList_data[0]['purchase_order_id']}'")->query();
                // $materialList_data = self::$db->select('material_code,material_name,model,sn_num,supplier,supplier_num,project_num,unit,number,batch,unit_price,total_price,rate,invoice,manufactor,brand,created_on,arrived_on,remark')->from('order_material')->where("purchase_order_id = '{$viewMaterialList_data[0]['purchase_order_id']}' and status = 0")->query();
                $viewMaterialList_data['materialList'] = $materialList_data;
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "获取失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('viewMaterialList params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $viewMaterialList_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //审核操作 提交物料审核
            case 'checkMaterial':
            //添加日志
            $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['userName'],'type'=>PURCHASE_NOINO))->query();
            //消息推送为已读
            $update_sendmessage = self::$db->update('sendmessage')->cols(array('status'=>1))->where("bill = '{$message_data['params']['purchase_applicant_id']}' and approver = '{$message_data['params']['userName']}'")->query();
            //获取审核人列表
            $approver_data = self::$db->select('group_leader,department,manager,purchase,warehouse')->from('purchase_applicant')->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
            $approvers = array($approver_data[0]['group_leader'], $approver_data[0]['department'], $approver_data[0]['manager'], $approver_data[0]['purchase'], $approver_data[0]['warehouse']);

            foreach ($approvers as $k => $v)
            {
                if($v == $message_data['params']['userName'])
                {
                    $index = $k + 1;
                    break;
                }
            }

            if ($message_data['params']['userName'] == '霍舒豪' && $approver_data[0]['group_leader'] == '霍舒豪' && $approver_data[0]['department'] == '霍舒豪')
            {
                $index += 1;
            }

            foreach ($approver_data as $approver)
            {
                foreach ($approver as $k => $v)
                {
                    if($v == $message_data['params']['userName'])
                    {
                        $position = $k;
                        break;
                    }
                }
            }

            if ($message_data['params']['userName'] == '霍舒豪' && $approver_data[0]['group_leader'] == '霍舒豪' && $approver_data[0]['department'] == '霍舒豪')
            {
                $position = 'department';
            }

            $sequences = array('group_leader' => 1,'department' => 2,'manager' => 3,'purchase' => 4,'warehouse' => 5);

            foreach ($sequences as $k => $v)
            {
                if($k == $position)
                {
                    $sequence = $v;
                    break;
                }
            }

                //审核通过
            try {
                if ($message_data['params']['result'] == '1')
                {
                    self::$db->beginTrans();
                    //如果是总经理，purchase_applicant中的status为1
                    if ($position == 'manager')
                    {
                        $update_applicant = self::$db->update('purchase_applicant')->cols(array('status'=>2))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                        //消息推送给采购
                        $applicant_data = self::$db->select('applicant,purchase')->from('purchase_applicant')->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                        $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$applicant_data[0]['applicant'],'bill'=>$message_data['params']['purchase_applicant_id'],'approver'=>$applicant_data[0]['purchase'],'message'=>'采购申请'))->query();
                        $update_track = self::$db->update('purchase_track')->cols(array('purchase'=>2))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                    }
                    // //如果是采购，purchase_applicant中的status为2
                    // elseif ($position == 'purchase')
                    // {
                    //     $update_applicant = self::$db->update('purchase_applicant')->cols(array('status'=>2))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                    // }
                    else
                    {
                        $update_applicant = self::$db->update('purchase_applicant')->cols(array('current_approver'=>$approvers[$index]))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                    }

                    //更新purchase_track中的status和时间
                    $date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
                    $update_track = self::$db->update('purchase_track')->cols(array($position=>$message_data['params']['result'], $position.'_date'=>$date, $position.'_reason'=>$message_data['params']['reason'], 'sequence'=>$sequence+1 ))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();


                    self::$db->commitTrans();
                }
                else
                {
                    self::$db->beginTrans();
                    //更新purchase_applicant中的status为-1
                    $update_applicant = self::$db->update('purchase_applicant')->cols(array('status'=>-1))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                    //更新purchase_track中的rejecter和reason,status和时间
                    $date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
                    $update_track = self::$db->update('purchase_track')->cols(array($position=>$message_data['params']['result'], $position.'_date'=>$date, 'rejecter'=>$message_data['params']['userName'], 'rejecter_position'=>$position, 'reason'=>$message_data['params']['reason'], 'sequence'=>$sequence))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                    //消息推送到申请人
                    $applicant_data = self::$db->select('applicant')->from('purchase_applicant')->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                    $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$message_data['params']['userName'],'bill'=>$message_data['params']['purchase_applicant_id'],'approver'=>$applicant_data[0]['applicant'],'message'=>'拒绝采购申请'))->query();
                    self::$db->commitTrans();
                }
            } catch (Exception $e){
                self::$db->rollBackTrans();
                //添加消息推送
                $sendmessage = self::$db->select('applicant,bill,message')->from('sendmessage')->where("approver = '{$message_data['params']['userName']}' and status = 0")->query();
                $resData = array("resData" => array("result" => -1,
                                                    "sendMessage" => $sendmessage,
                                                    "msg" => "提交失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('checkMaterial params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            //添加消息推送
            $sendmessage = self::$db->select('applicant,bill,message')->from('sendmessage')->where("approver = '{$message_data['params']['userName']}' and status = 0")->query();
            $resData = array("resData" => array("result" => 0,
                                                "sendMessage" => $sendmessage,
                                                "msg" => "提交成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //采购下单 获取订单信息
            case 'getOrder':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    $getMaterialList_data = self::$db->select('material_name,model,brand,project_num,unit,number,expected_date,remark')->from('purchase_material')->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getOrder params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $getMaterialList_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //采购下单 提交订单信息
            case 'commitOrder':
            try {
                $date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
                self::$db->beginTrans();
                //消息推送为已读
                $applicant_data = self::$db->select('applicant,purchase,warehouse')->from('purchase_applicant')->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$applicant_data[0]['purchase'],'type'=>PURCHASE_ORDER))->query();
                $update_sendmessage = self::$db->update('sendmessage')->cols(array('status'=>1))->where("bill = '{$message_data['params']['purchase_applicant_id']}' and approver = '{$applicant_data[0]['purchase']}'")->query();
                //插入到采购订单表
                $insert_purchase_order = self::$db->insert('purchase_order')->cols(array('purchase_applicant_id'=>$message_data['params']['purchase_applicant_id'],'purchase_order_id'=>$message_data['params']['purchase_order_id'],'contract_num'=>$message_data['params']['contract_num'],'created_on'=>$message_data['params']['created_on']))->query();
                //插入到订单物料表
                foreach ($message_data['params']['materialList'] as $value)
                {
                    $value['purchase_order_id'] = $message_data['params']['purchase_order_id'];
                    $value['created_on'] = $date;
                    $insert_order_material = self::$db->insert('order_material')->cols($value)->query();
                }
                //发送消息给库管
                $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$applicant_data[0]['applicant'],'bill'=>$message_data['params']['purchase_order_id'],'approver'=>$applicant_data[0]['warehouse'],'message'=>'申请已下单'))->query();
                //更新purchase_track的采购，采购时间
                $update_track = self::$db->update('purchase_track')->cols(array('purchase'=>3, 'purchase_date'=>$date, 'sequence'=>5))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();
                //更新purchase_applicant的status
                $update_applicant = self::$db->update('purchase_applicant')->cols(array('status'=>3))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}'")->query();

                //添加消息推送
                $sendmessage = self::$db->select('applicant,bill,message')->from('sendmessage')->where("approver = '{$message_data['params']['userName']}' and status = 0")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();

                $pos = strpos($e->getMessage(), '\'');
                $text = substr($e->getMessage(), $pos+1);
                $pos1 = strpos($text, '\'');
                $text = substr($text, 0, -strlen($text)+$pos1);

                $resData = array("resData" => array("result" => -1,
                                                    // "material_code" => $text,
                                                    "msg" => "提交失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('commitOrder params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "sendMessage" => $sendmessage,
                                                "msg" => "提交成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/**
 * 库管接口
 */

            //采购入库 获取物料列表
            case 'depotInputList':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    $sql = "select a.applicant,a.purchase_applicant_id,o.purchase_order_id,o.contract_num,a.created_on from purchase_applicant a, purchase_order o where (a.status = 3 or a.status =4) and a.purchase_applicant_id = o.purchase_applicant_id limit {$message_data['params']['start']},{$message_data['params']['limit']};";
                    $purchase_order_id_data = self::$db->query($sql);
                    foreach ($purchase_order_id_data as $k => $v)
                    {
                        // $getMaterialList_data = self::$db->select('material_name,material_code,supplier,supplier_num,model,project_num,unit,number,batch,manufactor,brand,unit_price,remark,status,stock_position')->from('order_material')->where("purchase_order_id = '{$v['purchase_order_id']}'")->query();
                        // $sn_num_data = self::$db->select('sn_num')->from('order_material')->where("purchase_order_id = '{$v['purchase_order_id']}'")->query();
                        $sql = "select o.purchase_order_id, o.material_name,o.material_code,o.supplier,o.supplier_num,o.model,o.project_num,o.unit,o.number,o.batch,o.manufactor,o.brand,o.unit_price,o.remark,o.status,o.stock_position,m.sn_num from order_material o inner join material m on o.purchase_order_id = m.purchase_order_id  and o.material_code = m.material_code;";
                        $getMaterialList_data = self::$db->query($sql);
                        if(empty($getMaterialList_data))
                        {
                            $getMaterialList_data = self::$db->select('purchase_order_id,material_name,material_code,supplier,supplier_num,model,project_num,unit,number,batch,manufactor,brand,unit_price,remark,status,stock_position')->from('order_material')->where("purchase_order_id = '{$v['purchase_order_id']}'")->query();
                        }
                        else
                        {
                            $getMaterialList1_data = self::$db->select('purchase_order_id,material_name,material_code,supplier,supplier_num,model,project_num,unit,number,batch,manufactor,brand,unit_price,remark,status,stock_position')->from('order_material')->where("purchase_order_id = '{$v['purchase_order_id']}'")->query();
                            foreach ($getMaterialList_data as $key => $value)
                            {
                                foreach ($getMaterialList1_data as $k1 => $v1)
                                {
                                    if ($value['purchase_order_id'] == $v1['purchase_order_id'])
                                    {
                                        unset($getMaterialList1_data[$k1]);
                                    }
                                }
                            }
                            $getMaterialList_data = array_merge($getMaterialList_data, $getMaterialList1_data);
                        }
                        if(empty($getMaterialList_data))
                            unset($purchase_order_id_data[$k]);
                        else
                            $purchase_order_id_data[$k]['materialList'] = $getMaterialList_data;

                        $count = 0;
                        foreach ($getMaterialList_data as $key => $value)
                        {
                            if($value['status'] == '0')
                            {
                                $count++;
                            }
                        }
                        if ($count == 0)
                        {
                            $purchase_order_id_data[$k]['orderStatus'] = 1;
                        }
                        elseif ($count == $key+1)
                        {
                            $purchase_order_id_data[$k]['orderStatus'] = 0;
                        }
                        else
                        {
                            $purchase_order_id_data[$k]['orderStatus'] = 2;
                        }
                    }
                    $purchase_order_id_data = array_values($purchase_order_id_data);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('depotInputList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            else
            {
                try {
                    $status = $message_data['params']['queryData']['status'];
                    $applicant = $message_data['params']['queryData']['applicant'];
                    $queryInput = $message_data['params']['queryData']['queryInput'];
                    $where_data = "";

                    if ($status == '0')
                    {
                        $where_data = "a.status = '3'";
                    }
                    elseif ($status == "1")
                    {
                        $where_data = "a.status = '4'";
                    }
                    else
                    {
                        $where_data = "";
                    }

                    if ($where_data == "")
                    {
                        if ($queryInput != "")
                        {
                            if (substr($queryInput,0, 4) == 'CGSQ')
                            {
                                $where_data .= " a.purchase_applicant_id = '$queryInput'";
                            }
                            else
                            {
                                $where_data .= " a.applicant = '$queryInput'";
                            }
                        }
                        else
                        {
                        }
                    }
                    else
                    {
                        if ($queryInput != "")
                        {
                            if (substr($queryInput,0, 4) == 'CGSQ')
                            {
                                $where_data .= " and a.purchase_applicant_id = '$queryInput'";
                            }
                            else
                            {
                                $where_data .= " and a.applicant = '$queryInput'";
                            }
                        }
                        else
                        {
                        }
                    }

                    $sql = "select a.applicant,a.purchase_applicant_id,o.purchase_order_id,o.contract_num,a.created_on from purchase_applicant a, purchase_order o where  a.purchase_applicant_id = o.purchase_applicant_id and ".$where_data." limit {$message_data['params']['start']},{$message_data['params']['limit']};";
                    $purchase_order_id_data = self::$db->query($sql);
                    foreach ($purchase_order_id_data as $k => $v)
                    {
                        $getMaterialList_data = self::$db->select('material_name,material_code,supplier,supplier_num,model,project_num,unit,number,batch,manufactor,brand,unit_price,remark,status,stock_position')->from('order_material')->where("purchase_order_id = '{$v['purchase_order_id']}'")->query();
                        if(empty($getMaterialList_data))
                            unset($purchase_order_id_data[$k]);
                        else
                            $purchase_order_id_data[$k]['materialList'] = $getMaterialList_data;

                        $count = 0;
                        foreach ($getMaterialList_data as $key => $value)
                        {
                            if($value['status'] == '0')
                            {
                                $count++;
                            }
                        }
                        if ($count == 0)
                        {
                            $purchase_order_id_data[$k]['orderStatus'] = 1;
                        }
                        elseif ($count == $key+1)
                        {
                            $purchase_order_id_data[$k]['orderStatus'] = 0;
                        }
                        else
                        {
                            $purchase_order_id_data[$k]['orderStatus'] = 2;
                        }
                    }
                    $purchase_order_id_data = array_values($purchase_order_id_data);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('depotInputList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "total" => count($purchase_order_id_data, 0),
                                                "data" => $purchase_order_id_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //采购入库 确认收料
            case 'commitDepotInput':
            try {
                $date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['userName'],'type'=>CONFIRM_MATERIAL))->query();
                foreach ($message_data['params']['materialList'] as $v)
                {
                    $update_order_material = self::$db->update('order_material')->cols(array('stock_position'=>$v['stock_position'], 'status'=>1, 'arrived_on'=>$date))->where("material_code = '{$v['material_code']}'")->query();
                    //放到库存中
                    //bug 获取sn_num
                    $material_data = self::$db->select('material_name,material_code,supplier,supplier_num,model,project_num,unit,batch,manufactor,brand,unit_price,number as stock_number')->from('order_material')->where("material_code = '{$v['material_code']}' and status = 1")->query();

                    $material_data[0]['stock_position'] = $v['stock_position'];
                    $material_data[0]['sn_num'] = $v['sn_num'];
                    $material_data[0]['purchase_order_id'] = $v['purchase_order_id'];
                    $insert_material = self::$db->insert('material')->cols($material_data[0])->query();

                    $sql = "select DISTINCT a.purchase_order_id,a.purchase_applicant_id from order_material o,purchase_order a where o.material_code = '{$v['material_code']}' and o.purchase_order_id = a.purchase_order_id";
                    $purchase_order_id_data = self::$db->query($sql);
                    $update_track = self::$db->update('purchase_track')->cols(array('warehouse'=>4,'warehouse_date'=>$date))->where("purchase_applicant_id = '{$purchase_order_id_data[0]['purchase_applicant_id']}'")->query();
                    $update_applicant = self::$db->update('purchase_applicant')->cols(array('status'=>4))->where("purchase_applicant_id = '{$purchase_order_id_data[0]['purchase_applicant_id']}'")->query();
                    //收料信息推送给申请人
                    $applicant_data = self::$db->select('applicant')->from('purchase_applicant')->where("purchase_applicant_id = '{$purchase_order_id_data[0]['purchase_applicant_id']}'")->query();
                    $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$message_data['params']['userName'],'bill'=>$purchase_order_id_data[0]['purchase_applicant_id'],'approver'=>$applicant_data[0]['applicant'],'message'=>$v['material_code'].'已到货'))->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "收料失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('commitDepotInput params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "收料成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //领料出库 获取物料列表
            case 'depotOutputList':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    //获取审核通过的id
                    $sql = "select distinct material_requisition_id from material_requisition where status = 1";
                    $get_requisition_id_data = self::$db->query($sql);
                    foreach ($get_requisition_id_data as $k => $v)
                    {
                        $get_applicant_data = self::$db->select('applicant,applicant_date,picking_status as status')->from('material_requisition')->where("material_requisition_id = '{$v['material_requisition_id']}'")->limit(1)->query();
                        $get_requisition_id_data[$k]['applicant'] = $get_applicant_data[0]['applicant'];
                        $get_requisition_id_data[$k]['applicant_date'] = $get_applicant_data[0]['applicant_date'];
                        $get_requisition_id_data[$k]['status'] = $get_applicant_data[0]['status'];
                        // $getMaterialList_data = self::$db->select('material_code,material_name,model,sn_num,project_num,unit,number,remark,picking_status as status')->from('material_requisition')->where("material_requisition_id = '{$v['material_requisition_id']}'")->query();
                        $sql1 = "select r.material_code,r.material_name,r.model,m.sn_num,r.sn_num as selectedSn,r.project_num,r.unit,r.number,r.remark,r.picking_status as status from material_requisition r ,material m where r.material_code = m.material_code and r.applicant = '{$get_applicant_data[0]['applicant']}' and material_requisition_id = '{$v['material_requisition_id']}';";
                        $getMaterialList_data = self::$db->query($sql1);
                        $get_requisition_id_data[$k]['materialList'] = $getMaterialList_data;
                    }
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('depotOutputList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "total" => $k+1,
                                                "data" => $get_requisition_id_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //领料出库 确认领料
            case 'commitDepotOutput':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    self::$db->beginTrans();
                    foreach ($message_data['params'] as $value)
                    {
                        foreach ($value['materialList'] as $v)
                        {
                            $update_material_requisition = self::$db->update('material_requisition')->cols(array('picking_status'=>1, 'sn_num'=>$v['selectedSn']))->where("material_code = '{$v['material_code']}' and material_requisition_id = '{$value['material_requisition_id']}'")->query();
                            //把库存的sn号去掉
                            $sql = "select id,m.sn_num from material m where m.material_code = '{$v['material_code']}' and m.purchase_order_id  in (select distinct purchase_order_id from material_requisition);";
                            $su_num_data = self::$db->query($sql);
                            if ($su_num_data[0]['sn_num'] != '无' || $su_num_data[0]['sn_num'] != '')
                            {
                                $array_su_num = explode(',',$su_num_data[0]['sn_num']);
                                $array_selectedSn = explode(',',$v['selectedSn']);
                                $res = unique_array($array_su_num, $array_selectedSn);
                                $sn_num = '';
                                foreach ($res as  $arr)
                                {
                                    $sn_num .= $arr . ',';
                                }
                                $sn_num = substr($sn_num,0,-1);
                                $update_material = self::$db->update('material')->cols(array('sn_num'=>$sn_num))->where("id = '{$su_num_data[0]['id']}'")->query();
                            }
                            else
                            {
                                continue;
                            }

                            //更新库存数据
                            // $number_data = self::$db->select('number')->from('material_requisition')->where("material_code = '{$v}'")->query();
                            // $sql = "update material set stock_number = stock_number - {$number_data[0]['number']} where material_code = {$v}";
                            // $update_material = self::$db->query($sql);
                        }

                        $applicant_data = self::$db->select('applicant')->from('material_requisition')->where("material_requisition_id = '{$value['material_requisition_id']}'")->limit(1)->query();
                        //推送给申请人
                        $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$message_data['userName'],'bill'=>$value['material_requisition_id'],'approver'=>$applicant_data[0]['applicant'],'message'=>'确认领料'))->query();
                    }
                    self::$db->commitTrans();
                } catch (Exception $e){
                    self::$db->rollBackTrans();
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('depotInputList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "total" => count($get_requisition_id_data, 0),
                                                "data" => $get_requisition_id_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //退料审核 获取物料列表
            case 'returnGoodsList':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    //获取审核通过的id
                    $sql = "select distinct material_return_id from material_return where status = 1";
                    $get_requisition_id_data = self::$db->query($sql);
                    foreach ($get_requisition_id_data as $k => $v)
                    {
                        $get_applicant_data = self::$db->select('applicant,applicant_date,material_requisition_id,picking_status as status')->from('material_return')->where("material_return_id = '{$v['material_return_id']}'")->limit(1)->query();
                        $get_requisition_id_data[$k]['applicant'] = $get_applicant_data[0]['applicant'];
                        $get_requisition_id_data[$k]['applicant_date'] = $get_applicant_data[0]['applicant_date'];
                        $get_requisition_id_data[$k]['status'] = $get_applicant_data[0]['status'];
                        //$get_requisition_id_data[$k]['material_requisition_id'] = $get_applicant_data[0]['material_requisition_id'];
                        // $sql1 = "select r.material_code,r.material_name,r.model,m.sn_num,r.sn_num as selectedSn,r.project_num,r.unit,r.number,r.remark,r.picking_status as status from material_return r ,material_requisition m where r.material_code = m.material_code and r.applicant = '{$get_applicant_data[0]['applicant']}' and material_return_id = '{$v['material_return_id']}';";
                        $sql1 = "select r.material_requisition_id,r.material_code,r.material_name,r.model,m.sn_num,r.sn_num as selectedSn,r.project_num,r.unit,r.number,r.remark,r.picking_status as status from material_return r ,material_requisition m where r.material_code = m.material_code and r.applicant = '{$get_applicant_data[0]['applicant']}' and r.material_return_id = '{$v['material_return_id']}' and r.material_requisition_id = m.material_requisition_id;";
                        $getMaterialList_data = self::$db->query($sql1);
                        // $getMaterialList_data = self::$db->select('material_code,material_name,model,sn_num,project_num,unit,number,remark,picking_status as status')->from('material_return')->where("material_return_id = '{$v['material_return_id']}'")->query();
                        //bug 为什么limit1
                        // $getMaterialList_data = self::$db->select('material_code,material_name,model,sn_num,project_num,unit,number,remark,picking_status as status')->from('material_return')->where("material_return_id = '{$v['material_return_id']}'")->limit(1)->query();
                        $get_requisition_id_data[$k]['materialList'] = $getMaterialList_data;
                    }
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('returnGoodsList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "total" => $k+1,
                                                "data" => $get_requisition_id_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //退料审核 确认退料
            case 'commitReturnGoods':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    self::$db->beginTrans();
                    foreach ($message_data['params']['materialList'] as $value)
                    {
                        foreach ($value['materialList'] as $v)
                        {
                            $update_material_requisition = self::$db->update('material_return')->cols(array('picking_status'=>1, 'sn_num'=>$v['selectedSn']))->where("material_code = '{$v['material_code']}' and material_requisition_id = '{$v['material_requisition_id']}'")->query();
                            //更新库存数据
                            // $number_data = self::$db->select('number')->from('material_return')->where("material_code = '{$v}'")->query();
                            // $sql = "update material set stock_number = stock_number + {$number_data[0]['number']} where material_code = {$v}";
                            // $update_material = self::$db->query($sql);
                            //把库存的sn号加上
                            $sql = "select id,m.sn_num from material m where m.material_code = '{$v['material_code']}' and m.purchase_order_id  in (select distinct purchase_order_id from material_requisition where material_requisition.material_requisition_id in (select distinct material_requisition_id from material_return));";
                            $su_num_data = self::$db->query($sql);
                            if ($su_num_data[0]['sn_num'] != '无')
                            {
                                $sn_num = '';
                                $sn_num = $su_num_data[0]['sn_num'] != '' ? $su_num_data[0]['sn_num'] . ',' . $v['selectedSn'] : $v['selectedSn'];
                                $update_material = self::$db->update('material')->cols(array('sn_num'=>$sn_num))->where("id = '{$su_num_data[0]['id']}'")->query();
                            }
                            else
                            {
                                continue;
                            }
                        }

                            //var_dump($update_material);
                        $applicant_data = self::$db->select('applicant')->from('material_return')->where("material_return_id = '{$value['material_return_id']}'")->limit(1)->query();
                        //推送给申请人
                        $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$message_data['userName'],'bill'=>$value['material_return_id'],'approver'=>$applicant_data[0]['applicant'],'message'=>'确认退料'))->query();
                    }
                    self::$db->commitTrans();
                } catch (Exception $e){
                    self::$db->rollBackTrans();
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('commitReturnGoods params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "total" => $k+1,
                                                "data" => $get_requisition_id_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/**
 * 我的接口
 */
            //我的接口 加载采购申请数据
            case 'loadPurchaseReqList':
            try {
                $sql = "select o.purchase_order_id,o.purchase_applicant_id,o.contract_num from purchase_applicant a, purchase_order o where o.purchase_applicant_id = a.purchase_applicant_id and a.applicant = '{$message_data['params']['userName']}'";
                $purchase_order_id_data = self::$db->query($sql);
                foreach ($purchase_order_id_data as $k => $v)
                {
                    $getMaterialList_data = self::$db->select('material_code,material_name,model,brand,project_num,unit,number,remark,status as materialStatus')->from('order_material')->where("purchase_order_id = '{$v['purchase_order_id']}'")->query();
                    $count = 0;
                    foreach ($getMaterialList_data as $key => $value)
                    {
                        if($value['materialStatus'] == '0')
                        {
                            $count++;
                        }

                        if ($value['number'] <= 0)
                        {
                            unset($getMaterialList_data[$key]);
                        }
                    }
                    if ($count == 0)
                    {
                        $purchase_order_id_data[$k]['orderStatus'] = 1;
                    }
                    elseif ($count == $key+1)
                    {
                        $purchase_order_id_data[$k]['orderStatus'] = 0;
                    }
                    else
                    {
                        $purchase_order_id_data[$k]['orderStatus'] = 2;
                    }

                    $purchase_order_id_data[$k]['materialList'] = $getMaterialList_data;

                    $purchase_order_id_data = array_values($purchase_order_id_data);
                }
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "获取失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('loadPurchaseReqList params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $purchase_order_id_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //我的接口 生成领料申请单
            case 'createPickReqOrder':
            try {
                $date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['userName'],'type'=>MATERIAL_APPLICANT))->query();
                foreach ($message_data['params']['materialList'] as $v)
                {
                    $v['current_approver'] = $message_data['params']['approver']['group_leader'];
                    $v['group_leader'] = $message_data['params']['approver']['group_leader'];
                    $v['department'] = $message_data['params']['approver']['department'];
                    $v['material_requisition_id'] = $message_data['params']['material_requisition_id'];
                    $v['applicant_date'] = $date;
                    $v['applicant'] = $message_data['params']['userName'];
                    $insert_material_requisition = self::$db->insert('material_requisition')->cols($v)->query();

                    $sql = "update material set stock_number = stock_number - {$v['number']} where material_code = '{$v['material_code']}' and purchase_order_id = '{$v['purchase_order_id']}'";
                    $update_material = self::$db->query($sql);

                    //削减库存物料
                    $sql1 = "update order_material set number = number - {$v['number']} where purchase_order_id = '{$v['purchase_order_id']}' and material_code = '{$v['material_code']}'";
                    $update_order_material = self::$db->query($sql1);
                }
                $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$message_data['params']['userName'],'bill'=>$message_data['params']['material_requisition_id'],'approver'=>$message_data['params']['approver']['group_leader'],'message'=>'领料申请'))->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "提交失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('createPickReqOrder params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => "提交成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //我的接口 获取领料申请列表
            case 'getPickGoodsList':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    $access = self::$db->select('access')->from('users')->where("userName = '{$message_data['params']['userName']}'")->query();
                    $approver = array(1 => 'admin', 2 => 'manager', 3 => 'department', 4 => 'warehouse', 5 => 'purchase', 6 => 'group_leader');

                    foreach ($approver as $k => $v)
                    {
                        if($k == $access[0]['access'])
                        {
                            $position = $v;
                            break;
                        }
                    }

                    if ($position == 'group_leader')
                    {
                        $sql = "select  distinct material_requisition_id,applicant,applicant_date,status as orderStatus,group_leader_status as checkStatus from material_requisition where applicant =  '{$message_data['params']['userName']}' or group_leader = '{$message_data['params']['userName']}' and status != -2 limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    elseif ($position == 'department')
                    {
                        $sql = "select  distinct material_requisition_id,applicant,applicant_date,status as orderStatus,department_status as checkStatus from material_requisition where applicant =  '{$message_data['params']['userName']}' or department = '{$message_data['params']['userName']}' and status != -2 limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    else
                    {
                        $sql = "select  distinct material_requisition_id,applicant,applicant_date,status as orderStatus from material_requisition where applicant =  '{$message_data['params']['userName']}' limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }

                    $getPickGoodsList_data = self::$db->query($sql);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getPickGoodsList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            //bug 搜索
            else
            {
                try {
                    $access = self::$db->select('access')->from('users')->where("userName = '{$message_data['params']['userName']}'")->query();
                    $approver = array(1 => 'admin', 2 => 'manager', 3 => 'department', 4 => 'warehouse', 5 => 'purchase', 6 => 'group_leader');

                    foreach ($approver as $k => $v)
                    {
                        if($k == $access[0]['access'])
                        {
                            $position = $v;
                            break;
                        }
                    }

                    $queryInput = $message_data['params']['queryData']['queryInput'];
                    $where_data = "";

                    if ($queryInput != "")
                    {
                        if (substr($queryInput,0, 4) == 'LLSQ')
                        {
                            $where_data .= " material_requisition_id = '$queryInput'";
                        }
                        else
                        {
                            $where_data .= " applicant = '$queryInput'";
                        }
                    }

                    if ($position == 'group_leader')
                    {
                        $sql = "select  distinct material_requisition_id,applicant,applicant_date,status as orderStatus,group_leader_status as checkStatus from material_requisition where  ".$where_data." and status != -2 limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    elseif ($position == 'department')
                    {
                        $sql = "select  distinct material_requisition_id,applicant,applicant_date,status as orderStatus,department_status as checkStatus from material_requisition where  ".$where_data." and status != -2 limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    else
                    {
                        $sql = "select  distinct material_requisition_id,applicant,applicant_date,status as orderStatus from material_requisition where  ".$where_data." limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    $getPickGoodsList_data = self::$db->query($sql);
                }catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getPickGoodsList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }

            $resData = array("resData" => array("result" => 0,
                                                "total" => count($getPickGoodsList_data, 0),
                                                "data" => $getPickGoodsList_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //我的接口 查看订单物料信息
            case 'viewReqMaterial':
            try {
                $getMaterialList_data = self::$db->select('material_code,material_name,model,sn_num,project_num,unit,number,remark')->from('material_requisition')->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "获取失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('viewReqMaterial params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $getMaterialList_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //我的接口 审核订单物料信息
            case 'checkReqMaterial':
            try {
                //send message
                //update current_approver
                //通过和不通过成功失败
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['userName'],'type'=>PURCHASE_NOINO))->query();
                //消息推送为已读
                $update_sendmessage = self::$db->update('sendmessage')->cols(array('status'=>1))->where("bill = '{$message_data['params']['material_requisition_id']}' and approver = '{$message_data['params']['userName']}'")->query();
                //获取审核人列表
                $approver_data = self::$db->select('group_leader,department')->from('material_requisition')->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                $approvers = array($approver_data[0]['group_leader'], $approver_data[0]['department']);

                foreach ($approver_data as $approver)
                {
                    foreach ($approver as $k => $v)
                    {
                        if($v == $message_data['params']['userName'])
                        {
                            $position = $k;
                            break;
                        }
                    }
                }

                if ($message_data['params']['result'] == '1')
                {
                    //如果是部长，purchase_applicant中的status为1
                    if ($position == 'department')
                    {
                        $update_applicant = self::$db->update('material_requisition')->cols(array('status'=>1))->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                        //消息推送给库管
                        $applicant_data = self::$db->select('applicant,material_requisition_id')->from('material_requisition')->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                        $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$applicant_data[0]['applicant'],'bill'=>$message_data['params']['material_requisition_id'],'approver'=>'姚威','message'=>'领料申请'))->query();
                        //消息推送给库管
                        $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$applicant_data[0]['applicant'],'bill'=>$message_data['params']['material_requisition_id'],'approver'=>$applicant_data[0]['applicant'],'message'=>'领料申请已通过'))->query();
                    }
                    //组长
                    else
                    {
                        $update_applicant = self::$db->update('material_requisition')->cols(array('current_approver'=>$approver_data[0]['department']))->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                        //消息推送给部长
                        $applicant_data = self::$db->select('applicant,material_requisition_id')->from('material_requisition')->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                        $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$applicant_data[0]['applicant'],'bill'=>$message_data['params']['material_requisition_id'],'approver'=>$approver_data[0]['department'],'message'=>'领料申请'))->query();
                    }

                    //更新
                    $update_status = self::$db->update('material_requisition')->cols(array($position.'_status'=>1))->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                }
                else
                {
                    //更新purchase_applicant中的status为-1
                    $update_applicant = self::$db->update('material_requisition')->cols(array('status'=>-1))->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                    //更新purchase_track中的rejecter和reason,status和时间
                    //$date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
                    $update_track = self::$db->update('material_requisition')->cols(array('status'=>$message_data['params']['result'], $position.'_status'=>-1, 'rejecter'=>$message_data['params']['userName'], 'reason'=>$message_data['params']['reason']))->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                    //消息推送到申请人
                    $applicant_data = self::$db->select('applicant')->from('material_requisition')->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                    //bug 申请人和受理人颠倒
                    $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$message_data['params']['userName'],'bill'=>$message_data['params']['material_requisition_id'],'approver'=>$applicant_data[0]['applicant'],'message'=>'拒绝领料申请'))->query();


                    //库存数据恢复
                    {
                        $material_data = self::$db->select('material_code,number')->from('material_requisition')->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}'")->query();
                        foreach ($variable as $value)
                        {
                            $sql = "update material set stock_number = stock_number + {$value['number']} where material_code = '{$value['material_code']}'";
                            $update_material = self::$db->query($sql);

                            $sql1 = "update order_material set number = number + {$value['number']} where material_code = '{$value['material_code']}'";
                            $update_order_material = self::$db->query($sql1);
                        }
                    }
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "提交失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('checkReqMaterial params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "提交成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //我的接口 加载已领料申请数据
            case 'loadPickedMaterialList':
            try {
                //获取已领料的id
                $sql = "select distinct material_requisition_id,purchase_order_id,applicant,applicant_date from material_requisition where applicant = '{$message_data['params']['userName']}' and picking_status = 1";
                $material_requisition_id_data = self::$db->query($sql);
                foreach ($material_requisition_id_data as $k => $v)
                {
                    $getMaterialList_data = self::$db->select('material_code,material_name,model,sn_num,project_num,unit,number,remark')->from('material_requisition')->where("material_requisition_id = '{$v['material_requisition_id']}'")->query();
                    $material_requisition_id_data[$k]['materialList'] = $getMaterialList_data;
                }
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "获取失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('loadPickedMaterialList params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $material_requisition_id_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //我的接口 查看退料数据
            case 'viewReturnMaterial':
            try {
                $getMaterialList_data = self::$db->select('material_code,material_name,model,sn_num,project_num,unit,number,remark')->from('material_return')->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "获取失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('viewReturnMaterial params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $getMaterialList_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //我的接口 生成退料申请单
            case 'createReturnMaterialOrder':
            try {
                $date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['userName'],'type'=>MATERIAL_APPLICANT))->query();
                foreach ($message_data['params']['materialList'] as $v)
                {
                    $v['current_approver'] = $message_data['params']['approver']['group_leader'];
                    $v['group_leader'] = $message_data['params']['approver']['group_leader'];
                    $v['department'] = $message_data['params']['approver']['department'];
                    $v['material_return_id'] = $message_data['params']['material_return_id'];
                    $v['applicant_date'] = $date;
                    $v['applicant'] = $message_data['params']['userName'];
                    // $insert_material_return = self::$db->insert('material_return')->cols($v)->query();

                    $sql = "update order_material set number = number + {$v['number']} where purchase_order_id = '{$v['purchase_order_id']}' and material_code = '{$v['material_code']}'";
                    $update_order_material = self::$db->query($sql);
                    //削减库存物料
                    $sql1 = "update material set stock_number = stock_number + {$v['number']} where purchase_order_id = '{$v['purchase_order_id']}' and material_code = '{$v['material_code']}'";
                    $update_material = self::$db->query($sql1);
                    unset($v['purchase_order_id']);
                    $insert_material_return = self::$db->insert('material_return')->cols($v)->query();
                }
                $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$message_data['params']['userName'],'bill'=>$message_data['params']['material_return_id'],'approver'=>$message_data['params']['approver']['group_leader'],'message'=>'退料申请'))->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "提交失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('createReturnMaterialOrder params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => "提交成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //我的接口 获取退料申请列表
            case 'getReturnGoodsList':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    // $sql = "select DISTINCT material_return_id,applicant,applicant_date,status from material_return where applicant = '{$message_data['params']['userName']}'";
                    // $getReturnGoodsList_data = self::$db->query($sql);

                    // $sql1 = "select DISTINCT material_return_id,applicant,applicant_date,group_leader_status as status from material_return where group_leader = '{$message_data['params']['userName']}'";
                    // $getReturnGoodsList_data1 = self::$db->query($sql1);

                    // $sql2 = "select DISTINCT material_return_id,applicant,applicant_date,department_status as status from material_return where current_approver = '{$message_data['params']['userName']}' and department = '{$message_data['params']['userName']}'";
                    // $getReturnGoodsList_data2 = self::$db->query($sql2);

                    // $data = array_merge($getReturnGoodsList_data,$getReturnGoodsList_data1,$getReturnGoodsList_data2);


                    $access = self::$db->select('access')->from('users')->where("userName = '{$message_data['params']['userName']}'")->query();
                    $approver = array(1 => 'admin', 2 => 'manager', 3 => 'department', 4 => 'warehouse', 5 => 'purchase', 6 => 'group_leader');

                    foreach ($approver as $k => $v)
                    {
                        if($k == $access[0]['access'])
                        {
                            $position = $v;
                            break;
                        }
                    }

                    if ($position == 'group_leader')
                    {
                        $sql = "select  distinct material_return_id,applicant,applicant_date,status as orderStatus,group_leader_status as checkStatus from material_return where applicant =  '{$message_data['params']['userName']}' or group_leader = '{$message_data['params']['userName']}' and status != -2 limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    elseif ($position == 'department')
                    {
                        $sql = "select  distinct material_return_id,applicant,applicant_date,status as orderStatus,department_status as checkStatus from material_return where applicant =  '{$message_data['params']['userName']}' or department = '{$message_data['params']['userName']}' and status != -2 limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    else
                    {
                        $sql = "select  distinct material_return_id,applicant,applicant_date,status as orderStatus from material_return where applicant =  '{$message_data['params']['userName']}' limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }

                    $getReturnGoodsList_data = self::$db->query($sql);

                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getReturnGoodsList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            //bug 搜索
            else
            {
                try {
                    $access = self::$db->select('access')->from('users')->where("userName = '{$message_data['params']['userName']}'")->query();
                    $approver = array(1 => 'admin', 2 => 'manager', 3 => 'department', 4 => 'warehouse', 5 => 'purchase', 6 => 'group_leader');

                    foreach ($approver as $k => $v)
                    {
                        if($k == $access[0]['access'])
                        {
                            $position = $v;
                            break;
                        }
                    }

                    $queryInput = $message_data['params']['queryData']['queryInput'];
                    $where_data = "";

                    if ($queryInput != "")
                    {
                        if (substr($queryInput,0, 4) == 'LLSQ')
                        {
                            $where_data .= " material_return_id = '$queryInput'";
                        }
                        else
                        {
                            $where_data .= " applicant = '$queryInput'";
                        }
                    }

                    if ($position == 'group_leader')
                    {
                        $sql = "select  distinct material_return_id,applicant,applicant_date,status as orderStatus,group_leader_status as checkStatus from material_return where  ".$where_data." and status != -2 limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    elseif ($position == 'department')
                    {
                        $sql = "select  distinct material_return_id,applicant,applicant_date,status as orderStatus,department_status as checkStatus from material_return where  ".$where_data." and status != -2 limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    else
                    {
                        $sql = "select  distinct material_return_id,applicant,applicant_date,status as orderStatus from material_return where  ".$where_data." limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    }
                    $getReturnGoodsList_data = self::$db->query($sql);
                }catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getPickGoodsList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }

            }

            $resData = array("resData" => array("result" => 0,
                                                "total" => count($getReturnGoodsList_data, 0),
                                                "data" => $getReturnGoodsList_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //我的接口 审核订单退料信息
            case 'checkReturnMaterial':
            try {
                //send message
                //update current_approver
                //通过和不通过成功失败
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['userName'],'type'=>RETURN_MATERIAL_REVIEW))->query();
                //消息推送为已读
                $update_sendmessage = self::$db->update('sendmessage')->cols(array('status'=>1))->where("bill = '{$message_data['params']['material_return_id']}' and approver = '{$message_data['params']['userName']}'")->query();
                //获取审核人列表
                $approver_data = self::$db->select('group_leader,department')->from('material_return')->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                $approvers = array($approver_data[0]['group_leader'], $approver_data[0]['department']);

                foreach ($approver_data as $approver)
                {
                    foreach ($approver as $k => $v)
                    {
                        if($v == $message_data['params']['userName'])
                        {
                            $position = $k;
                            break;
                        }
                    }
                }

                if ($message_data['params']['result'] == '1')
                {
                    //如果是部长，purchase_applicant中的status为1
                    if ($position == 'department')
                    {
                        $update_applicant = self::$db->update('material_return')->cols(array('status'=>1))->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                        //消息推送给库管
                        $applicant_data = self::$db->select('applicant,material_return_id')->from('material_return')->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                        $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$applicant_data[0]['applicant'],'bill'=>$message_data['params']['material_return_id'],'approver'=>'姚威','message'=>'退料申请'))->query();
                        //消息推送给库管
                        $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$applicant_data[0]['applicant'],'bill'=>$message_data['params']['material_return_id'],'approver'=>$applicant_data[0]['applicant'],'message'=>'退料申请已通过'))->query();
                    }
                    //组长
                    else
                    {
                        $update_applicant = self::$db->update('material_return')->cols(array('current_approver'=>$approver_data[0]['department']))->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                        //消息推送给部长
                        $applicant_data = self::$db->select('applicant,material_return_id')->from('material_return')->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                        $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$applicant_data[0]['applicant'],'bill'=>$message_data['params']['material_return_id'],'approver'=>$approver_data[0]['department'],'message'=>'退料申请'))->query();
                    }

                    //更新
                    $update_status = self::$db->update('material_return')->cols(array($position.'_status'=>1))->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                }
                else
                {
                    //更新purchase_applicant中的status为-1
                    $update_applicant = self::$db->update('material_return')->cols(array('status'=>-1))->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                    //更新purchase_track中的rejecter和reason,status和时间
                    //$date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
                    $update_track = self::$db->update('material_return')->cols(array('status'=>$message_data['params']['result'], $position.'_status'=>-1, 'rejecter'=>$message_data['params']['userName'], 'reason'=>$message_data['params']['reason']))->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                    //消息推送到申请人
                    $applicant_data = self::$db->select('applicant')->from('material_return')->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                    $insert_sendmessage = self::$db->insert('sendmessage')->cols(array('applicant'=>$message_data['params']['userName'],'bill'=>$message_data['params']['material_return_id'],'approver'=>$applicant_data[0]['applicant'],'message'=>'拒绝退料申请'))->query();
                    //库存数据恢复
                    {
                        $material_data = self::$db->select('material_code,number')->from('material_return')->where("material_return_id = '{$message_data['params']['material_return_id']}'")->query();
                        foreach ($material_data as $value)
                        {
                            $sql = "update material set stock_number = stock_number - {$value['number']} where material_code = '{$value['material_code']}'";
                            $update_material = self::$db->query($sql);

                            $sql1 = "update order_material set number = number - {$value['number']} where material_code = '{$value['material_code']}'";
                            $update_order_material = self::$db->query($sql1);
                        }
                    }
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "提交失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('checkReturnMaterial params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => "提交成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //库存查询
            case 'depotRequest':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    // $getMaterialList_data = self::$db->select('material_code,material_name,model,sn_num,supplier,supplier_num,project_num,unit,stock_number,brand,manufactor,batch,unit_price,stock_position')->from('material')->query();
                    $sql = "select material_code,material_name,model,sn_num,supplier,supplier_num,project_num,unit,stock_number,brand,manufactor,batch,unit_price,stock_position from material limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $getMaterialList_data = self::$db->query($sql);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('depotRequest params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            //bug 搜索
            else
            {
                try {
                    // $getMaterialList_data = self::$db->select('material_code,material_name,model,sn_num,supplier,supplier_num,project_num,unit,stock_number,brand,manufactor,batch,unit_price,stock_position')->from('material')->query();
                    $sql = "select material_code,material_name,model,sn_num,supplier,supplier_num,project_num,unit,stock_number,brand,manufactor,batch,unit_price,stock_position from material where material_code = '{$message_data['params']['queryData']['material_code']}' limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $getMaterialList_data = self::$db->query($sql);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('depotRequest params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            $resData = array("resData" => array("result" => 0,
                                                "total" => count($getMaterialList_data, 0),
                                                "data" => $getMaterialList_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/**
 * 基础信息接口
 */
            //获取物料信息
            case 'getMaterialInfo':
            if ($message_data['params']['queryData'] == '')
            {
                try {

                    $sql = "select * from material_info ORDER BY id DESC limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $getMaterialInfo_data = self::$db->query($sql);
                    $sql1 = "select count(*) from material_info";
                    $total = self::$db->query($sql1);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getMaterialInfo params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            else
            {
                try {
                    $startDate = $message_data['params']['queryData']['startDate'];
                    $endDate = $message_data['params']['queryData']['endDate'];
                    $userName = $message_data['params']['queryData']['userName'];
                    $where_data = "";
                    $where_data = !empty($startDate) && !empty($endDate) ? "operateDate > '$startDate 00:00:00' and operateDate < '$endDate 23:59:59'" : $where_data;
                    if ($where_data == "")
                    {
                        // $where_data = !empty($message_data['params']['queryData']['startDate']) ? "applicant_date > '$message_data['params']['queryData']['startDate'] 00:00:00'" : $where_data;
                        $where_data = !empty($startDate) ? "operateDate > '$startDate 00:00:00'" : $where_data;
                        $where_data = !empty($endDate) ? "operateDate < '$endDate 23:59:59'" : $where_data;
                    }
                    if ($where_data == "")
                    {
                        $where_data .= !empty($userName) ? "operator = '$userName'" : "";
                    }
                    else
                    {
                        $where_data .= !empty($userName) ? " and operator = '$userName'" : "";
                    }
                    $sql = "select operator,type,operateDate from log where ".$where_data." ORDER BY id DESC limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $log_data = self::$db->query($sql);
                    $sql1 = "select count(*) from log where ".$where_data;
                    $total = self::$db->query($sql1);

                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getMaterialInfo params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }

            }

            $resData = array("resData" => array("result" => 0,
                                                "total" => $total[0]['count(*)'],
                                                "data" => $getMaterialInfo_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //添加物料信息
            case 'addMaterialInfo':
            try {
                self::$db->beginTrans();
                //添加日志
                // $insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>ADD_MATERIALINFO))->query();
                $insert_material_info = self::$db->insert('material_info')->cols($message_data['params'])->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $pos = strpos($e->getMessage(), '\'');
                $text = substr($e->getMessage(), $pos+1);
                $pos1 = strpos($text, '\'');
                $text = substr($text, 0, -strlen($text)+$pos1);

                $resData = array("resData" => array("result" => -1,
                                                    "material_code" => $text,
                                                    "msg" => "添加失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('addMaterialInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "添加成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //添加物料
            case 'addMaterial':
            try {
                self::$db->beginTrans();
                //添加日志
                // $insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>ADD_MATERIALINFO))->query();
                foreach ($message_data['params']['materialList'] as $value)
                {
                    $insert_material_info = self::$db->insert('material')->cols($value)->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "添加失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('addMaterial params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "添加成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //修改物料信息
            case 'updateMaterialInfo':
            try {
                $material_code = $message_data['params']['material_code'];
                unset($message_data['params']['material_code']);
                self::$db->beginTrans();
                //添加日志
                // $insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>FIX_MATERIALINFO))->query();
                $update_updateMaterialInfo = self::$db->update('material_info')->cols($message_data['params'])->where("material_code = '{$material_code}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "修改失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('updateMaterialInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "修改成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //删除物料信息
            case 'deleteMaterialInfo':
            try {
                self::$db->beginTrans();
                //添加日志
                // $insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>DELETE_MATERIALINFO))->query();
                $delte_user = self::$db->delete('material_info')->where("material_code = '{$message_data['params']['material_code']}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "删除失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('deleteMaterialInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "删除成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;


            //获取供应商信息
            case 'getSupplierInfo':
            if ($message_data['params']['queryData'] == '')
            {
                try {

                    $sql = "select * from supplier_info ORDER BY id DESC limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $getSupplierInfo_data = self::$db->query($sql);
                    $sql1 = "select count(*) from supplier_info";
                    $total = self::$db->query($sql1);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getSupplierInfo params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            else
            {
                try {
                    $startDate = $message_data['params']['queryData']['startDate'];
                    $endDate = $message_data['params']['queryData']['endDate'];
                    $userName = $message_data['params']['queryData']['userName'];
                    $where_data = "";
                    $where_data = !empty($startDate) && !empty($endDate) ? "operateDate > '$startDate 00:00:00' and operateDate < '$endDate 23:59:59'" : $where_data;
                    if ($where_data == "")
                    {
                        // $where_data = !empty($message_data['params']['queryData']['startDate']) ? "applicant_date > '$message_data['params']['queryData']['startDate'] 00:00:00'" : $where_data;
                        $where_data = !empty($startDate) ? "operateDate > '$startDate 00:00:00'" : $where_data;
                        $where_data = !empty($endDate) ? "operateDate < '$endDate 23:59:59'" : $where_data;
                    }
                    if ($where_data == "")
                    {
                        $where_data .= !empty($userName) ? "operator = '$userName'" : "";
                    }
                    else
                    {
                        $where_data .= !empty($userName) ? " and operator = '$userName'" : "";
                    }
                    $sql = "select operator,type,operateDate from log where ".$where_data." ORDER BY id DESC limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $log_data = self::$db->query($sql);
                    $sql1 = "select count(*) from log where ".$where_data;
                    $total = self::$db->query($sql1);

                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getSupplierInfo params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }

            }

            $resData = array("resData" => array("result" => 0,
                                                "total" => $total[0]['count(*)'],
                                                "data" => $getSupplierInfo_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //添加供应商信息
            case 'addSupplierInfo':
            try {
                self::$db->beginTrans();
                //添加日志
                // $insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>ADD_MATERIALINFO))->query();
                $insert_supplier_info = self::$db->insert('supplier_info')->cols($message_data['params'])->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $pos = strpos($e->getMessage(), '\'');
                $text = substr($e->getMessage(), $pos+1);
                $pos1 = strpos($text, '\'');
                $text = substr($text, 0, -strlen($text)+$pos1);

                $resData = array("resData" => array("result" => -1,
                                                    "supplier_num" => $text,
                                                    "msg" => "添加失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('addSupplierInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "添加成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //修改供应商信息
            case 'updateSupplierInfo':
            try {
                $supplier_num = $message_data['params']['supplier_num'];
                unset($message_data['params']['supplier_num']);
                self::$db->beginTrans();
                //添加日志
                //$insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>FIX_MATERIALINFO))->query();
                $update_updateSupplierInfo = self::$db->update('supplier_info')->cols($message_data['params'])->where("supplier_num = '{$supplier_num}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "修改失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('updateSupplierInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "修改成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //删除供应商信息
            case 'deleteSupplierInfo':
            try {
                self::$db->beginTrans();
                //添加日志
                //$insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>DELETE_MATERIALINFO))->query();
                $delte_supplier = self::$db->delete('supplier_info')->where("supplier_num = '{$message_data['params']['supplier_num']}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "删除失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('deleteSupplierInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "删除成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;


            //获取供应商信息
            case 'getProjectInfo':
            if ($message_data['params']['queryData'] == '')
            {
                try {

                    $sql = "select * from project ORDER BY id DESC limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $getProjectInfo_data = self::$db->query($sql);
                    $sql1 = "select count(*) from project";
                    $total = self::$db->query($sql1);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getProjectInfo params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            else
            {
                try {
                    $startDate = $message_data['params']['queryData']['startDate'];
                    $endDate = $message_data['params']['queryData']['endDate'];
                    $userName = $message_data['params']['queryData']['userName'];
                    $where_data = "";
                    $where_data = !empty($startDate) && !empty($endDate) ? "operateDate > '$startDate 00:00:00' and operateDate < '$endDate 23:59:59'" : $where_data;
                    if ($where_data == "")
                    {
                        // $where_data = !empty($message_data['params']['queryData']['startDate']) ? "applicant_date > '$message_data['params']['queryData']['startDate'] 00:00:00'" : $where_data;
                        $where_data = !empty($startDate) ? "operateDate > '$startDate 00:00:00'" : $where_data;
                        $where_data = !empty($endDate) ? "operateDate < '$endDate 23:59:59'" : $where_data;
                    }
                    if ($where_data == "")
                    {
                        $where_data .= !empty($userName) ? "operator = '$userName'" : "";
                    }
                    else
                    {
                        $where_data .= !empty($userName) ? " and operator = '$userName'" : "";
                    }
                    $sql = "select operator,type,operateDate from log where ".$where_data." ORDER BY id DESC limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $log_data = self::$db->query($sql);
                    $sql1 = "select count(*) from log where ".$where_data;
                    $total = self::$db->query($sql1);

                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('getProjectInfo params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }

            }

            $resData = array("resData" => array("result" => 0,
                                                "total" => $total[0]['count(*)'],
                                                "data" => $getProjectInfo_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //添加供应商信息
            case 'addProjectInfo':
            try {
                self::$db->beginTrans();
                //添加日志
                // $insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>ADD_MATERIALINFO))->query();
                $insert_project_info = self::$db->insert('project')->cols($message_data['params'])->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $pos = strpos($e->getMessage(), '\'');
                $text = substr($e->getMessage(), $pos+1);
                $pos1 = strpos($text, '\'');
                $text = substr($text, 0, -strlen($text)+$pos1);

                $resData = array("resData" => array("result" => -1,
                                                    "project_num" => $text,
                                                    "msg" => "添加失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('addProjectInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "添加成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //修改供应商信息
            case 'updateProjectInfo':
            try {
                $project_num = $message_data['params']['project_num'];
                unset($message_data['params']['project_num']);
                self::$db->beginTrans();
                //添加日志
                //$insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>FIX_MATERIALINFO))->query();
                $update_updateProjectInfo = self::$db->update('project')->cols($message_data['params'])->where("project_num = '{$project_num}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "修改失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('updateProjectInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "修改成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //删除供应商信息
            case 'deleteProjectInfo':
            try {
                self::$db->beginTrans();
                //添加日志
                //$insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>DELETE_MATERIALINFO))->query();
                $delte_project = self::$db->delete('project')->where("project_num = '{$message_data['params']['project_num']}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "删除失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('deleteProjectrInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "删除成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/**
 * 系统管理接口
 */
            //获取用户列表
            case 'usersList':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    $sql = "select userName,password,phone,access,data_permissions,department from users limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $usersList_data = self::$db->query($sql);
                    foreach ($usersList_data as &$value)
                    {
                        $value['data_permissions'] = unserialize($value['data_permissions']);
                    }
                    unset($value);
                    $sql = "select count(*) from users";
                    $total = self::$db->query($sql);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('usersList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            else
            {
                try {
                    $usersList_data = self::$db->select('userName,password,phone,access,data_permissions,department')->from('users')->where("userName = '{$message_data['params']['queryData']['userName']}'")->query();
                    foreach ($usersList_data as &$value)
                    {
                        $value['data_permissions'] = unserialize($value['data_permissions']);
                    }
                    unset($value);
                    $total[0]["count(*)"] = 1;
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('usersList params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }

            }
            $resData = array("resData" => array("result" => 0,
                                                "total" => $total[0]["count(*)"],
                                                "data" => $usersList_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //添加用户
            case 'addUser':
            $date = gmdate("Y-m-d H:i:s", time() + 8 * 3600);
            try {
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>ADD_USER))->query();
                $insert_users = self::$db->insert('users')->cols(array('userName'=>$message_data['params']['userName'],'password'=>$message_data['params']['password'],'phone'=>$message_data['params']['phone'],'access'=>$message_data['params']['access'],'data_permissions'=>serialize($message_data['params']['data_permissions']), 'department'=>$message_data['params']['department'], 'created_on'=>$date))->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "添加失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('addUser params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "添加成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //修改用户
            case 'updateUser':
            try {
                $userName = $message_data['params']['userName'];
                unset($message_data['params']['userName']);
                $message_data['params']['data_permissions'] = serialize($message_data['params']['data_permissions']);
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>FIX_USER_INFO))->query();
                $update_user = self::$db->update('users')->cols($message_data['params'])->where("userName = '{$userName}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "修改失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('updateUser params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "修改成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //删除用户
            case 'deleteUser':
            try {
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>'admin','type'=>DELETE_USER))->query();
                foreach ($message_data['params']['userNameArr'] as $value)
                {
                    $delte_user = self::$db->delete('users')->where("userName = '{$value}'")->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "删除失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('deleteUser params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "删除成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/**
 * 信息维护接口
 */
            //获取用户信息
            case 'getUserInfo':
            try {
                $userinfo_data = self::$db->select('phone,password,department')->from('users')->where("userName = '{$message_data['params']['userName']}'")->query();
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "获取失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('getUserInfo params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $userinfo_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //修改电话
            case 'updateUserPhone':
            try {
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['userName'],'type'=>FIX_PHONE))->query();
                $update_user = self::$db->update('users')->cols(array('phone' => $message_data['params']['newPhone']))->where("userName = '{$message_data['params']['userName']}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "修改失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('updateUserPhone params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => "修改成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //修改密码
            case 'updateUserPassword':
            try {
                self::$db->beginTrans();
                //添加日志
                $insert_log = self::$db->insert('log')->cols(array('operator'=>$message_data['params']['userName'],'type'=>FIX_PASSWORD))->query();
                $update_user = self::$db->update('users')->cols(array('password' => $message_data['params']['newPassword']))->where("userName = '{$message_data['params']['userName']}' and password = '{$message_data['params']['oldPassword']}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "密码错误"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('updateUserPassword params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => "修改成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/**
 * 系统日志接口
 */
            //获取用户操作日志
            case 'operationLog':
            if ($message_data['params']['queryData'] == '')
            {
                try {
                    //$log_data = self::$db->select('operator,type,operateDate')->from('log')->orderByDESC(array('id'))->limit(10)->query();

                    $sql = "select operator,type,operateDate from log ORDER BY id DESC limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $log_data = self::$db->query($sql);
                    $sql1 = "select count(*) from log";
                    $total = self::$db->query($sql1);
                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('operationLog params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }
            }
            else
            {
                try {
                    $startDate = $message_data['params']['queryData']['startDate'];
                    $endDate = $message_data['params']['queryData']['endDate'];
                    $userName = $message_data['params']['queryData']['userName'];
                    $where_data = "";
                    $where_data = !empty($startDate) && !empty($endDate) ? "operateDate > '$startDate 00:00:00' and operateDate < '$endDate 23:59:59'" : $where_data;
                    if ($where_data == "")
                    {
                        // $where_data = !empty($message_data['params']['queryData']['startDate']) ? "applicant_date > '$message_data['params']['queryData']['startDate'] 00:00:00'" : $where_data;
                        $where_data = !empty($startDate) ? "operateDate > '$startDate 00:00:00'" : $where_data;
                        $where_data = !empty($endDate) ? "operateDate < '$endDate 23:59:59'" : $where_data;
                    }
                    if ($where_data == "")
                    {
                        $where_data .= !empty($userName) ? "operator = '$userName'" : "";
                    }
                    else
                    {
                        $where_data .= !empty($userName) ? " and operator = '$userName'" : "";
                    }
                    $sql = "select operator,type,operateDate from log where ".$where_data." ORDER BY id DESC limit {$message_data['params']['start']},{$message_data['params']['limit']}";
                    $log_data = self::$db->query($sql);
                    $sql1 = "select count(*) from log where ".$where_data;
                    $total = self::$db->query($sql1);

                } catch (Exception $e){
                    $resData = array("resData" => array("result" => -1,
                                                        "msg" => "获取失败"));
                    Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                    print $e->getMessage();

                    self::$logger->error('operationLog params', $message_data['params']);
                    self::$logger->error($e->getMessage());
                    break;
                }

            }

            $resData = array("resData" => array("result" => 0,
                                                "total" => $total[0]['count(*)'],
                                                "data" => $log_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/**
 * 消息推送
 */
            //全部已读
            case 'readAllMessage':
            try {
                self::$db->beginTrans();
                $readAllMessage_data = self::$db->update('sendmessage')->cols(array('status'=>1))->where("approver = '{$message_data['params']['userName']}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "更新失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('readAllMessage params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "更新成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //单条信息已读
            case 'readMessage':
            try {
                self::$db->beginTrans();
                $sendmessage = self::$db->select('applicant,bill,message')->from('sendmessage')->where("approver = '{$message_data['params']['userName']}' and status = 0 and bill != '{$message_data['params']['bill']}'")->query();
                $readAllMessage_data = self::$db->update('sendmessage')->cols(array('status'=>1))->where("approver = '{$message_data['params']['userName']}' and bill = '{$message_data['params']['bill']}'")->query();
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "更新失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('readAllMessage params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "mag" => "更新成功",
                                                "sendMessage" => $sendmessage));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/**
 * 模糊查询
 */
            //查询项目号
            case 'queryProjectNum':
            try {
                $sql = "select project_num from project";
                $project_num_data = self::$db->query($sql);
                $data = array();
                foreach ($project_num_data as $value)
                {
                    $data[] = $value['project_num'];
                }
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "查询失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('queryProjectNum params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "查询成功",
                                                "projectNum" => $data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //查询物料信息
            case 'loadMaterialList':
            try {
                if ($message_data['params']['queryData'] == '')
                {
                    $sql = "select material_code,material_name,unit,model,manufactor,description from material_info";
                    $material_info_data = self::$db->query($sql);
                }
                else
                {
                    $sql = "select material_code,material_name,unit,model,manufactor,description from material_info where material_name like '%{$message_data['params']['queryData']['material_name']}%'";
                    $material_info_data = self::$db->query($sql);
                }
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "查询失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('loadMaterialList params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "查询成功",
                                                "data" => $material_info_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //查询供应商信息
            case 'loadSupplierList':
            try {
                if ($message_data['params']['queryData'] == '')
                {
                    $sql = "select supplier_name,supplier_num from supplier_info";
                    $material_info_data = self::$db->query($sql);
                }
                // else
                // {
                //     $sql = "select material_code,material_name,unit,model,manufactor,description from material_info where material_name like '%{$message_data['params']['queryData']['material_name']}%'";
                //     $material_info_data = self::$db->query($sql);
                // }
            } catch (Exception $e){
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "查询失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('loadSupplierList params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "查询成功",
                                                "data" => $material_info_data));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/*
撤销申请
 */
            //取消采购申请
            case 'canclePurchase':
            try {
                self::$db->beginTrans();
                {
                    $update_status = self::$db->update('purchase_applicant')->cols(array('status' => -1))->where("purchase_applicant_id = '{$message_data['params']['purchase_applicant_id']}' and applicant = '{$message_data['params']['applicant']}'")->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "撤销失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('canclePurchase params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "撤销成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //取消领料申请
            case 'canclePickApply':
            try {
                self::$db->beginTrans();
                {
                    $update_status = self::$db->update('material_requisition')->cols(array('status' => -2))->where("material_requisition_id = '{$message_data['params']['material_requisition_id']}' and applicant = '{$message_data['params']['applicant']}'")->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "撤销失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('canclePickApply params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "撤销成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //取消退料申请
            case 'cancleReturnApply':
            try {
                self::$db->beginTrans();
                {
                    $update_status = self::$db->update('material_return')->cols(array('status' => -2))->where("material_return_id = '{$message_data['params']['material_return_id']}' and applicant = '{$message_data['params']['applicant']}'")->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "撤销失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('cancleReturnApply params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "撤销成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

/*
借用归还模块
 */
            //获取借用列表

            case 'getBorrowList':
            try {
                self::$db->beginTrans();
                {
                    $getDepotMaterialList_data = self::$db->select('material_code,material_name,model,selectedSn,number,borrowDate,planReturnDate,actualReturnDate,borrowPeople,status,borrow_material_id')->from('borrow_material')->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "获取失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('getBorrowList params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $getDepotMaterialList_data,
                                                "total" => count($getDepotMaterialList_data, 0),
                                                "msg" => "获取成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
            break;

            //获取库存物料
            case 'getDepotMaterialList':
            try {
                self::$db->beginTrans();
                {
                    $getDepotMaterialList_data = self::$db->select('material_code,material_name,model,sn_num,stock_number,manufactor,id as borrow_material_id')->from('material')->where("project_num = 'public' and stock_number != 0")->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "获取失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('getDepotMaterialList params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "data" => $getDepotMaterialList_data,
                                                "msg" => "获取成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //提交借用物料
            case 'commitBorrowMaterial':
            try {
                self::$db->beginTrans();
                {
                    if ($message_data['params']['selectedSn'] == '')
                    {
                        $sql = "update material set stock_number = stock_number - {$message_data['params']['number']} where id = '{$message_data['params']['borrow_material_id']}'";
                        $material_info_data = self::$db->query($sql);
                    }
                    else
                    {
                        $su_num_data = self::$db->select('sn_num')->from('material')->where("id = '{$message_data['params']['borrow_material_id']}'")->query();
                        $array_su_num = explode(',',$su_num_data[0]['sn_num']);
                        $array_selectedSn = explode(',',$message_data['params']['selectedSn']);
                        $res = unique_array($array_su_num, $array_selectedSn);
                        $sn_num = '';
                        foreach ($res as  $arr)
                        {
                            $sn_num .= $arr . ',';
                        }
                        $sn_num = substr($sn_num,0,-1);
                        $sql = "update material set stock_number = stock_number - {$message_data['params']['number']} where id = '{$message_data['params']['borrow_material_id']}'";
                        $material_info_data = self::$db->query($sql);

                        $update_status = self::$db->update('material')->cols(array('sn_num' => $sn_num))->where("id = '{$message_data['params']['borrow_material_id']}'")->query();
                    }
                    $insert_BorrowMaterial = self::$db->insert('borrow_material')->cols($message_data['params'])->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "提交失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('commitBorrowMaterial params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "提交成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            //提交归还物料
            case 'returnMaterial':
            try {
                self::$db->beginTrans();
                {
                    //把库存的sn号加上
                    $su_num_data = self::$db->select('sn_num')->from('material')->where("id = '{$message_data['params']['borrow_material_id']}'")->query();
                    if ($su_num_data[0]['sn_num'] != '无')
                    {
                        if ($message_data['params']['selectedSn'] != '')
                        {
                            $sn_num = '';
                            $sn_num = $su_num_data[0]['sn_num'] != '' ? $su_num_data[0]['sn_num'] . ',' . $message_data['params']['selectedSn'] : $message_data['params']['selectedSn'];
                            $update_material = self::$db->update('material')->cols(array('sn_num'=>$sn_num))->where("id = '{$message_data['params']['borrow_material_id']}'")->query();
                        }
                    }
                    $sql = "update material set stock_number = stock_number + {$message_data['params']['number']} where id = '{$message_data['params']['borrow_material_id']}'";
                    $material_info_data = self::$db->query($sql);
                    $update_status = self::$db->update('borrow_material')->cols(array('status' => 1, 'actualReturnDate'=>$message_data['params']['actualReturnDate']))->where("material_code = '{$message_data['params']['material_code']}' and selectedSn = '{$message_data['params']['selectedSn']}' and borrowPeople = '{$message_data['params']['borrowPeople']}'")->query();
                }
                self::$db->commitTrans();
            } catch (Exception $e){
                self::$db->rollBackTrans();
                $resData = array("resData" => array("result" => -1,
                                                    "msg" => "提交失败"));
                Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));
                print $e->getMessage();

                self::$logger->error('returnMaterial params', $message_data['params']);
                self::$logger->error($e->getMessage());
                break;
            }
            $resData = array("resData" => array("result" => 0,
                                                "msg" => "提交成功"));
            Gateway::sendToClient($client_id, ($message_data['callback'].'('.json_encode($resData, JSON_UNESCAPED_UNICODE).')'));

            break;

            default:
            Gateway::sendToCurrentClient('data format error! request is closing!');

        }

    }

   /**
    * 当用户断开连接时触发
    * @param int $client_id 连接id
    */
    public static function onClose($client_id) {

    }
}
