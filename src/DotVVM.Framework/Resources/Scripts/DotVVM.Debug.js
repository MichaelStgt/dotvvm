(function($) {
    var debugWindow = $(document.body)
        .append("<div id='debugWindow'><h1></h1><button type='button' id='closeDebugWindow'>Close</button><iframe /><div id='debugFooter'></div></div>")
        .find("#debugWindow");

    debugWindow.css({
        display: "none",
        flexFlow: "column",
        zIndex: 2147483647,
        position: "fixed",
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        top: 0,
        left: 0
    });

    var notificationWindow = $(document.body)
        .append("<div id='debugNotification'></div>")
        .find("#debugNotification");

    notificationWindow.css({
        display: "none",
        zIndex: 2147483647,
        position: "fixed",
        top: "0px",
        right: "0px",
        backgroundColor: "darkred",
        color: "white",
        fontSize: "1.0em",
        width: "400px",
        padding: "20px"
    }).click(function() {
        notificationWindow.hide(200)
    });

    debugWindow.find("#closeDebugWindow")
        .click(function() {
            debugWindow.css({ display: "none" })
        })
        .css({
            position: "absolute",
            top: 0,
            right: 0
        });
    debugWindow.find("#debugFooter")
        .css({ flex: "0 1 auto" });
    debugWindow.find("h1")
        .css({ flex: "0 1 auto" });
    debugWindow.find("iframe").css({
        flex: "1 1 auto",
        width: "100%"
    });

    dotvvm.evaluator.tryEval = function(func) {
        try {
            return func();
        } catch (error) {
            console.warn("Error '" + error + "' occured while evaluating " + func + ".");
            return null;
        }
    }

    dotvvm.events.error.subscribe(function (e) {
        console.error("DotVVM: An " + (e.handled ? "" : "un") + "handled exception returned from the server command.");
        console.log("XmlHttpRequest: ", e.xhr);
        console.log("ViewModel: ", e.viewModel);
        if (e.handled) return;
        debugWindow.find("h1").text("DotVVM Debugger: Error " + (e.xhr.status ? e.xhr.status + ": " + e.xhr.statusText + "" : "XmlHttpRequest failed, maybe internet connection is lost or url is malformed"));
        debugWindow.find("iframe").contents().find('html').html(e.xhr.responseText);
        debugWindow.css({ display: "flex" });
        e.handled = true;
    });

    function setDebugMapProperty(obj) {
        Object.defineProperty(obj, "$debugMap", {
            enumerable: false,
            configurable: true,
            get: function() {
                return dotvvm.serialization.serialize(obj)
            }
        });
    }

    function displayPostbackAbortedWarning(message) {
        notificationWindow.text(message);
        notificationWindow.show(200);
        setTimeout(function() {
            notificationWindow.hide(1000);
        }, 10000)
    }

    dotvvm.events.afterPostback.subscribe(function (e) {
        if (e.wasInterrupted) {
            if (dotvvm.validation.errors().length > 0) {
                displayPostbackAbortedWarning("Postback aborted because validation failed.");
            } else displayPostbackAbortedWarning("Postback interrupted");
        }
        setDebugMapProperty(dotvvm.viewModels[e.viewModelName]);
    });
    dotvvm.events.init.subscribe(function() {
        setDebugMapProperty(dotvvm.viewModels["root"])
    });
})(jQuery);