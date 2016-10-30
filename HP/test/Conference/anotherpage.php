<?php
//session_start();
//include_once '../dbconnect.php';

  include '../redisSessionHandler.php';
  session_start();
  if(!isset($_SESSION['usr_name'])){
     header("Location:../login.php");
  }
?>

<!DOCTYPE html>

<html>
<head>
    <title>AnotherPage</title>
</head>
<body>


  <p> This is another page </p>

  <!-- Session info and logout option -->
  <ul>
      <?php if (isset($_SESSION['usr_id'])) { ?>
      <li><p>Signed in as <?php echo $_SESSION['usr_name']; ?></p></li>
      <li><a href="../logout.php">Log Out</a></li>
      <?php } else { ?>
      <li><a href="../login.php">Login</a></li>
      <li><a href="../register.php">Sign Up</a></li>
      <?php } ?>
  </ul>

  <a href="page.php">Conference</a>


</body>
</html>
