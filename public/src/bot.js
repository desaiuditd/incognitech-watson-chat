/**
 * This file contains all of the web and hybrid functions for interacting with 
 * the basic chat bot dialog pane. 
 *
 * @summary   Functions for Chat Bot.
 *
 * @since     0.0.1
 *
 */
 
"use strict";

// Variables for chat and stored context specific events
var params = {  // Object for parameters sent to the Watson Conversation service
    input: '',
    context: '',
};
var watson = 'Bot';
var user = '';
var context;  // Very important. Holds all the data for the current point of the chat.

/**
 * @summary Enter Keyboard Event.
 *
 * When a user presses enter in the chat input window it triggers the service interactions.
 *
 * @function newEvent
 * @param {Object} e - Information about the keyboard event. 
 */
function newEvent(e) {
	// Only check for a return/enter press - Event 13
    if (e.which === 13 || e.keyCode === 13) {

        var userInput = document.getElementById('chatMessage');
        var text = userInput.value;  // Using text as a recurring variable through functions
        text = text.replace(/(\r\n|\n|\r)/gm, ""); // Remove erroneous characters

        // If there is any input then check if this is a claim step
		// Some claim steps are handled in newEvent and others are handled in userMessage
		if (text) {
			
			// Display the user's text in the chat box and null out input box
            displayMessage(text, user);
            userInput.value = '';
            userMessage(text);
            
        } else {

            // Blank user message. Do nothing.
			console.error("No message.");
            userInput.value = '';

            return false;
        }
    }
}

/**
 * @summary Main User Interaction with Service.
 *
 * Primary function for parsing the conversation context  object.
 *
 * @function userMessage
 * @param {String} message - Input message from user or page load.  
 */
function userMessage(message) {

    // Set parameters for payload to Watson Conversation
    params.input = {
        text: message // User defined text to be sent to service
    }; 

    // Add variables to the context as more options are chosen
    if (context) {
        params.context = context; // Add a context if there is one previously stored
        params.context.username = "Stefania";
    }

    var xhr = new XMLHttpRequest();
    var uri = '/api/bot';

    xhr.open('POST', uri, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
		
		// Verify if there is a success code response and some text was sent
        if (xhr.status === 200 && xhr.responseText) {

            var response = JSON.parse(xhr.responseText);
            var text = response.output.text[0]; // Only display the first response
            context = response.context; // Store the context for next round of questions

            console.log("Got response from Bot: ", JSON.stringify(response));
            if (!text) {
				text = 'Sorry, I was not able to help appropriately on this. But I can still be useful. Try me again!';
			}
			var str = text.replace(/\"\'/g,'');
			displayMessage(str, watson);
			var n = text.includes('"\'');
			if (n) {
				// Get two data values first.
				var regex = /\"\'/gi, result, indices = [];
				while ( (result = regex.exec(text)) ) {
					indices.push(result.index);
				}
				var operation = text.substring(indices[0] + 2, indices[1]);
				var companyName = text.substring(indices[2] + 2, indices[3]);
				switch(operation) {
					case 'news':
						// Get data from API.
						if (companyName.toLowerCase() !== 'tech crunch') {
						var jqxhr = $.get("https://api.swiftype.com/api/v1/public/engines/search.json?q='"+companyName+"'&page=1&per_page=5&facets%5Bpage%5D%5B%5D=author&facets%5Bpage%5D%5B%5D=category&facets%5Bpage%5D%5B%5D=tag&facets%5Bpage%5D%5B%5D=object_type&filters%5Bpage%5D%5Btimestamp%5D%5Btype%5D=range&spelling=always&engine_key=zYD5B5-eXtZN9_epXvoo", function(data) {
							var pages = data.records.page;
							var toDisp = "Here are top 5 headlines about "+ companyName + " <br>";
							for (var i = 0; i < pages.length; i++) {
								toDisp += "&#8226; " + pages[i].title + " <br>";
							}
							console.log(data);
							displayMessage(toDisp, watson);
						});
						} else {
							var jqxhr = $.get("https://techcrunch.com/wp-json/posts/latest", function(data) {
							var pages = data.posts;
							var toDisp = "Here are top 5 headlines from Tech Crunch <br>";
							for (var i = 0; i < 5; i++) {
								toDisp += "&#8226; " + pages[i].title + " <br>";
							}
							console.log(data);
							displayMessage(toDisp, watson);
						});
						}
						break;
					case 'Sentimental Analysis':
						// Get data from API.
						console.log('Got here');
						var jqxhr = $.get("https://api.swiftype.com/api/v1/public/engines/search.json?q='"+ companyName + "'&page=1&per_page=5&facets%5Bpage%5D%5B%5D=author&facets%5Bpage%5D%5B%5D=category&facets%5Bpage%5D%5B%5D=tag&facets%5Bpage%5D%5B%5D=object_type&filters%5Bpage%5D%5Btimestamp%5D%5Btype%5D=range&spelling=always&engine_key=zYD5B5-eXtZN9_epXvoo", function(data) {
							var posts = data.records.page;
							var sentiment = '';
							var postsContent = '';
							for(var i=0; i<posts.length;i++){
								postsContent = postsContent + " " + posts[i].content;
							}
							$.ajax({
								//The URL to process the request
								'url' : 'https://gateway-a.watsonplatform.net/calls/text/TextGetTextSentiment?apikey=1f746102ce0c84403da10b06350acc3edb04105f&outputMode=json&text=' +encodeURIComponent(postsContent),
								//The type of request, also known as the "method" in HTML forms
								//Can be 'GET' or 'POST'
								'type' : 'POST',
								//Any post-data/get-data parameters
								//This is optional
								'data' : {
									'paramater1' : 'value',
									'parameter2' : 'another value'
								},
								//The response from the server
								'success' : function(data1) {
									//You can use any jQuery/JavaScript here!!!
									console.log(data1);
									var sentiment = data1.docSentiment;
									var speechOutput = "TechCrunch holds "+ sentiment.type + " sentiment towards " + companyName + ".";
									if ( sentiment.score != '0.0' ) {
										var score = ( parseFloat(sentiment.score) < 0 ) ? ( parseFloat(sentiment.score) * -1 ).toFixed(3) : parseFloat(sentiment.score).toFixed(3);
										score = score * 100;
										speechOutput = speechOutput + " And the sentiment strength is approximately " + score + '%';
									}
									displayMessage(speechOutput, watson);
								}
							});
						});
						break;
					case 'tone':
						// Get data from API.
						break;
					default: // Do nothing!	
				}
			}

        } else {
            console.error('Server error for Conversation. Return status of: ', xhr.statusText);
        }
    };

    xhr.onerror = function() {
        console.error('Network error trying to send message!');
    };
	
	console.log(JSON.stringify(params));
    xhr.send(JSON.stringify(params));
}

/*
 * Extracting value from response.
 *
 */
 function extractText( str ){
  var ret = "";

  if ( /"/.test( str ) ){
    ret = str.match( /"(.*?)"/ )[1];
  } else {
    ret = str;
  }

  return ret;
}

/**
 * @summary Display Chat Bubble.
 *
 * Formats the chat bubble element based on if the message is from the user or from Bot.
 *
 * @function displayMessage
 * @param {String} text - Text to be dispalyed in chat box.
 * @param {String} user - Denotes if the message is from Bot or the user. 
 * @return null
 */
function displayMessage(text, user) {

    var chat = document.getElementById('chatBox');
    var bubble = document.createElement('div');
    bubble.className = 'message';  // Wrap the text first in a message class for common formatting

    // Set chat bubble color and position based on the user parameter
	if (user === watson) {
        bubble.innerHTML = "<div class='bot'>" + text + "</div>";
    } else {
        bubble.innerHTML = "<div class='user'>" + text + "</div>";
    }

    chat.appendChild(bubble);
    chat.scrollTop = chat.scrollHeight;  // Move chat down to the last message displayed
    document.getElementById('chatMessage').focus();

    return null;
}