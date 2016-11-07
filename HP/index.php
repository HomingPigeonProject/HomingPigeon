<?php
  session_start();
  include_once 'dbconnect.php';
?>

<!DOCTYPE html>

<html>
<head>
    <title>Homing Pigeon</title>
</head>
<body>

  <h1> Homing Pigeon </h1>

  <!-- Session info and logout option -->
  <?php if (isset($_SESSION['usr_id'])) {
    header("Location:Home/index.php");
  } else { ?>

    <p>
      <a href="login.php">Login</a>
      <br/>
      <a href="register.php">Sign Up</a>
    </p>

  <?php } ?>






</body>
</html>
