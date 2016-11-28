//////////////FADE BG/////////////////////
$(".bStartnow").on('click',function(){
   $(".intro").fadeOut(800);
});
//////////////TOGGLE MAP/////////////////////
$(".mapToggle").on('click',function(){
   $(".map").toggle();
if($(".mapChevron").hasClass("fa-chevron-down")){
   $(".mapChevron").addClass("fa-chevron-right");
   $(".mapChevron").removeClass("fa-chevron-down");
}
else{
    $(".mapChevron").removeClass("fa-chevron-right");
   $(".mapChevron").addClass("fa-chevron-down");
}
$(".map").width($(".mapdiv").width()+30);
$(".map").height($(".map").width()/1.4);
//console.log($(".mapdiv").width());
//console.log($(".map").width());
});
//////////////ADAPT SIZE MAP/////////////////////
$(".map").width($(".mapdiv").width()+30);
$(".map").height($(".map").width()/1.4);
//console.log($(".mapdiv").width());
//console.log($(".map").width());

//////////////TOGGLE CALENDAR/////////////////////
$(".calendarToggle").on('click',function(){
   $(".calendar").toggle();
if($(".calendarChevron").hasClass("fa-chevron-down")){
   $(".calendarChevron").addClass("fa-chevron-right");
   $(".calendarChevron").removeClass("fa-chevron-down");
}
else{
    $(".calendarChevron").removeClass("fa-chevron-right");
   $(".calendarChevron").addClass("fa-chevron-down");
}
$(".calendar").width($(".calendardiv").width()+30);
$(".calendar").height($(".calendar").width()/1.4);
//console.log($(".calendardiv").width());
//console.log($(".calendar").width());
});

//////////////TOGGLE QUESTION/////////////////////
$(".questionToggle").on('click',function(){
   $(".question").toggle();
if($(".questionChevron").hasClass("fa-chevron-down")){
   $(".questionChevron").addClass("fa-chevron-right");
   $(".questionChevron").removeClass("fa-chevron-down");
}
else{
    $(".questionChevron").removeClass("fa-chevron-right");
   $(".questionChevron").addClass("fa-chevron-down");
}
$(".question").width($(".questiondiv").width()+30);
$(".question").height($(".question").width()/1.4);
//console.log($(".questiondiv").width());
//console.log($(".question").width());
});

//////////////CHAT TOGGLE/////////////////////
$(".chatToggle").on('click',function(){
   $(".chatTog").toggle();
if($(".chatChevron").hasClass("fa-chevron-down")){
   $(".chatChevron").addClass("fa-chevron-right");
   $(".chatChevron").removeClass("fa-chevron-down");
}
else{
    $(".chatChevron").removeClass("fa-chevron-right");
   $(".chatChevron").addClass("fa-chevron-down");
}
});
//////////////CHAT2 TOGGLE/////////////////////
$(".chat2Toggle").on('click',function(){
   $(".chatTog2").toggle();
if($(".chatChevron2").hasClass("fa-chevron-down")){
   $(".chatChevron2").addClass("fa-chevron-right");
   $(".chatChevron2").removeClass("fa-chevron-down");
}
else{
    $(".chatChevron2").removeClass("fa-chevron-right");
   $(".chatChevron2").addClass("fa-chevron-down");
}
});
