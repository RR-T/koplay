// Back button exit handler for Tizen TV remote
// Chrome 63 compatible — no ?., ??, arrow functions in event handlers kept simple
(function () {
    var overlay = document.getElementById('exit-overlay');
    var btnYes = document.getElementById('btn-yes');
    var btnNo = document.getElementById('btn-no');
    var focusTrap = document.getElementById('focus-trap');
    var focusIndex = 1; // 0 = Yes, 1 = No (default to No)
    var buttons = [btnYes, btnNo];
    var isVisible = false;

    // Keep focus on the trap so remote key events reach the parent page
    focusTrap.focus();

    function updateFocus() {
        for (var i = 0; i < buttons.length; i++) {
            if (i === focusIndex) {
                buttons[i].className = buttons[i].className.indexOf('exit-btn-gap') !== -1
                    ? 'exit-btn exit-btn-gap focused'
                    : 'exit-btn focused';
            } else {
                buttons[i].className = buttons[i].className.indexOf('exit-btn-gap') !== -1
                    ? 'exit-btn exit-btn-gap'
                    : 'exit-btn';
            }
        }
    }

    function showOverlay() {
        focusIndex = 1;
        updateFocus();
        overlay.className = 'visible';
        isVisible = true;
    }

    function hideOverlay() {
        overlay.className = '';
        isVisible = false;
        focusTrap.focus();
    }

    function exitApp() {
        try {
            tizen.application.getCurrentApplication().exit();
        } catch (e) {
            window.close();
        }
    }

    document.addEventListener('keydown', function (e) {
        var BACK = 10009;
        var LEFT = 37;
        var RIGHT = 39;
        var ENTER = 13;

        if (e.keyCode === BACK) {
            e.preventDefault();
            if (isVisible) {
                hideOverlay();
            } else {
                showOverlay();
            }
            return;
        }

        if (!isVisible) return;

        if (e.keyCode === LEFT) {
            focusIndex = 0;
            updateFocus();
        } else if (e.keyCode === RIGHT) {
            focusIndex = 1;
            updateFocus();
        } else if (e.keyCode === ENTER) {
            if (focusIndex === 0) {
                exitApp();
            } else {
                hideOverlay();
            }
        }
    });
})();
