$(".bStartnow").on('click',function(){
   $(".intro").fadeOut(800); 
});

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
console.log($(".mapdiv").width());
console.log($(".map").width());
});

$(".map").width($(".mapdiv").width()+30);
$(".map").height($(".map").width()/1.4);
console.log($(".mapdiv").width());
console.log($(".map").width());


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