// chrome.runtime.id returns the id of chrome extension.

hello.init({
  google: '216563153005-rf4vuggusohpth9qm5korfclfo8lah39.apps.googleusercontent.com'
}, {redirect_uri: 'https://'+chrome.runtime.id+'.chromiumapp.org/src/html/popup.html'
})

//redirect URL needs to change


