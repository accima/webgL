<?php
  
  $f = $_REQUEST['url'];
	if(file_get_contents("$f")!=false){
	  echo file_get_contents("$f");
	}
?>
