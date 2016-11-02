<?php
  session_start();
  include_once 'dbconnect.php';
?>

<!DOCTYPE html>
<html>
<head>
<title>
node test
</title>


  <div id="phpUserId" style="display: none;">
      <?php
          echo htmlspecialchars($_SESSION['usr_id']);
      ?>
  </div>
  <div id="phpSessionId" style="display: none;">
      <?php
          echo htmlspecialchars(session_id());
      ?>
  </div>

<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
<script src='../../js/socket.io.js'></script>
<script src='client.js'></script>
</head>
<body>


<div id='control'>
<label id='loginStatus'>status : not logined</label>

<form id='sessionLogin' action='javascript:void(0);'>
<input id='sessionId' type='text' placeholder='put your session id'></input>
<button type='submit'>session login</button>
</form>
</div>
</body>
</html>
