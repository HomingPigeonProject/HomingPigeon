<!DOCTYPE html>
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
    <nav class="navbar navbar-default topnav" role="navigation">
            <ul class="nav navbar-top-links navbar-right">
                <li>
                    <a class="navbar-brand" href="index.php">HomingPigeon</a>
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
                      <div class="modal-header">
                          <button type="button" class="close" data-dismiss="modal">&times;</button>
                          <legend>Login</legend>
                      </div>
                      <div class="modal-body">
                        <form role="form" action="<?php echo $_SERVER['PHP_SELF']; ?>" method="post" name="loginform">
                            <fieldset>

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
                        </div>
                        <span class="text-danger"><?php if (isset($errormsg)) { echo $errormsg; } ?></span>
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
                            <legend>Sign Up</legend>
                      </div>
                      <div class="modal-body">
                        <div>
                          <form role="form" action="<?php echo $_SERVER['PHP_SELF']; ?>" method="post" name="signupform">
                              <fieldset>
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
