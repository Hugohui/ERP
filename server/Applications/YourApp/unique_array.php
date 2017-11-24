<?php
//$arr数组集合  $val要删除的数组值
function unique_array($arr, $val)
{
    if(!is_array($arr) || !is_array($val))
    {  
           return $arr;  
    }

    foreach($arr as $k => $v) 
    {
        foreach($val as $vl)
        {
            if($v == $vl)
            {
                unset($arr[$k]);
            }
        }
    }
    return $arr;
}
//$arr= array(1,2,3,4);
//$val= array(1,3,4);
//var_dump(unique_array($arr, $val));
