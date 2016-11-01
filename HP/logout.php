<?php
session_start();

if(isset($_SESSION['usr_id'])) {
    $m = new Memcached();
    $m->addServer('localhost', 11211);
    $m->delete(session_id());
    session_destroy();
    unset($_SESSION['usr_id']);
    unset($_SESSION['usr_name']);
    unset($_SESSION['email']);
    header("Location: index.php");
} else {
    header("Location: index.php");
}
?>


<!DOCTYPE html>

<html>
<head>
    <title>logout</title>
</head>
<body>

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
