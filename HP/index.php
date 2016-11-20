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

    <p>
      Please visit these pages to accept the certificates :
      <a href="https://vps332892.ovh.net:4000">4000</a>
      <a href="https://vps332892.ovh.net:8888">8888</a>
    </p>

  <?php } ?>






</body>
</html>
