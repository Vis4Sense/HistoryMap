function toggleCodes(on) {
    var obj = document.getElementById('icons');

    if (on) {
      obj.className += ' codesOn';
    } else {
      obj.className = obj.className.replace(' codesOn', '');
    }
  }