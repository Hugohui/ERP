<?php
$system_permissions = array('purchase_request' => "true",
                            'purchase_track' => "true",
                            'purchase_history' => "true",
                            'purchase_audit' => "true",
                            'stock_search' => "true",
                            'storage' => "true",
                            'basic_info' => "true",
                            'delivery_storage' => "true",
                            'retirement_audit' => "true",
                            'material_application' => "true",
                            'retirement_application' => "true",
                            'information_maintenance' => "true",
                            'user_management' => "true",
                            'operation_log' => "true",
                            );
$data = serialize($system_permissions);
var_dump($data);
// $re = unserialize($data);
// var_dump($re);
$clark = array('purchase_request' => "true",
                            'purchase_track' => "true",
                            'purchase_history' => "true",
                            'purchase_audit' => "false",
                            'stock_search' => "false",
                            'storage' => "false",
                            'delivery_storage' => "false",
                            'retirement_audit' => "false",
                            'material_application' => "true",
                            'retirement_application' => "true",
                            'information_maintenance' => "true",
                            'user_management' => "false",
                            'operation_log' => "false",
                            );

$clark_data = serialize($clark);
var_dump($clark_data);

$kuguan = array('purchase_request' => "true",
                            'purchase_track' => "true",
                            'purchase_history' => "true",
                            'purchase_audit' => "false",
                            'stock_search' => "true",
                            'storage' => "true",
                            'borrow' => "true",
                            'delivery_storage' => "true",
                            'retirement_audit' => "true",
                            'material_application' => "true",
                            'retirement_application' => "true",
                            'information_maintenance' => "true",
                            'user_management' => "false",
                            'operation_log' => "false",
                            );

$kuguan_data = serialize($kuguan);
var_dump('kuguan');
var_dump($kuguan_data);

$caigou = array('purchase_request' => "true",
                            'purchase_track' => "true",
                            'purchase_history' => "true",
                            'purchase_audit' => "true",
                            'stock_search' => "true",
                            'storage' => "true",
                            'basic_info' => "true",
                            'delivery_storage' => "true",
                            'retirement_audit' => "true",
                            'material_application' => "true",
                            'retirement_application' => "true",
                            'information_maintenance' => "true",
                            'user_management' => "false",
                            'operation_log' => "false",
                            );

$caigou_data = serialize($caigou);
//var_dump("caigou");
var_dump($caigou_data);

$buzhang = array('purchase_request' => "true",
                            'purchase_track' => "true",
                            'purchase_history' => "true",
                            'purchase_audit' => "true",
                            'stock_search' => "true",
                            'storage' => "true",
                            'delivery_storage' => "true",
                            'retirement_audit' => "true",
                            'material_application' => "true",
                            'retirement_application' => "true",
                            'information_maintenance' => "true",
                            'user_management' => "true",
                            'operation_log' => "true",
                            );

$buzhang_data = serialize($buzhang);
var_dump($buzhang_data);

$zuzhang = array('purchase_request' => "true",
                            'purchase_track' => "true",
                            'purchase_history' => "true",
                            'purchase_audit' => "true",
                            'stock_search' => "false",
                            'storage' => "false",
                            'delivery_storage' => "false",
                            'retirement_audit' => "false",
                            'material_application' => "true",
                            'retirement_application' => "true",
                            'information_maintenance' => "true",
                            'user_management' => "false",
                            'operation_log' => "false",
                            );

$zuzhang_data = serialize($zuzhang);
var_dump($zuzhang_data);


?>
