/**
 * r3bb
 * ~~~~
 * 
 * jQuery plugin that provides a tiny (not tiny in the sense of tinyMCE, but
 * really tiny) WYSIWYG-Editor that outputs BB-Code instead of HTML. This way
 * it's much easier to display this without worrying about correct escaping.
 *
 * :copyright: date, Pascal Hartig <phartig@rdrei.net>
 * :license: GPL v3, see doc/LICENSE for more details.
 */

/*global jQuery, window */
/*jslint white: true, onevar: true, browser: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true */
"use strict";

(function ($) {
    $.fn.r3bb = function (options) {
        var settings = {
            debug: true
        },
            markup = '<div class="r3bb"><nav><button class="btn-bold">B</button><button class="btn-italic">I</button><button class="btn-underline">U</button></nav></div>';

        $.extend(settings, options);

        // This allows us to 'unobstrusively' debug everything regardless of
        // whether firebug or webkit developer kit is available.
        function log() {
            if (window.console !== undefined && $.isFunction(console.log) &&
                settings.debug) {
                console.log.apply(console.log, arguments);
            }
        }

        log("Debug mode enabled.");

        return $(this).each(function () {
            var $this = $(this),
                $rte = null,
                $r3bb = null,
                // Save original dimensions
                twidth = $this.css('width'),
                theight = $this.css('height'),
                editor = null;

            function on_button_clicked() {
                // Detect button type on class name.
                var btn_type = $(this).attr('class').split('btn_')[1];

                switch (btn_type) {
                case 'bold':
                    editor.execCommand('bold');
                    break;
                default:
                    throw {message: "Unknown button pressed!"};
                }
                
            }

            // Hide the original textarea.
            $this.hide();

            // Insert the r3bb markup instead.
            $r3bb = $(markup).insertBefore($this);

            // And insert a freshly created iframe inside.
            $rte = $("<iframe class=\"r3bbif\" />").css({
                // Copy text area's original dimensions
                width: twidth,
                height: theight
            }).appendTo($r3bb);

            // Waiting for iframe to load
            window.editor = editor = $rte.get(0).contentWindow.document;
            window.setTimeout(function () {

                log("RTE loaded. Enabling design mode for ", editor);
                editor.designMode = 'on';
                $(editor).find("body").html("Hello World!");
            }, 500);
        });
    };
}(jQuery));

