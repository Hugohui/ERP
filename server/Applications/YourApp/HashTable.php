<?php
error_reporting(0);
class HashTable {
    private $buckets;
    private $size = 10;

    public function __construct() {
        $this->buckets = new SplFixedArray($this->size);
    }

    private function hash ($key) {
        $strlen = strlen($key);
        $hashval = 0;
        for($i = 0;$i < $strlen;$i++)
        {
            $hashval += ord($key[$i]);
        }
        return $hashval % $this->size;
    }

/*
    private function hash ($key) {
        $strlen = strlen($key);
        $hashval = 1;
        for($i = 0;$i < $strlen;$i++)
        {
            $hashval += $hashval << 5 + ord($key[i]);
            var_dump($hashval);
        }
        return $hashval & 2147483647;
    }
*/
    public function insert ($key, $val) {
        $index = $this->hash($key);
        //$this->buckets[$index] = $val;
        if(isset($this->buckets[$index])) {
            $newNode = new HashNode($key, $val, $this->buckets[$index]);
        }
        else {
            $newNode = new HashNode($key, $val, NULL);
        }
        $this->buckets[$index] = $newNode;
    }

    public function find ($key) {
        $index = $this->hash($key);
        $current = $this->buckets[$index];
        while(isset($current))
        {
            if($current->key == $key)
            {
                return $current->value;
            }
            $current = $current->nextNode;
        }
        return NULL;
        //return $this->buckets[$index];
    }

} 

class HashNode {
    public $key;
    public $value;
    public $nextNode;

    public function __construct($key, $value, $nextNode=NULL) {
        $this->key = $key;
        $this->value = $value;
        $this->nextNode = $nextNode;
    }
}
    
/*
$hash = new HashTable();
$hash->	insert('key1','value1');
$hash->	insert('key12','value2');
$value1 = $hash->find('key1');
$value12 = $hash->find('key12');
var_dump($value1);
var_dump($value12);
*/


?>
