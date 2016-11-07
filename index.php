<!DOCTYPE html>
<?php
  session_start();
  $index = "Location: index.php";

  if(isset($_SESSION['usr_id'])!="") {
      header($index);
  }

  include_once 'HP/dbconnect.php';

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
  $error = false;

  //check if form is submitted
  if (isset($_POST['signup'])) {
      $name = mysqli_real_escape_string($con, $_POST['name']);
      $email = mysqli_real_escape_string($con, $_POST['email']);
      $password = mysqli_real_escape_string($con, $_POST['password']);
      $cpassword = mysqli_real_escape_string($con, $_POST['cpassword']);

      //name can contain only alpha characters and space
      if (!preg_match("/^[a-zA-Z ]+$/",$name)) {
          $error = true;
          $name_error = "Name must contain only alphabets and space";
      }
      if(!filter_var($email,FILTER_VALIDATE_EMAIL)) {
          $error = true;
          $email_error = "Please Enter Valid Email ID";
      }
      if(strlen($password) < 6) {
          $error = true;
          $password_error = "Password must be minimum of 6 characters";
      }
      if($password != $cpassword) {
          $error = true;
          $cpassword_error = "Password and Confirm Password doesn't match";
      }
      if (!$error) {
          /*
          if(mysqli_query($con, "INSERT INTO users(name,email,password) VALUES('" . $name . "', '" . $email . "', '" . md5($password) . "')")) {
              $successmsg = "Successfully Registered! <a href='login.php'>Click here to Login</a>";
          }
          */
          if(mysqli_query($con, "INSERT INTO Accounts(nickname,email,password) VALUES('" . $name . "', '" . $email . "', '" . md5($password) . "')")) {
              $successmsg = "Successfully Registered! <a href='login.php'>Click here to Login</a>";
          } else {
              $errormsg = "Error in registering...Please try again later!";
          }

      }
  }
?>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="laio">

    <title>Léo Schneider</title>

    <link href="bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link href="bootstrap/css/landing-page.css" rel="stylesheet">
    <link href="bootstrap/font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css">
    <link href="http://fonts.googleapis.com/css?family=Lato:300,400,700,300italic,400italic,700italic" rel="stylesheet" type="text/css">
    <link href="bootstrap/dist/css/timeline.css" rel="stylesheet">
    <link href="bootstrap/dist/css/sb-admin-2.css" rel="stylesheet">
    <link href="bootstrap/metisMenu/dist/metisMenu.min.css" rel="stylesheet">
    <link href="bootstrap/morrisjs/morris.css" rel="stylesheet">

</head>
<body>
    <div id="wrapper">
    <nav class="navbar navbar-default navbar-fixed-top topnav" role="navigation" style="margin-bottom: 0">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand" href="index.php">HomingPigeon</a>
            </div>
            <!-- /.navbar-header -->

            <ul class="nav navbar-top-links navbar-right">
                <li class="dropdown">
                    <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                        <i class="fa fa-envelope fa-fw"></i> <i class="fa fa-caret-down"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-messages">
                        <li>
                            <a href="#">
                                <div>
                                    <strong>John Smith</strong>
                                    <span class="pull-right text-muted">
                                        <em>Yesterday</em>
                                    </span>
                                </div>
                                <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend...</div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a href="#">
                                <div>
                                    <strong>John Smith</strong>
                                    <span class="pull-right text-muted">
                                        <em>Yesterday</em>
                                    </span>
                                </div>
                                <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend...</div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a href="#">
                                <div>
                                    <strong>John Smith</strong>
                                    <span class="pull-right text-muted">
                                        <em>Yesterday</em>
                                    </span>
                                </div>
                                <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eleifend...</div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a class="text-center" href="#">
                                <strong>Read All Messages</strong>
                                <i class="fa fa-angle-right"></i>
                            </a>
                        </li>
                    </ul>
                    <!-- /.dropdown-messages -->
                </li>
                <!-- /.dropdown -->
                <li class="dropdown">
                    <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                        <i class="fa fa-tasks fa-fw"></i> <i class="fa fa-caret-down"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-tasks">
                        <li>
                            <a href="#">
                                <div>
                                    <p>
                                        <strong>Task 1</strong>
                                        <span class="pull-right text-muted">40% Complete</span>
                                    </p>
                                    <div class="progress progress-striped active">
                                        <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 40%">
                                            <span class="sr-only">40% Complete (success)</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a href="#">
                                <div>
                                    <p>
                                        <strong>Task 2</strong>
                                        <span class="pull-right text-muted">20% Complete</span>
                                    </p>
                                    <div class="progress progress-striped active">
                                        <div class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width: 20%">
                                            <span class="sr-only">20% Complete</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a href="#">
                                <div>
                                    <p>
                                        <strong>Task 3</strong>
                                        <span class="pull-right text-muted">60% Complete</span>
                                    </p>
                                    <div class="progress progress-striped active">
                                        <div class="progress-bar progress-bar-warning" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 60%">
                                            <span class="sr-only">60% Complete (warning)</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a href="#">
                                <div>
                                    <p>
                                        <strong>Task 4</strong>
                                        <span class="pull-right text-muted">80% Complete</span>
                                    </p>
                                    <div class="progress progress-striped active">
                                        <div class="progress-bar progress-bar-danger" role="progressbar" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100" style="width: 80%">
                                            <span class="sr-only">80% Complete (danger)</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a class="text-center" href="#">
                                <strong>See All Tasks</strong>
                                <i class="fa fa-angle-right"></i>
                            </a>
                        </li>
                    </ul>
                    <!-- /.dropdown-tasks -->
                </li>
                <!-- /.dropdown -->
                <li class="dropdown">
                    <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                        <i class="fa fa-bell fa-fw"></i> <i class="fa fa-caret-down"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-alerts">
                        <li>
                            <a href="#">
                                <div>
                                    <i class="fa fa-comment fa-fw"></i> New Comment
                                    <span class="pull-right text-muted small">4 minutes ago</span>
                                </div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a href="#">
                                <div>
                                    <i class="fa fa-twitter fa-fw"></i> 3 New Followers
                                    <span class="pull-right text-muted small">12 minutes ago</span>
                                </div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a href="#">
                                <div>
                                    <i class="fa fa-envelope fa-fw"></i> Message Sent
                                    <span class="pull-right text-muted small">4 minutes ago</span>
                                </div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a href="#">
                                <div>
                                    <i class="fa fa-tasks fa-fw"></i> New Task
                                    <span class="pull-right text-muted small">4 minutes ago</span>
                                </div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a href="#">
                                <div>
                                    <i class="fa fa-upload fa-fw"></i> Server Rebooted
                                    <span class="pull-right text-muted small">4 minutes ago</span>
                                </div>
                            </a>
                        </li>
                        <li class="divider"></li>
                        <li>
                            <a class="text-center" href="#">
                                <strong>See All Alerts</strong>
                                <i class="fa fa-angle-right"></i>
                            </a>
                        </li>
                    </ul>
                    <!-- /.dropdown-alerts -->
                </li>
                <!-- /.dropdown -->
                <li class="dropdown">
                    <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                        <i class="fa fa-user fa-fw"></i> <i class="fa fa-caret-down"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-user">
                        <li></a>
                        </li>
                        <li><a href="#"><i class="fa fa-gear fa-fw"></i> Settings</a>
                        </li>
                        <li class="divider"></li>
                        <li><a href="login.html"><i class="fa fa-sign-out fa-fw"></i> Logout</a>
                        </li>
                    </ul>
                    <!-- /.dropdown-user -->
                </li>
                <li>
                    <button class="btn btn-default" data-toggle="modal" data-target="#myModal">log in</button>
                </li>
                <li>
                    <button class="btn btn-primary" data-toggle="modal" data-target="#myModalRegister">register</button>
                </li>
                <!-- /.dropdown -->
            </ul>
            <!-- /.navbar-top-links -->
    </nav>
        <div id="wrapper">

    <div class="intro-header intro">
        <div class="container">

            <div class="row">
                <div class="col-lg-12">
                    <div class="intro-message">
                        <h1>HomingPigeon</h1>
                        <h3>Welcome on HomingPigeon</h3>
                        <button class="btn btn-primary bStartnow">Start now</button>
                        <hr class="intro-divider">
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

<div class="container">
<div class="row">
    <div class = "col-lg-4">



        <br/><br/><br/><br/>
        <div id="contenu">

            <div class="col-lg-12">
            <!-- /.panel -->
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <i class="fa fa-users fa-fw"></i> Contacts list
                    </div>
                <!-- /.panel-heading -->
                <div class="panel-body">
                    <div class="row">
                        <div class="col-lg-12">
                                <ul style="list-style-type: none;
    padding-left:0;">
            <?PHP function friend($name,$co,$org){
                echo('
                                    <li class="right clearfix" style="list-style-type: none;">
                                    <span class="chat-img pull-left">
                                        <img src="http://placehold.it/50/FA6F57/fff" alt="User Avatar" class="img-circle" />
                                        </span>
                                       <strong class="pull-left primary-font"> '.$name.'</strong>
                                           <div class="pull-right">
                                            <small class=" text-muted">
                                                <button class="btn btn-primary"><i class="fa fa-video-camera fa-fw"></i></button>
                                            </small>
                                            <small class=" text-muted">
                                                <button class="btn btn-primary"><i class="fa fa-user-secret fa-fw"></i></button>
                                            </small>
                                        </div>
                                     <div class="chat-body clearfix">
                                        <div class="header">
                                            <small class=" text-muted">
                                                <br/><i class="fa fa-clock-o fa-fw"></i>  13 mins ago</small>
                                        </div>
                                            <small>
                                                 '.''.$org.'
                                            </small>
                                        </div>
                                    </li>
                                    <hr>
                                ');

            }
friend("billy","","Kaist");
friend("Patrick","","Kaist");
friend("Martin","","Kaist");
friend("Kim","","Kaist");
friend("Hun","","Kaist");
friend("Lee","","Kaist");
friend("Sang","","Kaist");
friend("Park","","Kaist");
friend("Lee","","Kaist");
friend("Sang","","Kaist");
friend("Park","","Kaist");
friend("Park","","Kaist");
friend("Lee","","Kaist");
friend("Sang","","Kaist");
friend("Park","","Kaist");
?>
                                    </ul>
                        </div>
                    </div>
                </div>
            </div>
            </div>
      </div>




    </div>
                <div class="col-lg-8">
                    <br/><br/><br/><br/>
                    <div class="chat-panel panel panel-default">
                        <div class="panel-heading">
                            <i class="fa fa-comments fa-fw"></i> Chat
                            <div class="btn-group pull-right">
                                <button type="button" class="btn btn-default btn-xs chatToggle">
                                    <i class="fa fa-chevron-down chatChevron"></i>
                                </button>
                            </div>
                        </div>
                        <!-- /.panel-heading -->
                        <div class="panel-body chatTog">
                            <ul class="chat">
                                <li class="left clearfix">
                                    <span class="chat-img pull-left">
                                        <img src="http://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />
                                    </span>
                                    <div class="chat-body clearfix">
                                        <div class="header">
                                            <strong class="primary-font">Jack Sparrow</strong>
                                            <small class="pull-right text-muted">
                                                <i class="fa fa-clock-o fa-fw"></i> 12 mins ago
                                            </small>
                                        </div>
                                        <p>
                                            Hey how are you ?
                                        </p>
                                    </div>
                                </li>
                                <li class="right clearfix">
                                    <span class="chat-img pull-right">
                                        <img src="http://placehold.it/50/FA6F57/fff" alt="User Avatar" class="img-circle" />
                                    </span>
                                    <div class="chat-body clearfix">
                                        <div class="header">
                                            <small class=" text-muted">
                                                <i class="fa fa-clock-o fa-fw"></i> 13 mins ago</small>
                                            <strong class="pull-right primary-font">Bhaumik Patel</strong>
                                        </div>
                                        <p>
                                            Just working a bit at the moment and you ?
                                        </p>
                                    </div>
                                </li>
                                <li class="left clearfix">
                                    <span class="chat-img pull-left">
                                        <img src="http://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />
                                    </span>
                                    <div class="chat-body clearfix">
                                        <div class="header">
                                            <strong class="primary-font">Jack Sparrow</strong>
                                            <small class="pull-right text-muted">
                                                <i class="fa fa-clock-o fa-fw"></i> 14 mins ago</small>
                                        </div>
                                        <p>
                                            Yeah same but I have no motivation :'(
                                        </p>
                                    </div>
                                </li>
                                <li class="right clearfix">
                                    <span class="chat-img pull-right">
                                        <img src="http://placehold.it/50/FA6F57/fff" alt="User Avatar" class="img-circle" />
                                    </span>
                                    <div class="chat-body clearfix">
                                        <div class="header">
                                            <small class=" text-muted">
                                                <i class="fa fa-clock-o fa-fw"></i> 15 mins ago</small>
                                            <strong class="pull-right primary-font">Bhaumik Patel</strong>
                                        </div>
                                        <p>
                                            Just take a break and start again after :)
                                        </p>
                                    </div>
                                </li>
                                <li class="left clearfix">
                                    <span class="chat-img pull-left">
                                        <img src="http://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />
                                    </span>
                                    <div class="chat-body clearfix">
                                        <div class="header">
                                            <strong class="primary-font">Jack Sparrow</strong>
                                            <small class="pull-right text-muted">
                                                <i class="fa fa-clock-o fa-fw"></i> 14 mins ago</small>
                                        </div>
                                        <p>
                                            Ok see you later !
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <!-- /.panel-body -->
                        <div class="panel-footer chatTog">
                            <div class="input-group">
                                <input id="btn-input" type="text" class="form-control input-sm messageInput" placeholder="Type your message here..." />
                                <span class="input-group-btn">
                                    <button class="btn btn-warning btn-sm" id="btn-chat">
                                        Send
                                    </button>
                                </span>
                            </div>
                        </div>
                    <!-- /.panel -->
                </div>
                <!-- /.col-lg-8 -->
                </div>








    <?php /*
    <div class="col-lg-4">
                    <br/><br/><br/><br/>
                    <div class="chat-panel panel panel-default">
                        <div class="panel-heading">
                            <i class="fa fa-comments fa-fw"></i> Chat2
                            <div class="btn-group pull-right">
                                <button type="button" class="btn btn-default btn-xs chat2Toggle">
                                    <i class="fa fa-chevron-down chatChevron2"></i>
                                </button>
                            </div>
                        </div>
                        <!-- /.panel-heading -->
                        <div class="panel-body chatTog2">
                            <ul class="chat">
                                <li class="left clearfix">
                                    <span class="chat-img pull-left">
                                        <img src="http://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />
                                    </span>
                                    <div class="chat-body clearfix">
                                        <div class="header">
                                            <strong class="primary-font">Jack Sparrow</strong>
                                            <small class="pull-right text-muted">
                                                <i class="fa fa-clock-o fa-fw"></i> 12 mins ago
                                            </small>
                                        </div>
                                        <p>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum ornare dolor, quis ullamcorper ligula sodales.
                                        </p>
                                    </div>
                                </li>
                                <li class="right clearfix">
                                    <span class="chat-img pull-right">
                                        <img src="http://placehold.it/50/FA6F57/fff" alt="User Avatar" class="img-circle" />
                                    </span>
                                    <div class="chat-body clearfix">
                                        <div class="header">
                                            <small class=" text-muted">
                                                <i class="fa fa-clock-o fa-fw"></i> 13 mins ago</small>
                                            <strong class="pull-right primary-font">Bhaumik Patel</strong>
                                        </div>
                                        <p>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum ornare dolor, quis ullamcorper ligula sodales.
                                        </p>
                                    </div>
                                </li>
                                <li class="left clearfix">
                                    <span class="chat-img pull-left">
                                        <img src="http://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />
                                    </span>
                                    <div class="chat-body clearfix">
                                        <div class="header">
                                            <strong class="primary-font">Jack Sparrow</strong>
                                            <small class="pull-right text-muted">
                                                <i class="fa fa-clock-o fa-fw"></i> 14 mins ago</small>
                                        </div>
                                        <p>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum ornare dolor, quis ullamcorper ligula sodales.
                                        </p>
                                    </div>
                                </li>
                                <li class="right clearfix">
                                    <span class="chat-img pull-right">
                                        <img src="http://placehold.it/50/FA6F57/fff" alt="User Avatar" class="img-circle" />
                                    </span>
                                    <div class="chat-body clearfix">
                                        <div class="header">
                                            <small class=" text-muted">
                                                <i class="fa fa-clock-o fa-fw"></i> 15 mins ago</small>
                                            <strong class="pull-right primary-font">Bhaumik Patel</strong>
                                        </div>
                                        <p>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur bibendum ornare dolor, quis ullamcorper ligula sodales.
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <!-- /.panel-body -->
                        <div class="panel-footer chatTog2">
                            <div class="input-group">
                                <input id="btn-input" type="text" class="form-control input-sm" placeholder="Type your message here..." />
                                <span class="input-group-btn">
                                    <button class="btn btn-warning btn-sm" id="btn-chat">
                                        Send
                                    </button>
                                </span>
                            </div>
                        </div>
                    <!-- /.panel -->
                </div>
                <!-- /.col-lg-8 -->
                </div>







<div class="row">
<div class="col-lg-7">
    <br/><br/>
    <div class="chat-panel panel panel-default">
        <div class="panel-heading mapdiv">
            <i class="fa fa-map fa-fw"></i> Map
            <div class="btn-group pull-right">
                <button type="button" class="btn btn-default btn-xs mapToggle">
                    <i class="fa fa-chevron-down mapChevron"></i>
                </button>
            </div>
        </div>
<iframe
  class="map"
  width="600"
  height="450"
  frameborder="0" style="border:0"
  src="https://www.google.com/maps/embed/v1/search?key=AIzaSyDvhhb3FV9damxkdZxZ4qXUCjJdpyPDlQc&q=Kaist" allowfullscreen>
</iframe>
    </div>
</div>
<!-- Modal -->*/ ?>
                <div id="myModal" class="modal fade" role="dialog">
                  <div class="modal-dialog">

                    <!-- Modal content-->
                    <div class="modal-content">
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
                      <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" data-dismiss="modal">Connect</button>
                      </div>
                    </div>

                  </div>
                </div>


                <div id="myModalRegister" class="modal fade" role="dialog">
                  <div class="modal-dialog">

                    <!-- Modal content-->
                    <div class="modal-content">
                      <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title">Login</h4>
                      </div>
                      <div class="modal-body">
                        <div>
                          <form role="form" action="<?php echo $_SERVER['PHP_SELF']; ?>" method="post" name="signupform">
                              <fieldset>
                                  <legend>Sign Up</legend>

                                  <div class="form-group">
                                      <label for="name">Name</label>
                                      <input type="text" name="name" placeholder="Enter Full Name" required value="<?php if($error) echo $name; ?>" class="form-control" />
                                      <span class="text-danger"><?php if (isset($name_error)) echo $name_error; ?></span>
                                  </div>

                                  <div class="form-group">
                                      <label for="name">Email</label>
                                      <input type="text" name="email" placeholder="Email" required value="<?php if($error) echo $email; ?>" class="form-control" />
                                      <span class="text-danger"><?php if (isset($email_error)) echo $email_error; ?></span>
                                  </div>

                                  <div class="form-group">
                                      <label for="name">Password</label>
                                      <input type="password" name="password" placeholder="Password" required class="form-control" />
                                      <span class="text-danger"><?php if (isset($password_error)) echo $password_error; ?></span>
                                  </div>

                                  <div class="form-group">
                                      <label for="name">Confirm Password</label>
                                      <input type="password" name="cpassword" placeholder="Confirm Password" required class="form-control" />
                                      <span class="text-danger"><?php if (isset($cpassword_error)) echo $cpassword_error; ?></span>
                                  </div>

                                  <div class="form-group">
                                      <input type="submit" name="signup" value="Sign Up" class="btn btn-primary" />
                                  </div>
                              </fieldset>
                          </form>
                          <span class="text-success"><?php if (isset($successmsg)) { echo $successmsg; } ?></span>
                          <span class="text-danger"><?php if (isset($errormsg)) { echo $errormsg; } ?></span>
                        </div>
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" data-dismiss="modal">Connect</button>
                      </div>
                    </div>

                  </div>
                </div>




<?PHP/*

<div class="col-lg-7">
    <br/><br/>
    <div class="chat-panel panel panel-default">
        <div class="panel-heading calendardiv">
            <i class="fa fa-calendar fa-fw"></i> Calendar
            <div class="btn-group pull-right">
                <button type="button" class="btn btn-default btn-xs calendarToggle">
                    <i class="fa fa-chevron-down calendarChevron"></i>
                </button>
            </div>
        </div>
<iframe
  class="calendar"
  width="600"
  height="450"
  frameborder="0" style="border:0"
  src="https://www.google.com/maps/embed/v1/search?key=AIzaSyDvhhb3FV9damxkdZxZ4qXUCjJdpyPDlQc&q=Kaist" allowfullscreen>
</iframe>
   </div>
</div>


<div class="col-lg-7">
    <br/><br/>
    <div class="chat-panel panel panel-default">
        <div class="panel-heading questiondiv">
            <i class="fa fa-question fa-fw"></i> form
            <div class="btn-group pull-right">
                <button type="button" class="btn btn-default btn-xs questionToggle">
                    <i class="fa fa-chevron-down questionChevron"></i>
                </button>
            </div>
        </div>
<iframe
  class="question"
  width="600"
  height="450"
  frameborder="0" style="border:0"
  src="https://www.google.com/maps/embed/v1/search?key=AIzaSyDvhhb3FV9damxkdZxZ4qXUCjJdpyPDlQc&q=Kaist" allowfullscreen>
</iframe>
   </div>
</div>



*/ ?>


</div>

<?php /*
    <div class="content-section-a">
        <div class="container">
            <div class="row">
                <div class="col-lg-5 col-sm-6">
                    <hr class="section-heading-spacer">
                    <div class="clearfix"></div>
                    <h2 class="section-heading">Who are we ?</h2>
                    <p class="lead">We are 3 Undergraduate<br>Kaist Students working on this Web application as our Main Project this semesterof fall 2016</p>
                </div>
                <div class="col-lg-5 col-lg-offset-2 col-sm-6">
                    <img class="img-responsive" src="bootstrap/img/Web_dev.jpg" alt="">
                </div>
            </div>
        </div>
    </div>
	<a  name="contact"></a>
    <div class="banner">
        <div class="container">
            <div class="row">
                <div class="col-lg-6">
                    <h2></h2>
                </div>
                <div class="col-lg-6">
                </div>
            </div>
        </div>
    </div>*/?>
</div></div>
    </div>
    </div>
    <footer>
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <ul class="list-inline">
                        <li><a href="#">Acceuil</a></li>
                        <li class="footer-menu-divider">&sdot;</li>
                        <li><a href="propos">à propos</a></li>
                        <li class="footer-menu-divider">&sdot;</li>
                        <li><a href="contact">Contact</a></li>
                    </ul>
                    <p class="copyright text-muted small">Copyright &copy; Léo Schneider 2016. All Rights Reserved</p>
                </div>
            </div>
        </div>
    </footer>
    <script src="bootstrap/js/jquery.js"></script>
    <script src="bootstrap/js/bootstrap.min.js"></script>
    <script src="mainJQuery.js"></script>
    <script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
    <script src="server/script.js"></script> <!-- our script for the server--!>


</body>
</html>
