
var autoFinishScore = true;
var sendInteractionsScorm = false;

var API = null; /* SCORM API 2004 */
var callAPI = 0;
var LastScore = 0;

//$.getScript('https://cdnjs.cloudflare.com/ajax/libs/amplifyjs/1.1.2/amplify.min.js', function()
//{
	//logconsole("Amplify is include");
//});

//Log Console
function logconsole(msg){

	if (typeof console === "undefined" || typeof console.log === "undefined"){
		
	}else{
		console.log(msg)
	}

}

/* Check SCORM API or AlterScorm */
function findAPI(win){

	callAPI = callAPI + 1;

	try{

		if (typeof(win.API_1484_11) != "undefined") {
			if(win.API_1484_11!=null){
				API = win.API_1484_11;
				logconsole("FIND win.API_1484_11");
				return true;
			}
		}
		
		while ((win.API_1484_11 == null) && (win.parent != null) && (win.parent != win) && callAPI<10)
		{
			
			var alterwin = win.parent;
			
			if (typeof(alterwin.API_1484_11) != "undefined") {
				if(alterwin.API_1484_11!=null){
					API = alterwin.API_1484_11;
					logconsole("FIND win.API_1484_11");
					return true;
				}
			}
			
			callAPI = callAPI + 1;

		}
		
		callAPI = 0;
		
		while ((win.API == null) && (win.parent != null) && (win.parent != win) && callAPI<10)
		{
			win = win.parent;
			logconsole("win = win.parent");

			callAPI = callAPI + 1;

		}
		
		API = win.API;
		
	}catch(exception){
		
		logconsole("findAPI error");
		return false;
		
	}

}

/* initialize the SCORM API */
function initAPI(win){
	
	logconsole("initAPI start");
	
	try{

		/* look for the SCORM API up in the frameset */
		findAPI(win);
		
		/* if we still have not found the API, look at the opener and its frameset */
		if ((API == null) && (win.opener != null))
		{
			findAPI(win.opener);
		}
		if(API==undefined) {
			alert("API not found");
			if(!haveLocalFileUrl()){
				top.close();
			}
			
		}
		logconsole("initAPI end");

	}catch(exception){

		logconsole("findAPI error");
		return false;

	}

}

var ScormSubmitted = false; //use this to check whether LMSFinish has been called later.

function ScormStartCom(){
	
	initAPI(window);
	
	if (API != null){
		
		//SCORM 1.2
		if (typeof(API.LMSInitialize) != "undefined") {
			API.LMSInitialize(''); 
			API.LMSSetValue('cmi.core.lesson_status', 'incomplete');
			API.LMSSetValue('cmi.core.score.min', 0);
			API.LMSSetValue('cmi.core.score.max', 100);
			API.LMSCommit('');
			logconsole("Initialize SCORM 1.2");
		}
		
		//SCORM 2004
		if (typeof(API.Initialize) != "undefined"){
			var r = API.Initialize('');
			if(r==true||r=='true'){
				API.SetValue('cmi.core.lesson_status', 'incomplete');
				API.SetValue('cmi.core.score.min', 0);
				API.SetValue('cmi.core.score.max', 100);
				API.Commit('');
				API.SetValue('cmi.lesson_status', 'incomplete');
				API.SetValue('cmi.score.min', 0);
				API.SetValue('cmi.score.max', 100);				
				API.Commit('');
				logconsole("Initialize SCORM 2004");
			}else{
				logconsole("Initialize Error");
			}
			
		}
		
		var pauseBtn = '<div onClick="quitScormProcess();" style="position:absolute;right:2px;top:0px;background:white;color:blue;cursor:pointer;" >';
		pauseBtn += '||';
		pauseBtn += '</div>'
		//$('body').append(pauseBtn);
		
		setTimeout(function(){
			//ScormProgressLoad();
		},200);
		
	}
	
}

function quitScormProcess(){
	
	if(lastPage0>0){
		
		ScormProgressSave(true);
		
		try{
			if (typeof(API.LMSSetValue) != "undefined") {
				API.LMSSetValue("cmi.core.exit",'suspend');
				API.LMSCommit('');
			}
			if (typeof(API.SetValue) != "undefined") {
				API.SetValue("cmi.exit",'suspend');
				API.Commit('');
			}
		}catch(exception){

		}
	}
}

//Sauvegarde automatique
function ScormProgressSave(haveLoop){
	
	if(lastPage0>0){
		
		try{
			
			if(typeof(API.LMSSetValue)!="undefined"){
				try{
					API.LMSSetValue('cmi.core.lesson_location',lastPage0);
					API.LMSSetValue("cmi.core.exit",'suspend');
					API.LMSCommit('');
					logconsole("API.LMSSetValue cmi.core.lesson_location:" + lastPage0);
				}catch(exception){
					
				}
				
			}
			
			if(typeof(API.SetValue)!="undefined"){
				try{
					
					API.SetValue('cmi.location',lastPage0);
					API.SetValue('cmi.suspend_data',lastPage0);
					API.SetValue("cmi.exit",'suspend');
					API.Commit('');
					logconsole("API.SetValue cmi.location:" + lastPage0);
					
				}catch(exception){
				}
				
			}
			
		}catch(exception){
			logconsole("ScormProgressSave error");
			return false;	
		}
	}
	
	if(haveLoop){
		//setTimeout(function(){ScormProgressSave(true); },120000);
	}
	
}
//setTimeout(function(){ ScormProgressSave(true);},120000);

function ScormProgressLoad(){
	
	var xmlForSaba = "";
	var lessonLocation = 0;
	
	try{
		if (typeof(API.LMSGetValue) != "undefined") {
			lessonLocation = parseInt(API.LMSGetValue("cmi.core.lesson_location"));
		}
		if (typeof(API.GetValue) != "undefined") {
			lessonLocation = parseInt(API.GetValue("cmi.location"));
		}
	}catch(exception){

	}

	if(isNaN(lessonLocation)){
		if (typeof(API.GetValue) != "undefined") {
			lessonLocation = parseInt(API.GetValue("cmi.suspend_data"));
		}
		if(isNaN(lessonLocation)){
			lessonLocation = 0;
		}
	}
	
	logconsole("ScormProgressLoad lesson_location:" + lessonLocation);
	
	if(lessonLocation>0){
		
		lastPage0 = lessonLocation;
		lastPage1 = lessonLocation;
		xmlForSaba = getXmlMinimalSabaLMS();
		
		var idsession = getIDProgressionAll();
		amplify.store(idsession,xmlForSaba);
		var dat = 'Sauvegarde';
		amplify.store(idsession + '-date',dat);
		amplify.store(idsession + '-page',lessonLocation);
		saveprogression = true;
		logconsole("loadProgressionAll();");
		loadProgressionAll();
		saveprogression  = false;
	}

}

function ScormInteractionCom(n,id,type,latency,result,answers,description,correctAnswer){
	
	if(sendInteractionsScorm){

		//n : Ludiscape transmet le numéro de l'intéraction
		//id : Ludiscape transmet une série de données pour cette chaîne afin d'identifier la question
		//type : Type de question : qcm tcm drop etc
		//latency : Temps de réponse
		//result : Indique si l'utilisateur a répondu correctement à la question ou non.
		//answers : reponse de l'apprenant
		if (API != null){
			
			if (API){

				if(type=='qcm'||type=='qcmunique'||type=='choice'){
					type='choice';
				}else{
					type='performance';
				}
				
				type='choice';
				
				var FormatAnswersScorm = answers;
				if (FormatAnswersScorm.length > 250){
					FormatAnswersScorm = FormatAnswersScorm.substr(0, 250);
				}
				
				var FormatcorrectAnswer = correctAnswer;
				FormatcorrectAnswer = escapeSco(FormatcorrectAnswer);
				if (FormatcorrectAnswer.length > 150){
					FormatcorrectAnswer = FormatcorrectAnswer.substr(0, 150);
				}

				if (typeof(API.LMSSetValue) != "undefined") {

					try{
						API.LMSSetValue('cmi.objectives.' + n + '.id', id);
					}catch(exception){
					}
					
					try{
					API.LMSSetValue('cmi.interactions.' + n + ".objectives.0.id", id ); 
					}catch(exception){}
					
					try{
						
						API.LMSSetValue('cmi.objectives.' + n + '.status', API.LMSGetValue('cmi.core.lesson_status'));
						API.LMSSetValue('cmi.objectives.' + n + '.score.min', '0');
						API.LMSSetValue('cmi.objectives.' + n + '.score.max', '100');
						
						if(result){
							API.LMSSetValue('cmi.objectives.' + n + '.score.raw', '100');
						}else{
							API.LMSSetValue('cmi.objectives.' + n + '.score.raw', '0');
						}
						
					}catch(exception){}
					
					try{
						
						API.LMSSetValue('cmi.interactions.' + n + '.id', id)
						API.LMSSetValue('cmi.interactions.' + n + '.type', type);
						API.LMSSetValue('cmi.interactions.' + n + '.latency', latency);
					}catch(exception){}

						
					try{
						if(result){
							API.SetValue('cmi.interactions.' + n + '.result', 'correct');
						}else{
							API.SetValue('cmi.interactions.' + n + '.result', 'incorrect');
						}
					}catch(exception){}
					
					try{
						API.LMSSetValue('cmi.interactions.' + n + '.result', result);
					}catch(exception){}
					
					try{
					API.LMSSetValue('cmi.interactions.' + n + '.student_response', FormatAnswersScorm);}catch(exception){}
					try{
					API.LMSSetValue('cmi.interactions.' + n + '.student_response_text', FormatAnswersScorm);}catch(exception){}
					try{
					API.LMSSetValue('cmi.interactions.' + n + '.description', description);}catch(exception){}
					
					try{
					API.LMSSetValue('cmi.session_time', MillisecondsToTime((new Date()).getTime() - ScormStartTime));
					}catch(exception){}
					
					try{
					API.Commit('');}catch(exception){}
					
				}
				
				if (typeof(API.Initialize) != "undefined") {
					
					//Hack e-doceo
					try{
						if (typeof(API.UpdateInteraction) != "undefined") {
							API.UpdateInteraction('interaction.id',n,id);
						}
					}catch(exception){}
					
					try{
					API.SetValue('cmi.objectives.' + n + '.id', id);}catch(exception){}
					try{
					API.SetValue('cmi.objectives.' + n + '.status', API.LMSGetValue('cmi.core.lesson_status'));}catch(exception){}
					try{
					API.SetValue('cmi.objectives.' + n + '.score.min', '0');}catch(exception){}
					try{
					API.SetValue('cmi.objectives.' + n + '.score.max', '100');}catch(exception){}
					try{
					API.SetValue('cmi.objectives.' + n + '.score.raw', '100');}catch(exception){}
					
					try{
					API.SetValue('cmi.interactions.' + n + '.id', id);
					}catch(exception){}
					
					try{
					API.SetValue('cmi.interactions.' + n + '.type', type);
					}catch(exception){}
					
					try{
					API.SetValue('cmi.interactions.' + n + '.latency', MillisecondsToTime2004(latency));
					}catch(exception){}
					
					try{
					API.SetValue('cmi.interactions.' + n + '.latency', latency);
					}catch(exception){}
					
					try{
						if(result=='true'){
							API.SetValue('cmi.interactions.' + n + '.result', 'correct');
						}else{
							API.SetValue('cmi.interactions.' + n + '.result', 'incorrect');
						}
					}catch(exception){}
					
					try{
					API.SetValue('cmi.interactions.' + n + '.result', result);}catch(exception){}
					
					try{
					API.SetValue('cmi.interactions.' + n + '.student_response', FormatAnswersScorm);}catch(exception){}
					
					try{
					API.SetValue('cmi.interactions.' + n + '.student_response_text', FormatAnswersScorm);}catch(exception){}
					
					try{
						if (FormatcorrectAnswer != undefined && FormatcorrectAnswer != null && FormatcorrectAnswer != ""){
							API.SetValue("cmi.interactions." + n + ".correct_responses.0.pattern", FormatcorrectAnswer);
						}
					}catch(exception){}
					
					try{
						var d = new Date();
						API.SetValue("cmi.interactions." + n + ".timestamp", ISODateString(d))
						logconsole("cmi.interactions." + n + ".timestamp : " + ISODateString(d));
					}catch(exception){}
					
					try{
					API.Commit('');}catch(exception){}
					
					//Temps
					try{
						var timefull = MillisecondsToTime2004((new Date()).getTime() - ScormStartTime);
						API.SetValue('cmi.core.session_time', timefull);
						API.Commit('');
					}catch(exception){}
					try{
						var timefull = MillisecondsToTime2004((new Date()).getTime() - ScormStartTime);
						API.SetValue('cmi.session_time', timefull);
						API.Commit('');
					}catch(exception){}
					
				}
			}
		}
	
	}
	
}

function sendLMSFinish(){
	if('function'==typeof(CheckLMSFinish)){
		ScormSubmitted = false;
		globalCompteurDecompt = false;
		CheckLMSFinish();
		$("#main").animate({marginTop : "-750px",height:"100px",opacity: 0},1500);
	}
}

function CheckLMSFinish(){
	
	//cmi.completion_status 
	var cps = 'completed';
	if(LastScore<76){
		cps = 'incomplete';
	}
	
	if (API != null){
		if (ScormSubmitted == false){
			//SCORM
			if (typeof(API.LMSCommit) != "undefined"){
				
				try{
					
					API.LMSSetValue('cmi.core.session_time', MillisecondsToTime((new Date()).getTime()-ScormStartTime));
					API.LMSSetValue('cmi.core.lesson_status',cps);
					/*
					API.LMSSetValue('cmi.lesson_status',cps);
					API.LMSSetValue('cmi.completion_status',cps);
					API.LMSSetValue('cmi.core.success_status', 'passed');
					API.LMSSetValue('cmi.success_status','passed');
					*/
					API.LMSCommit('');
				}catch(exception){}
				
				if(typeof(API.LMSFinish) != "undefined"){
					//API.LMSFinish('');
				}
			}
			//SCORM 2004
			if (typeof(API.Terminate) != "undefined"){
				
				try{
					/*
					API.SetValue('cmi.core.lesson_status',cps);
					API.SetValue('cmi.lesson_status',cps);
					*/
					API.SetValue('cmi.completion_status',cps);
					API.Commit('');
				}catch(exception){}
				/*try{
					API.SetValue('cmi.success_status','passed');
				}catch(exception){}*/
				try{
					var timefull = MillisecondsToTime2004((new Date()).getTime() - ScormStartTime);
					API.SetValue('cmi.core.session_time', timefull);
					API.SetValue('cmi.session_time', timefull);
					logconsole("session_time = " + timefull);
					API.Commit('');
				}catch(exception){}
				
				API.Terminate('');
				logconsole("Terminate CheckLMSFinish");
			}
			ScormSubmitted = true;
			globalCompteurDecompt = false;
		}
	}
}

function CheckLMSLearnerName(){
	
	var userN = '';
	
	//SCORM 2004
	if (API != null){
		
		logconsole("CheckLMSLearnerName API.data.learner_name");
		if (typeof(API.data)!="undefined"){
			if (typeof(API.data.learner_name)!="undefined"){
				userN = API.data.learner_name;
			}
		}
		
		logconsole("cmi.core.student_name");
		if(userN==''){
			if (typeof(API.LMSGetValue)!="undefined"){
				userN = API.LMSGetValue("cmi.core.student_name") ;
			}
		}
		
		logconsole("CheckLMSLearnerName cmi.student_name");
		if(userN==''){
			if (typeof(API.LMSGetValue)!="undefined"){
				userN = API.LMSGetValue("cmi.student_name");
			}
		}
		
		logconsole("CheckLMSLearnerName cmi.core.student_id");
		if(userN==''){
			if (typeof(API.LMSGetValue)!="undefined"){
				userN = API.LMSGetValue("cmi.core.student_id");
			}
		}
		
	}

	return userN;

}

function SetScormIncomplete(){
	
	if (ScormSubmitted == true){
		return;
	}
	
	SetScormScore();
	
	if (API != null){
		//SCORM 1.2
		if (typeof(API.LMSSetValue) != "undefined") {
			API.LMSSetValue('cmi.core.lesson_status', 'incomplete');
			API.LMSSetValue('cmi.core.session_time', MillisecondsToTime((new Date()).getTime() - ScormStartTime));
			API.LMSCommit('');
		}
		//SCORM 2004
		if (typeof(API.Terminate) != "undefined") {
			API.SetValue('cmi.core.lesson_status', 'incomplete');
			API.SetValue('cmi.core.session_time', MillisecondsToTime((new Date()).getTime() - ScormStartTime));
			API.SetValue('cmi.lesson_status', 'incomplete');
			API.SetValue('cmi.session_time', MillisecondsToTime((new Date()).getTime() - ScormStartTime));
			API.Commit('');
		}
	}
}

var isScormFinish = false;

function SetScormComplete(){
	
	logconsole("SetScormComplete");
	
	if(isScormFinish==false){
		
		if (API != null){
			
			//SCORM 1.2
			if (typeof(API.LMSSetValue) != "undefined") {

				SetScormScore();
				API.LMSCommit('');
				
				if(autoFinishScore){
					CheckLMSFinish();
					//API.LMSFinish('');
					isScormFinish = true;
				}
			}
			
			//SCORM 2004
			if (typeof(API.Terminate) != "undefined") {
				
				SetScormScore();
				API.Commit('');
				
				if(autoFinishScore){
					CheckLMSFinish();
					API.Terminate('');
					logconsole("Terminate SetScormComplete");
					isScormFinish = true;
				}
			}
			ScormSubmitted = true;

		}

	}

}

var ScormStartTime = (new Date()).getTime();
var SuspendData = '';

function SetScormTimedOut(){
	if (API != null){
		if (ScormSubmitted == false){
			
			//SCORM 1.2
			if (typeof(API.LMSSetValue) != "undefined") {
				SetScormScore();
				API.LMSSetValue('cmi.core.exit', 'time-out'); 
				API.LMSCommit('');
				CheckLMSFinish();
			}
			//SCORM 2004
			if (typeof(API.Terminate) != "undefined") {
				SetScormScore();
				API.SetValue('cmi.core.exit', 'time-out');
				API.SetValue('cmi.exit', 'time-out'); 
				API.Commit('');
				API.Terminate('');
			}

		}
	}
}

function SetScormComments(m){
	if (API != null){
		if (ScormSubmitted == false){

			//SCORM 1.2
			if (typeof(API.LMSSetValue) != "undefined") {
				API.LMSSetValue('cmi.comments', m); 
				API.LMSCommit('');
			}
			//SCORM 2004
			if (typeof(API.Terminate) != "undefined") {
				API.SetValue('cmi.comments', m); 
				API.Commit('');
			}
			
		}
	}
} 

//TIME RENDERING FUNCTION
function MillisecondsToTime(Seconds){
	Seconds = Math.round(Seconds/1000);
	var S = Seconds % 60;
	Seconds -= S;
	if (S < 10){S = '0' + S;}
	var M = (Seconds / 60) % 60;
	if (M < 10){M = '0' + M;}
	var H = Math.floor(Seconds / 3600);
	if (H < 10){H = '0' + H;}
	return H + ':' + M + ':' + S;
}

//TIME RENDERING FUNCTION
function MillisecondsToTime2004(Seconds){
	Seconds = Math.round(Seconds/1000);
	var S = Seconds % 60;
	Seconds -= S;
	if (S < 10){S = '0' + S;}
	var M = (Seconds / 60) % 60;
	if (M < 10){M = '0' + M;}
	var H = Math.floor(Seconds / 3600);
	if (H < 10){H = '0' + H;}
	return 'PT' + H + 'H' + M + 'M' + S + 'S';
}

//ISO Date String
function ISODateString(d) {
    function pad(n) {return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'
         + pad(d.getUTCMonth()+1)+'-'
         + pad(d.getUTCDate())+'T'
         + pad(d.getUTCHours())+':'
         + pad(d.getUTCMinutes())+':'
         + pad(d.getUTCSeconds())+'Z'
}

//SetScormScore
function SetScormScore(score){
	
	if(typeof(score) != "undefined"){
			
		if (score != null){
			if (API != null){
				
				var oldScore = 0;
				
				try{
					if (typeof(API.GetValue) != "undefined") {
						oldScore = parseFloat(API.GetValue('cmi.core.score.raw'));
					}
					if (typeof(API.LMSGetValue) != "undefined") {
						oldScore = parseFloat(API.LMSGetValue('cmi.core.score.raw'));
					}
				}catch(exception){

				}
				if(isNaN(oldScore)){
					oldScore = 0;
				}
				if(score>LastScore){
					LastScore = score;
				}
				
				if(LastScore>oldScore){
					//SCORM 1.2
					if (typeof(API.LMSSetValue) != "undefined") {
						API.LMSSetValue('cmi.core.score.raw', score);
					}
					if (typeof(API.LMSSetValue) != "undefined") {
						API.LMSSetValue('cmi.core.session_time', MillisecondsToTime((new Date()).getTime() - ScormStartTime));
					}
					if (typeof(API.SetValue) != "undefined") {
						API.SetValue('cmi.core.session_time', MillisecondsToTime((new Date()).getTime() - ScormStartTime));
						API.SetValue('cmi.session_time', MillisecondsToTime((new Date()).getTime() - ScormStartTime));
					}
					//SCORM 2004
					if (typeof(API.Terminate) != "undefined") {
						API.SetValue('cmi.core.score.raw', score);
						API.SetValue('cmi.score.raw', score);
						API.SetValue('cmi.score.scaled', score/100);
						logconsole("SetScormScore " + score);
					}
				}
				
			}
			
		}
		
	}
	
}

function escapeSco(unsafe){
	
	unsafe = unsafe.toLowerCase();
	unsafe = unsafe.replace(/,/g, "virgulebase")
	unsafe = unsafe.replace(/[^a-zA-Z0-9]/g,'-');
	unsafe = unsafe.replace(/virgulebase/g, ",")
	return unsafe;
	
}

function getXmlMinimalSabaLMS(){
	
	var x = '<?xml version="1.0" ?><interactions>';
	x += '<ViewerAfterBilan>false</ViewerAfterBilan>';
	x += '<lastPageMemId>' + lastPage0 + '</lastPageMemId>';
	x += '<ViewerAfterBilanList>' + ViewerAfterBilanList + '</ViewerAfterBilanList>';
	x += '<initExam>' + initExam + '</initExam>';
	x += '<actualExamId>' + actualExamId + '</actualExamId>';
	x += '<actualExamIdScreen>' + actualExamIdScreen + '</actualExamIdScreen>';
	x += '<lastExamId>' + lastExamId + '</lastExamId>';
	x += '<lastAfterExamId>' + lastAfterExamId + '</lastAfterExamId>';
	x += '<qcmRandomize>' + qcmRandomize + '</qcmRandomize>';
	
	x += '<LUDIlife>' + LUDIlife + '</LUDIlife>';
	x += '<LUDImoney>' + LUDImoney + '</LUDImoney>';
	x += '<LUDIscore>' + LUDIscore + '</LUDIscore>';

	if(Variable1!=''){
		x += "<Variable1><![CDATA[" + Variable1 + "]]></Variable1>";
	}
	
	x += '</interactions>';
	
	return x;
	
}