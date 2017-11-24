<?php
/*
 * *  -------------------------------------------------
 * *   Author : shijinjie
 * *   Date   : 2017-10-11
 * *  -------------------------------------------------
 * */

//递归查找$value是否在$array中
function deep_in_array($value, $array) {
    foreach($array as $item) {
           if(!is_array($item)) {
                      if ($item == $value) {
                                     return true;
                                  } else {
                                                 continue;
                                              }
                   }

           if(in_array($value, $item)) {
                      return true;
                   } else if(deep_in_array($value, $item)) {
                              return true;
                           }
        }
    return false;
}

//递归查找$value在$array中的$key值
function search_value ($array, $value)
{
    static $str = '';
    if (!is_array ($array))
    {
        return false;
    }

    foreach ($array as $k => $v )
    {
        var_dump($v);
        if (is_array ($v))
        {
            search_value($v, $value);
        }
        else
        {
            if($v == $value && $str == '')
            {
                $str .= $k;
                break;
            }
            else
                continue;
        }
    }

    return $str;
}

/*
$arr = array(
   array('a', 'b'),
   array('c', 'd')
);

in_array('a', $arr); // 此时返回的永远都是 false
deep_in_array('a', $arr); // 此时返回 true 值

$a=array('fruits'=>array('a'=>'orange','b'=>'grape',c=>'apple'),
 'numbers'=>array(1,2,3,4,5,6),
 'holes'=>array('first',5=>'second','apple')
 );

print_r($a);

$key = search_value($a, 'apple');
var_dump($key);

*/

?>
