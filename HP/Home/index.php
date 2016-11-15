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
  <link rel="stylesheet" type="text/css" href="style.css">
  <title>Home</title>

  <!-- Hidden variables -->
  <div id="phpUserId" style="display: none;">
    <?php
      echo htmlspecialchars(preg_replace("/\s+/", "", $_SESSION['usr_id']));
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



</head>

<body>

  <?php if (isset($_SESSION['usr_id'])) { ?>

    <li><p>Signed in as <?php echo $_SESSION['usr_name']; ?></p></li>
    <li><a href="../logout.php">Log Out</a></li>

  <?php } ?>

  <div id='control'>
    <!--
    <label id='loginStatus'>status : not logined</label>


    <form id='sessionLogin' action='javascript:void(0);'>
      <input id='sessionId' type='text' placeholder='put your session id'></input>
      <button type='submit'>session login</button>
    </form>
    -->


    <form>
      <input id="contactInput" type="text" placeholder="contact email"></input>
      <button id="contactAddButton" type="button">add contact</button>
    </form>

    <form>
      <input id="createGroupNameInput" type="text" placeholder="group name"></input>
      <button id="createGroupButton" type="button">create group</button>
    </form>
  </div>




  <div id="list-group">

    <div id="pending-contact-list-full">
      <p class="listTitle">Pending Contacts</p>
      <div id="pending-contact-list">
      </div>
    </div>

    <!--
    <div id="pending-group-list-full">
      <p class="listTitle">Pending Groups</p>
      <div id="pending-group-list">
      </div>
    </div>
    -->

    <div id="contact-list-full">
      <p class="listTitle">Contacts</p>
      <div id="contact-list">
      </div>
    </div>

    <div id="group-list-full">
      <p class="listTitle">Groups</p>
      <div id="group-list">
      </div>
    </div>

  </div>


    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
    <script src="../../bootstrap/js/jquery.js"></script>
    <script src='../../js/socket.io.js'></script>
    <script src='client.js'></script>




</body>

</html>
