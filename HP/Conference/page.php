<?php
  session_start();
  if(!isset($_SESSION['usr_name'])){
     header("Location:../login.php");
  }
  include_once '../dbconnect.php';
?>




<?php   //checking if the user has the right to access this room

  $room = explode("?", $_SERVER['REQUEST_URI'])[1];

  $roomType = substr($room, 0, 1);

  $roomNb = intval(substr($room, 1));

  $userId = intval($_SESSION['usr_id']);

  $defaultPage = "Location:../index.php";

  // if roomNb starts with a g : group, by a c : contact
  if ($roomType == "") {
    // null

    header($defaultPage);

  } else if ($roomType == "g") {
    echo "Group room <br/>";
    echo $roomNb;
    echo "<br/>";
    echo $userId;
    $result = mysqli_query($con, "SELECT * FROM GroupMembers WHERE groupId = $roomNb and accountId = $userId");

    if ($row = mysqli_fetch_array($result)) {
      // OK
    } else {
      header($defaultPage);
    }

  } else if ($roomType == "c") {
    $result = mysqli_query($con, "SELECT * FROM Contacts WHERE id = $roomNb AND (accountId = $userId OR accountId2 = $userId)");

    if ($row = mysqli_fetch_array($result)) {
      // OK
    } else {
      header($defaultPage);
    }

  } else {
    header($defaultPage);

  }
?>


<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Homing Pigeon Conference</title>

        <style>
            /* HTML div class style */
            .videoContainer {
                position: relative;
                width: 200px;
                height: 150px;
            }
            .videoContainer video {
                position: absolute;
                width: 100%;
                height: 100%;
            }

            #split-left {}
            #split-right {float:right;}

        </style>

        <link href="../../bootstrap/css/landing-page.css" rel="stylesheet">
        <link href="../../bootstrap/css/bootstrap.min.css" rel="stylesheet">
        <link href="../../bootstrap/font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css">
        <link href="http://fonts.googleapis.com/css?family=Lato:300,400,700,300italic,400italic,700italic" rel="stylesheet" type="text/css">
        <link href="../../bootstrap/dist/css/timeline.css" rel="stylesheet">
        <link href="../../bootstrap/dist/css/sb-admin-2.css" rel="stylesheet">
        <link href="../../bootstrap/metisMenu/dist/metisMenu.min.css" rel="stylesheet">
        <link href="../../bootstrap/morrisjs/morris.css" rel="stylesheet">




    </head>


  <body id="body">

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

    <div id="username" style="display: none;">
      <?php
        $output = $_SESSION['usr_name'];
        echo htmlspecialchars($output);
      ?>
    </div>

    <a href="anotherpage.php">anotherpage</a>

      <h2 id="title">Start a room</h2>

      <p id="subTitle"></p>

      <form id="createRoom">
          <input id="createRoomInput"/>
          <button type="submit" id="createRoomBtn">Create it!</button>
      </form>

      <!-- Local Video -->
      <div class="videoContainer">
          <video id="localVideo" style="height: 150px;" oncontextmenu="return false;"></video>
          <div id="localVolume" class="volume_bar"></div>
      </div>

      <!-- buttons for audio and video -->
      <div id="VideoButtons">
        <button type="button" id="videoPause" onclick="pauseVideo()">Pause Video</button>
        <button type="button" id="videoResume" onclick="resumeVideo()">Resume Video</button>
      </div>
      <div id="AudioButtons">
        <button type="button" id="audioMute" onclick="muteAudio()">Mute Audio</button>
        <button type="button" id="audioUnmute" onclick="unmuteAudio()">Unmute Audio</button>
      </div>

      <!-- Remote Video(s) -->
      <div id="remotes"></div>

      <!-- Text chat -->

      <div class="row">
        <div class="col-lg-4">
          <br/><br/><br/><br/>
          <div class="chat-panel panel panel-default">
            <div class="panel-heading">
              <i class="fa fa-comments fa-fw"></i> Chat
            </div>
            <div class="panel-body chatTog">
              <ul class="chat" id="chat-list">
                <!-- Here are inserted the messages -->
              </ul>
            </div>

            <div class="panel-footer chatTog">
              <div class="input-group">

                <input id="btn-input" type="text" class="form-control input-sm" placeholder="Type your message here..." />
                <span class="input-group-btn">
                  <button class="btn btn-warning btn-sm" id="btn-chat">Send</button>
                </span>

                  <form>
                    <select id="importance-list" size="1">
                      <option>normal
                      <option>important
                      <option>very important
                    </select>
                  </form>

              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- End of Text chat -->

      <!--- Download summary option -->

      <div id="summary-option">

        <form>
          <select id="importance-choice-dl" size="1">
            <option>normal
            <option>important
            <option>very important
          </select>
        </form>
        <button id="imp-dl-btn" type="submit">Download Summary</button>

      </div>

      <!---End of download summary option -->

      <script type="text/javascript"></script>
      <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js"></script>
      <script src="latest-v2.js"></script>
      <script src='page.js'></script>

    </body>
</html>
