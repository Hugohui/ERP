<?php
$a = json_decode('{"resData":{"result":0,"data":[{"userName":"admin","password":"admin","phone":"222","access":"1","department":"no"},{"userName":"m","password":"m","phone":"m","access":"7","department":"2"},{"userName":"v","password":"v","phone":"v","access":"7","department":"no"},{"userName":".........","password":"zhangdezhao","phone":"111","access":"2","department":"no"},{"userName":"","password":"","phone":"","access":"0","department":""}]}}', true);
// var_dump($a);
$b = json_decode('{"data":[{"userName":"admin","password":"admin","phone":"222","access":"1","department":"no"},{"userName":"m","password":"m","phone":"m","access":"7","department":"2"},{"userName":"v","password":"v","phone":"v","access":"7","department":"no"},{"userName":".........","password":"zhangdezhao","phone":"111","access":"2","department":"no"},{"userName":"","password":"","phone":"","access":"0","department":""}]}', true);
// var_dump($b);
foreach($b['data'] as $car_id)
    var_dump($car_id);
?>
