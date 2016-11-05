<?php
  session_start();
  $index = "Location: Home/index.php";

  if(isset($_SESSION['usr_id'])!="") {
      header($index);
  }

  include_once 'dbconnect.php';

  //check if form is submitted
  if (isset($_POST['login'])) {

      $email = mysqli_real_escape_string($con, $_POST['email']);
      $password = mysqli_real_escape_string($con, $_POST['password']);
      // TODO : change md5 hashing for something good
      $result = mysqli_query($con, "SELECT * FROM Accounts WHERE email = '" . $email. "' and password = '" . md5($password) . "'");

      if ($row = mysqli_fetch_array($result)) {
          $_SESSION['usr_id'] = $row['id'];
          $_SESSION['usr_name'] = $row['nickname'];
          $_SESSION['email'] = $row['email'];
          header($index);

          // storing
          $m = new Memcached();
          $m->addServer('localhost', 11211);
          $m->set(session_id(), $_SESSION['email']);

      } else {
          $errormsg = "Incorrect Email or Password";
      }
  }
?>

<!DOCTYPE html>
<html>

<head>
    <title>Login</title>
</head>

<body>

  <div>
    <form role="form" action="<?php echo $_SERVER['PHP_SELF']; ?>" method="post" name="loginform">
        <fieldset>
            <legend>Login</legend>

            <div class="form-group">
                <label for="name">Email</label>
                <input type="text" name="email" placeholder="Your Email" required class="form-control" />
            </div>

            <div class="form-group">
                <label for="name">Password</label>
                <input type="password" name="password" placeholder="Your Password" required class="form-control" />
            </div>

            <div class="form-group">
                <input type="submit" name="login" value="Login" class="btn btn-primary" />
            </div>
        </fieldset>
    </form>
    <span class="text-danger"><?php if (isset($errormsg)) { echo $errormsg; } ?></span>
  </div>


  <div class="row">
      <div>
        New User? <a href="register.php">Sign Up Here</a>
      </div>
  </div>

</body>

</html>
