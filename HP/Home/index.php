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
  <link href="../../bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="../../bootstrap/css/landing-page.css" rel="stylesheet">
  <link href="../../bootstrap/font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css">
  <link href="http://fonts.googleapis.com/css?family=Lato:300,400,700,300italic,400italic,700italic" rel="stylesheet" type="text/css">
  <link href="../../bootstrap/dist/css/timeline.css" rel="stylesheet">
  <link href="../../bootstrap/dist/css/sb-admin-2.css" rel="stylesheet">
  <link href="../../bootstrap/metisMenu/dist/metisMenu.min.css" rel="stylesheet">
  <link href="../../bootstrap/morrisjs/morris.css" rel="stylesheet">


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
<div id="main">

  <?php if (isset($_SESSION['usr_id'])) { ?>

    <li><p>Signed in as <?php echo $_SESSION['usr_name']; ?></p></li>
    <li><a href="../logout.php">Log Out</a></li>

  <?php } ?>

  <div id="left">
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

  </div>

  <div id="right">
    <div id='chat'>

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
                           <ul class="chat" id="ul-chatbox-messages">

                             <!--

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

                             -->
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


    </div>


  </div>



    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
    <script src="../../bootstrap/js/jquery.js"></script>
    <script src='../../js/socket.io.js'></script>
    <script src='client.js'></script>


</div>
</body>

</html>
