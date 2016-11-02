<?php
  session_start();
  include_once 'dbconnect.php';
?>

<!DOCTYPE html>

<html>
<head>
    <title>Home</title>
</head>
<body>


  <a href="Conference/page.php">Conference</a>

  <!-- Session info and logout option -->
  <ul>
      <?php if (isset($_SESSION['usr_id'])) { ?>
      <li><p>Signed in as <?php echo $_SESSION['usr_name']; ?></p></li>
      <li><a href="logout.php">Log Out</a></li>
      <?php } else { ?>
      <li><a href="login.php">Login</a></li>
      <li><a href="register.php">Sign Up</a></li>
      <?php } ?>
  </ul>

</body>
</html>
