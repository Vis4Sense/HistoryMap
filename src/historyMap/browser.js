/**
 * captures user actions (browser) in the Chrome browser.
 * part of the 'browser controller'.
 */

// Pseudo code
// function onTabCreation(newTab) {
//     addNode(newTab);
// }

// function onTabUpdate(tab) {
//     if ('loading') {
// if (non-redireciton) addNode(tab);
// else {update existing node}; // redirection
// }
//     if (title updated) send the new title to historyMap.js through an event;
//     if (favIconUrl updated) send the new favIconUrl to historyMap.js through an event;
// }

// function addNode(tab) {
//     create a new node with  the information from 'tab';
//     send the new 'node' to historyMap.js through an event;
// }


historyMap.controller.browser = function () {
	// const module = {};

	var nodeId = 0; // can't use tab.id as node id because new url can be opened in the existing tab
	var tab2node = {}; // the Id of the latest node for a given tab
	var tabUrl = {}; // the latest url of a given tabId
	var isTabCompleted = {}; // whether a tab completes loading (for redirection detection).

	var nodes = historyMap.model.nodes;
	// var redraw = historyMap.view.redraw(); // why this doesn't work?

	// not recording any chrome-specific url
	const ignoredUrls = [
			'chrome://',
			'chrome-extension://',
			'chrome-devtools://',
			'view-source:',
			'google.co.uk/url',
			'google.com/url',
			'localhost://'
		],
		bookmarkTypes = ['auto_bookmark'],
		typedTypes = ['typed', 'generated', 'keyword', 'keyword_generated'];

	chrome.tabs.onCreated.addListener(function (tab) {

		if (!isIgnoredTab(tab)) {
			// console.log('newTab -', 'tabId:'+tab.id, ', parent:'+tab.openerTabId, ', url:'+tab.url, tab); // for testing

			addNode(tab, tab.openerTabId);
			isTabCompleted[tab.id] = false;
		}
	});


	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

		if (!isIgnoredTab(tab)) {

			// console.log('tab update',tabId,changeInfo,tab);

			var node = nodes.getNode(tab2node[tab.id]);

			// 'changeInfo' information:
			// - status: 'loading': if (tabCompleted) {create a new node} else {update exisiting node}
			if (changeInfo.status == 'loading' && tab.url != tabUrl[tabId]) {

				if (tab2node[tabId] !== undefined && !isTabCompleted[tabId]) { // redirection
					node.text = tab.title || tab.url;
					node.url = tab.url;
					historyMap.view.redraw();

					tabUrl[tabId] = tab.url;
				} else { // not redirection
					addNode(tab, tab.id);
				}
			}

			// - title: 'page title', {update node title}
			if (changeInfo.title) {
				node.text = tab.title;
				historyMap.view.redraw();
			}

			// - favIconUrl: url, {udpate node favIcon}
			if (changeInfo.favIconUrl) {
				node.favIconUrl = tab.favIconUrl;
				historyMap.view.redraw();
			}

			// - status: 'complete', {do nothing}
			if (changeInfo.status == 'complete') {
				isTabCompleted[tabId] = true;
			}
		}
	});

	function addNode(tab, parent) {

		const title = tab.title || tab.url;
		const time = new Date();
		// const node = {
		// 	id: nodeId,
		// 	tabId: tab.id,
		// 	time: time,
		// 	url: tab.url,
		// 	text: title,
		// 	favIconUrl: tab.favIconUrl,
		// 	parentTabId:parent,
		// 	from: tab2node[parent]
		// };
		const node = new Node(nodeId, tab.id, time, tab.url, title, tab.favIconUrl, parent, tab2node[parent]);

		tab2node[tab.id] = nodeId;
		tabUrl[tab.id] = tab.url;
		isTabCompleted[tab.id] = false;

		nodeId = nodes.addNode(node);
		historyMap.view.redraw();

		// console.log('added new node',node);

		// Update with visit type
		if (tab.url) {
			chrome.history.getVisits({
				url: tab.url
			}, results => {
				// The latest one contains information about the just completely loaded page
				const type = results && results.length ? _.last(results).transition : undefined;

				nodes.getNode(tab2node[tab.id]).type = type;
			});
		}
	}

	/* Additional Functions for Checking */

	function isIgnoredTab(tab) {
		return ignoredUrls.some(url => tab.url.includes(url));
	}

}

// Made by Reday Yahya | @RedayY
// JavaScript Document for Login Functionality and popup layout control


// //API (Save and Load) specific Variables
// let baseURL = "https://sensemap-api.herokuapp.com/";
// let APIKey;
// let apiinput;
// let DBSessionPointer;

// function google_Login() {
// 	// HelloJS network identifier
// 	var google = hello('google');

// 	// Forcing E-Mail out of profile Object
// 	google.login({
// 		scope: 'email',
// 		force: true
// 	}).then(function () {
// 		return google.api('me');
// 	})
// };

// function google_Logout() {
// 	var answer = confirm("Logging Out will reload SenseMap, do you wish to Continue?")
// 	if (answer) {
// 		hello('google').logout().then(function () {
// 			alert('Signed out');
// 			btn_reset();
// 			LoggedIn = false;
// 			location.reload();
// 		}, function (e) {
// 			alert('Signed out error: ' + e.error.message);
// 		});
// 	};
// }

// Listens to Login requests and executes functions upon verification


function openSensemap() {
	chrome.windows.create({
		'url': 'src/historyMap/historyMap.html',
		'type': 'popup'
	}, function (window) {});
};

// window.onload = function button_config() {
// 	saveProfile();
// 	btn_reset();
// 	//btn_pause_start_conf();
// 	chrome.tabs.query({
// 		'url': 'chrome-extension://' + chrome.runtime.id + '/src/historyMap/historyMap.html'
// 	}, function (results) {
// 		if (results.length == 0) {
// 			openSensemap();
// 		}
// 	});

// };

function btn_reset() {
	document.getElementById("btn_logout").disabled = true;
	document.getElementById("btn_login").style.color = "darkmagenta";
	document.getElementById("btn_logout").style.color = "red";
}

function btn_format() {
	document.getElementById("btn_login").disabled = true;
	document.getElementById("btn_logout").disabled = false;
	document.getElementById("btn_logout").style.color = "darkmagenta";
	document.getElementById("btn_login").style.color = "red";

};


function draw_profile() {
	hello('google').api('me').then(function (upp) {
		document.getElementById("networkName").innerHTML = "<p>" + upp.name;
		document.getElementById("Image").innerHTML = "<img src='" + upp.thumbnail + "'id='profileIMG'/>";
	})
}

function saveProfile() {
	localStorage.setItem("UserProfile", JSON.stringify(UserProfile));
	if (localStorage.getItem('ProfileName') === null) {

		//stores Image and Profile E-Mail in localstorage

		profilename = UserProfile.name;
		profileimg = UserProfile.thumbnail;
		console.log(profilename + " " + profileimg)

		localStorage.setItem("ProfileName", profilename);
		localStorage.setItem("ProfileIMGURL", profileimg);

		draw_profile();

	} else {

		ProfileName = localStorage.getItem('ProfileName');
		ProfilePicture = localStorage.getItem('ProfileIMGURL');

		document.getElementById("networkName").innerHTML = "<p>" + ProfileName + "</p>";
		document.getElementById("Image").innerHTML = "<img src='" + ProfilePicture + "'id='profileIMG'/>";

	}
}

//var little_helper = 'https://' + chrome.runtime.id + '.chromiumapp.org/src/UserLogin/popup.html';