<?php
  session_start();
  //include_once 'dbconnect.php';
  if(!isset($_SESSION['usr_name'])){
     header("Location:../login.php");
  }

  $url = $_SERVER['REQUEST_URI'];
?>

<!DOCTYPE html>
<html>
<head>
  <title>Home</title>

  <!-- Hidden variables -->
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
  <div id="phpURL" style="display: none;">
    <?php
      echo htmlspecialchars($url);
    ?>
  </div>


  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
  <script src='../../js/socket.io.js'></script>
  <script src='client.js'></script>


  <style>
    
  </style>



</head>

<body>

  <div id='control'>
    <label id='loginStatus'>status : not logined</label>

    <form id='sessionLogin' action='javascript:void(0);'>
      <input id='sessionId' type='text' placeholder='put your session id'></input>
      <button type='submit'>session login</button>
    </form>
  </div>


  <div id="list-group">

    <div id="contact-list">

    </div>

  </div>

</body>

</html>
