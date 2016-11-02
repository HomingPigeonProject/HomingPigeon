<?php
  session_start();
  $_SESSION['some'] = 'thing2';

  $m = new Memcached();
  $m->addServer('localhost', 11211);
  $m->set('key', 'hello world2');
  var_dump($m->get('key'));
?>
