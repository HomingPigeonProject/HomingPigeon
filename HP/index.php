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

  <a href="Conference/page.php?c1">Conference c1</a>

  <!-- Session info and logout option -->
  <ul>
      <?php if (isset($_SESSION['usr_id'])) { ?>

        <li><p>Signed in as <?php echo $_SESSION['usr_name']; ?></p></li>
        <li><a href="logout.php">Log Out</a></li>


        <form action="" method="post">
          Contact email : <input name="cEmail" type="text" />
          <input name="submitContactEmail" type="submit" />
        </form>

        <?php
          $contactId = $_SESSION['usr_id'];


            // add a contact
            if (isset($_POST['submitContactEmail'])) {
              $contact = $_POST['cEmail'];
              $contactId2 = mysqli_fetch_array(mysqli_query($con, "SELECT id FROM Accounts WHERE email = '" . $contact. "' "))[0];
              if ($contactId2) {

                if( mysqli_query( $con, "INSERT INTO Contacts(accountId,accountId2) VALUES('" . $contactId . "', '" . $contactId2 . "')" ) ) {
                  echo "OK";
                } else {
                  echo "Not OK";
                }

              }
            }

            // contact list
            echo "<br>";
            echo "Contact List : <br>";
            $contactList = mysqli_query($con, "SELECT * FROM Contacts WHERE accountId = '" . $contactId . "'");
            while($row = $contactList->fetch_row()) {
              echo $row[1], '-', $row[2];
            }


        ?>
      <?php } else { ?>
        <li><a href="login.php">Login</a></li>
        <li><a href="register.php">Sign Up</a></li>

      <?php } ?>
  </ul>






</body>
</html>
