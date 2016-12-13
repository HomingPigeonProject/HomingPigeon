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
  <link href="https://fonts.googleapis.com/css?family=Lato:300,400,700,300italic,400italic,700italic" rel="stylesheet" type="text/css">
  <link href="../../bootstrap/dist/css/timeline.css" rel="stylesheet">
  <link href="../../bootstrap/dist/css/sb-admin-2.css" rel="stylesheet">
  <link href="../../bootstrap/metisMenu/dist/metisMenu.min.css" rel="stylesheet">
  <link href="../../bootstrap/morrisjs/morris.css" rel="stylesheet">
  <link href="../../assets/fullcalendar.css" rel="stylesheet">
  <link href="../../assets/fullcalendar.print.css" rel="stylesheet" media="print">
  <!--<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script> -->
  <script src="../../bootstrap/js/jquery.js"></script>
  <script src="../../bootstrap/js/bootstrap.min.js"></script>
  <script type="text/javascript" src='https://maps.google.com/maps/api/js?libraries=places&key=AIzaSyA5WMwx4Wc9SvD-MdXgv4k8P71qBzlOQaQ'></script>
  <script src="../../assets/moment.js"></script>
  <script src="../../locationpicker.jquery.js"></script>
  <script src="../../assets/jquery-ui.min.js"></script>
  <link rel="stylesheet" type="text/css" href="style.css">
  <meta name = "viewport" id = "viewport_device">

  <title>Home</title>
<script>
if(navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/IEMobile/i)){
        $("#viewport_device").attr("content", "initial-scale = 1.00");
        $("#viewport_device").attr("content", "minimum-scale = 0.50");
    }
    else if(navigator.userAgent.match(/iPad/i)){
        $("#viewport_device").attr("content", "initial-scale = 1.00");
    }
</script>

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

  <!-- modal -->
<div class="modal" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
    <div class="vertical-alignment-helper">
        <div class="modal-dialog vertical-align-center">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span>

                    </button>
                     <h4 class="modal-title" id="myModalLabel">Modal title</h4>

                </div>
                <div class="modal-body">...</div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary">Save changes</button>
                </div>
            </div>
        </div>
    </div>
</div>
<nav class="navbar navbar-default topnav" role="navigation" style="position:relative; margin-bottom: 0;">
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

            <li>

              <h4 style="display:inline; height:100%; vertical-align:middle; padding-right:20px;">
                <?php if (isset($_SESSION['usr_id'])) { ?>
                Signed in as
                <?php echo $_SESSION['usr_name'];echo(' '); ?>
                <?php } ?>
              </h4>
            </li>
            <li>
              <button class="btn btn-danger" onclick="location.href='../logout.php';" style="margin-top: 8px; margin-bottom: 8px;">Log Out</button>
            </li>

            <!-- /.dropdown -->
        </ul>
        <!-- /.navbar-top-links -->
</nav>

<div id="main" class="container" style="width:100%">
<?php /*
  <li id="top">

    <?php if (isset($_SESSION['usr_id'])) { ?>

      <p><h4>Signed in as <?php echo $_SESSION['usr_name'];echo(' '); ?></h4>
      <a class="btn btn-danger" href="../logout.php"> Log Out</a>
      </p>
    <?php } ?>

  </li>
*/?>
  <div class="row">
    <div class ="col-lg-1"></div>
    <div class ="col-lg-3">
      <div id='control'>
        <div class="chat-panel panel panel-default">
            <div class="panel-heading">
                <i class="fa fa-users fa-fw"></i>Add Contact/Group
            </div>
        <!--
        <label id='loginStatus'>status : not logined</label>


        <form id='sessionLogin' action='javascript:void(0);'>
          <input id='sessionId' type='text' placeholder='put your session id'></input>
          <button type='submit'>session login</button>
        </form>
        -->
<br/>
        <div class="input-group" style="width:100%">
        <form onsubmit="return false;">
          <div class="row">
            <div class="col-lg-8" style="padding-right:0px">
            <input id="contactInput" type="text" class="form-control" placeholder="contact email" required class="form-control"></input>
          </div>
          <div class="col-lg-4" style="padding-left:0px">
            <button id="contactAddButton" class="btn btn-primary" type="submit" style="width:100%">add contact</button>
          </div>
        </div>
        </form>
      </div>
<br/>
      <div class="input-group form-inline" style="width:100%">
        <form>
          <div class="row">
            <div class="col-lg-8" style="padding-right:0px">
          <input id="createGroupNameInput" type="text"  class="form-control" placeholder="group name"></input>
        </div>
        <div class="col-lg-4" style="padding-left:0px">
          <button id="createGroupButton" class="btn btn-primary" type="button" style="width:100%">create group</button>
          </div>
        </div>
        </form>
      </div>
<br/>

      <div id="list-group">



<!-- old one
        <div id="pending-contact-list-full">
          <p class="listTitle">Pending Contacts</p>
          <div id="pending-contact-list">
          </div>
        </div>
!-->    <div id="pending-contact-list-full" class="chat-panel panel panel-default">
            <div class="panel-heading">
                <i class="fa fa-user fa-fw"></i>Pending Contacts
                </div>
            <ul id="pending-contact-list" style="list-style-type: none;padding:0px;">
            </ul>
            <!--<div id="pending-contact-list">
            </div>-->
        </div>
          <div id="contact-list-full" class="chat-panel panel panel-default">
              <div class="panel-heading">
                  <i class="fa fa-user fa-fw"></i>Contacts
              </div>
              <ul id="contact-list" style="list-style-type: none;padding:0px;">
              </ul>
              <!--<div id="contact-list">
              </div>-->
            </div>
            <div id="group-list-full" class="chat-panel panel panel-default">
                <div class="panel-heading">
                    <i class="fa fa-users fa-fw"></i>Groups
                </div>
                <ul id="group-list" style="list-style-type: none;padding:0px;">
                </ul>
                <!--<div id="group-list">
                </div>-->
              </div>

        <!--
        <div id="pending-group-list-full">
          <p class="listTitle">Pending Groups</p>
          <div id="pending-group-list">
          </div>
        </div>
        -->


<!-- old one

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

!-->

      </div>
    </div>
  </div>
  </div>

    <!-- Text chat -->
    <div id='chat' class="col-lg-7">

    <div >
      <div class="chat-panel panel panel-default">
        <div id="panel-heading" class="panel-heading" >
            <i class="fa fa-comments fa-fw"></i> Chat
            <div class="btn-group pull-right">
              <button type="button" class="btn btn-default btn-xs chatToggle">
                <i class="fa fa-chevron-down chatChevron"></i>
              </button>
            </div>
        </div>
           <div class="panel-body panel-resizable chatTog">
             <ul class="chat" id="ul-chatbox-messages">
             </ul>
           </div>
           <div class="panel-footer chatTog">
             <div class="row">
               <form onsubmit="myFunction(); return false;">
               <div class="col-lg-8">
                  <textarea id="btn-input" type="text" class="form-control input-sm messageInput" placeholder="Type your message here... (Shift + Enter for new line)" style="resize: vertical" required></textarea>
                </div>
               <div class="col-lg-2">
               <span class="input-group-btn">
                 <button type="submit" class="btn btn-warning" id="btn-chat" style="width:100%;">Send</button>
               </span>
             </div>
           </form>
                <div class="col-lg-2">
                  <form>
                  <select id="importance-list" class="form-control" size="1">
                    <option>normal</option>
                    <option>important</option>
                    <option>very important</option>
                  </select>
                  </form>
                </div>
              </div>
           <!-- End of Text chat -->

           <!--- Download summary -->
            <div id="summary-option">
                 <hr>
            <div class="row">
                <div class="col-lg-4">
                  <label> Select the option for the Summary : </label>
                 </div>
              <div class="col-lg-4">
                 <form>
                   <select id="importance-choice-dl" class="form-control" size="1">
                     <option>normal</option>
                     <option>important</option>
                     <option>very important</option>
                   </select>
                    </form>
                  </div>
                  <div class="col-lg-4">
                    <button id="imp-dl-btn" class="btn btn-primary" type="submit" style="width:100%">Download Summary</button>
                  </div>
              </div>

            </div>
                           <!---End of download summary option -->
           </div>

      </div>
    </div>
  </div>
  </div>
<div class="row">
  <div class="col-lg-1"></div>
  <div class="col-lg-10">
    </script>
    <br/><br/>
    <div class="chat-panel panel panel-default">
        <div class="panel-heading">
            <i class="fa fa-map fa-fw"></i> Map
            <div class="btn-group pull-right">
                <button type="button" class="btn btn-default btn-xs mapToggle">
                    <i class="fa fa-chevron-down mapChevron"></i>
                </button>
            </div>
        </div>
      <div id="us6-example" class="mapdiv">
        <div class="form-horizontal map">
            <div id="us6" style="width: 1000px; height: 500px;"></div>
            <div class="clearfix">&nbsp;</div>
            <div class="m-t-small">
              <div class="form-group">
                  <label class="col-sm-1 control-label"></label>
                  <div class="col-sm-9"><input type="text" class="form-control adress" id="us6-address"/>
                    <br/>
                    <button class="btn btn-primary shareLocation">Share actual position</button>
                    <button class="btn btn-primary updateLocation">Show message location</button>
                  </div>
              </div>
                <label class="p-r-small col-sm-1 control-label">latitude</label>
                <div class="col-sm-2"><input type="text" class="form-control long" style="width: 110px" id="us6-lat"/>
                  <input type="text" class="hidden form-control long1" style="width: 110px" id="us6-lat1"/>
                </div>
                <label class="p-r-small col-sm-1 control-label">longitude</label>
                <div class="col-sm-2"><input type="text" class="form-control latt" style="width: 110px" id="us6-lon"/>
                  <input type="text" class="hidden form-control latt1" style="width: 110px" id="us6-lon1"/>
                  <br/>
                </div>
            </div>
            <div class="clearfix"></div>
            <script>
            $('#us6').locationpicker({
                location: {
                    latitude: 36.36939210000001,
                    longitude: 127.36402489999999
                },
                radius: 0,
                inputBinding: {
                    latitudeInput: $('#us6-lat'),
                    longitudeInput: $('#us6-lon'),
                    radiusInput: $('#us6-radius'),
                    locationNameInput: $('#us6-address')
                },
                markerInCenter: true,
                enableAutocomplete: true
            });
            </script>

            <script>
            $(".updateLocation").on('click', function(){
                var input = $(".long1").val();
                var input2 = $(".latt1").val();
                $('#us6').locationpicker({
                    location: {
                        latitude: input,
                        longitude: input2
                    },
                    radius: 0,
                    inputBinding: {
                        latitudeInput: $('#us6-lat'),
                        longitudeInput: $('#us6-lon'),
                        radiusInput: $('#us6-radius'),
                        locationNameInput: $('#us6-address')
                    },
                    markerInCenter: true,
                    enableAutocomplete: true
                });
              });
            </script>
        </div>
      </div>
  </div>
</div>
<br/>
<br/>
</div>
<div class="row">
  <div class="col-lg-1"></div>
<div class="col-lg-10">
  <div class="panel panel-default">
    <!-- Create an event -->
    <!--
    <div class="panel-heading">
        <i class="fa fa-calendar-plus-o fa-fw"></i> Events
        <div class="btn-group pull-right">
        </div>
    </div>
    <div class="events-div">
      <form>
             <input id="eventNameInput" placeholder="event name" class="form-control" type="text"></input>
        <br/><input id="eventParticipantNameInput" placeholder="put participants emails, separate with ','" class="form-control" type="text"></input>
        <br/><input id="eventDescInput" placeholder="event description" class="form-control" type="text"></input>
        <br/>Discussion start date<input id="eventDateInput"  class="form-control"type='datetime-local'></input>
        <br/><input id="eventLLocationInput"  class="form-control"type="text" placeholder="location"></input>
        <br/>Meeting Time<input id="eventLDateInput"  class="form-control" type='datetime-local'></input>
      </form>
      <br/>
      <div class="row"><div class="col-sm-5"></div>
          <button id="eventCreateButton" class="btn btn-primary">Create Event</button>
      </div>
      <br/>
    </div>-->


      <div class="panel-heading">
          <i class="fa fa-calendar fa-fw"></i> Calendar
          <div class="btn-group pull-right">
              <button type="button" id="createEventButton" class="btn btn-default btn-xs">
                Create event<i class="fa fa-calendar-plus-o fa-fw"></i>
              </button>
              <button type="button" id="deleteEventButton" class="btn btn-default btn-xs">
                Delete event<i class="fa fa-calendar-minus-o fa-fw"></i>
              </button>
              <div class="btn-group pull-right">
                  <button type="button" class="btn btn-default btn-xs calendarToggle">
                      <i class="fa fa-chevron-down calendarChevron"></i>
                  </button>
              </div>
          </div>
      </div>
    <div id="calendar"></div>
  </div>
</div>
</div>

<script src="fullcalendar.js"></script>

    <!--<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>-->
    <script src="../../locationpicker.jquery.js"></script>
    <script src='../../js/socket.io.js'></script>
    <script src='client.js'></script>

</div>

<footer>
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <p class=" text-muted small">Copyright &copy; HomingPigeon 2016. All Rights Reserved</p>
            </div>
        </div>
    </div>
</footer>

</body>

</html>
